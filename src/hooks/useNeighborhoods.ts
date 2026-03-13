import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  initializeFuseIndex,
  searchNeighborhoods,
  getCities,
  getNeighborhoodsByCity,
  normalizeLocationText,
} from "@/utils/neighborhood-search";

interface Neighborhood {
  id: string;
  city: string;
  neighborhood: string;
  fee: number;
}

/**
 * Hook to fetch and search neighborhoods
 */
export function useNeighborhoods() {
  const queryClient = useQueryClient();

  const { data: neighborhoods = [], isLoading, error } = useQuery({
    queryKey: ["neighborhoods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_regions")
        .select("id, city, neighborhood, fee")
        .not("city", "is", null)
        .not("neighborhood", "is", null)
        .order("city")
        .order("neighborhood");

      if (error) throw error;
      return (data as Neighborhood[]) || [];
    },
  });

  // Initialize fuse index when data loads
  if (neighborhoods.length > 0) {
    initializeFuseIndex(
      neighborhoods.map((n) => ({
        city: n.city,
        neighborhood: n.neighborhood,
        fee: n.fee,
      }))
    );
  }

  return {
    neighborhoods,
    isLoading,
    error,
    refetch: async () => {
      await queryClient.invalidateQueries({ queryKey: ["neighborhoods"] });
    },
  };
}

/**
 * Hook to search neighborhoods with autocomplete
 */
export function useNeighborhoodSearch(city: string, query: string) {
  const { neighborhoods, isLoading } = useNeighborhoods();

  const results = searchNeighborhoods(city, query);

  return {
    results,
    isLoading,
  };
}

/**
 * Hook to get all cities
 */
export function useCities() {
  const { neighborhoods, isLoading } = useNeighborhoods();
  const cities = getCities();

  return {
    cities,
    isLoading,
  };
}

/**
 * Hook to get neighborhoods for a specific city
 */
export function useNeighborhoodsByCity(city: string) {
  const { neighborhoods, isLoading } = useNeighborhoods();
  const neighs = getNeighborhoodsByCity(city);

  return {
    neighborhoods: neighs,
    isLoading,
  };
}

/**
 * Hook to find delivery fee for a neighborhood
 */
export function useNeighborhoodFee(city: string, neighborhood: string) {
  const { neighborhoods, isLoading, refetch } = useNeighborhoods();

  const cityNorm = normalizeLocationText(city);
  const neighborhoodNorm = normalizeLocationText(neighborhood);

  const fee = neighborhoods.find(
    (n) =>
      normalizeLocationText(n.city) === cityNorm &&
      normalizeLocationText(n.neighborhood) === neighborhoodNorm
  )?.fee || null;

  return {
    fee,
    isLoading,
    refetch,
  };
}

/**
 * Hook to add new neighborhood with fee
 */
export function useAddNeighborhood() {
  const queryClient = useQueryClient();

  const addNeighborhood = async (
    city: string,
    neighborhood: string,
    fee: number
  ) => {
    const { error } = await supabase.from("delivery_regions").insert({
      name: `${city} - ${neighborhood}`,
      city,
      neighborhood,
      fee,
      created_at: new Date().toISOString(),
    });

    if (error) throw error;

    await queryClient.invalidateQueries({ queryKey: ["neighborhoods"] });
  };

  return { addNeighborhood };
}

/**
 * Hook to import neighborhoods from file
 * Supports both formats:
 * - Strings: ["Centro", "Vila Mariana"]
 * - Objects: [{ name: "Centro", delivery_fee: 8.00 }, ...]
 */
export function useImportNeighborhoods() {
  const queryClient = useQueryClient();

  const importNeighborhoods = async (
    data: Array<{ city: string; neighborhoods: any[] }>,
    fees: { [key: string]: number } = {}
  ) => {
    // Flatten data for insertion
    const records: Array<{
      name: string;
      city: string;
      neighborhood: string;
      fee: number;
      created_at: string;
    }> = [];

    for (const cityData of data) {
      for (const neighborhood of cityData.neighborhoods) {
        // Handle both string and object formats
        let neighborhoodName = '';
        let neighborhoodFee = 0;

        if (typeof neighborhood === 'string') {
          neighborhoodName = neighborhood.trim();
          const key = `${cityData.city}__${neighborhoodName}`;
          neighborhoodFee = fees[key] || 0;
        } else if (typeof neighborhood === 'object' && neighborhood !== null) {
          neighborhoodName = neighborhood.name?.trim() || '';
          neighborhoodFee = parseFloat(neighborhood.delivery_fee) || 0;
          // Ensure non-negative
          neighborhoodFee = Math.max(0, neighborhoodFee);
        }

        if (neighborhoodName) {
          records.push({
            name: `${cityData.city} - ${neighborhoodName}`,
            city: cityData.city,
            neighborhood: neighborhoodName,
            fee: neighborhoodFee,
            created_at: new Date().toISOString(),
          });
        }
      }
    }

    // Insert all at once
    const { error } = await supabase.from("delivery_regions").insert(records);

    if (error) throw error;

    await queryClient.invalidateQueries({ queryKey: ["neighborhoods"] });
  };

  return { importNeighborhoods };
}
