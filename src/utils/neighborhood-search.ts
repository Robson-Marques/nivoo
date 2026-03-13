/**
 * Neighborhood autocomplete utilities with fuzzy search
 * Uses fuse.js for typo-tolerant search
 */

import Fuse from 'fuse.js';

interface Neighborhood {
  city: string;
  neighborhood: string;
  fee: number;
}

export function normalizeLocationText(value: string): string {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

// Cache neighborhoods in memory
let neighborhoodCache: Neighborhood[] = [];
let fuseIndex: Fuse<Neighborhood> | null = null;

/**
 * Initialize fuse index for fuzzy search
 */
export function initializeFuseIndex(neighborhoods: Neighborhood[]) {
  neighborhoodCache = neighborhoods;
  
  fuseIndex = new Fuse(neighborhoods, {
    keys: ['neighborhood'],
    threshold: 0.3, // Higher threshold means more typos tolerated
    minMatchCharLength: 2,
    includeScore: true,
  });
}

/**
 * Search neighborhoods by city and query
 * Returns results sorted by relevance with typo correction
 */
export function searchNeighborhoods(
  city: string,
  query: string
): Neighborhood[] {
  if (!query || query.trim().length === 0) {
    // Return all neighborhoods for the city if no query
    return neighborhoodCache.filter(n => n.city === city);
  }

  if (!fuseIndex) {
    return [];
  }

  // Search in fuse index
  const results = fuseIndex.search(query);
  
  // Filter by city and return only neighborhoods from selected city
  return results
    .filter(result => result.item.city === city)
    .map(result => result.item)
    .slice(0, 10); // Limit to 10 results
}

/**
 * Get all cities from neighborhoods database
 */
export function getCities(): string[] {
  return Array.from(new Set(neighborhoodCache.map(n => n.city))).sort();
}

/**
 * Get all neighborhoods for a specific city
 */
export function getNeighborhoodsByCity(city: string): string[] {
  return neighborhoodCache
    .filter(n => n.city === city)
    .map(n => n.neighborhood)
    .sort();
}

/**
 * Check if a neighborhood exists in the database
 */
export function neighborhoodExists(city: string, neighborhood: string): boolean {
  const cityNorm = normalizeLocationText(city);
  const neighborhoodNorm = normalizeLocationText(neighborhood);
  return neighborhoodCache.some(
    (n) =>
      normalizeLocationText(n.city) === cityNorm &&
      normalizeLocationText(n.neighborhood) === neighborhoodNorm
  );
}

/**
 * Get exact neighborhood match (case-insensitive)
 */
export function getExactNeighborhood(city: string, query: string): string | null {
  const cityNorm = normalizeLocationText(city);
  const queryNorm = normalizeLocationText(query);
  const result = neighborhoodCache.find(
    (n) =>
      normalizeLocationText(n.city) === cityNorm &&
      normalizeLocationText(n.neighborhood) === queryNorm
  );
  return result?.neighborhood || null;
}

/**
 * Load neighborhoods from JSON data
 */
export async function loadNeighborhoodsFromJson(
  data: Array<{ city: string; neighborhoods: string[] }>
): Promise<Neighborhood[]> {
  const neighborhoods: Neighborhood[] = [];

  for (const cityData of data) {
    for (const neighborhood of cityData.neighborhoods) {
      neighborhoods.push({
        city: cityData.city,
        neighborhood: neighborhood.trim(),
        fee: 0,
      });
    }
  }

  initializeFuseIndex(neighborhoods);
  return neighborhoods;
}

/**
 * Parse Excel/CSV file to neighborhood format
 * Supports two formats:
 * 
 * Format 1 (Old):
 * city,neighborhood
 * São Paulo,Centro
 * 
 * Format 2 (New - Recommended):
 * city,neighborhood,delivery_fee
 * São Paulo,Centro,8.00
 */
export async function parseExcelToNeighborhoods(
  file: File
): Promise<Array<{ city: string; neighborhoods: Array<{ name: string; delivery_fee?: number }> }>> {
  // If it's a JSON file, parse directly
  if (file.name.endsWith('.json')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          
          // Support both old and new JSON format
          const result = data.map((cityData: any) => ({
            city: cityData.city,
            neighborhoods: Array.isArray(cityData.neighborhoods)
              ? cityData.neighborhoods.map((n: any) => {
                  // Handle both string format and object format
                  if (typeof n === 'string') {
                    return { name: n, delivery_fee: 0 };
                  }
                  return {
                    name: n.name || '',
                    delivery_fee: n.delivery_fee || 0,
                  };
                })
              : [],
          }));
          
          resolve(result);
        } catch (error) {
          reject(new Error('Invalid JSON format'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsText(file);
    });
  }

  // For CSV/text files
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        // Check if first line is header
        const firstLine = lines[0];
        const isHeaderLine = firstLine.toLowerCase().includes('city') || 
                            firstLine.toLowerCase().includes('cidade');
        const startIndex = isHeaderLine ? 1 : 0;
        
        const result: { [city: string]: Array<{ name: string; delivery_fee: number }> } = {};
        
        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i];
          const parts = line.split(',').map(s => s.trim());
          
          if (parts.length < 2) continue;
          
          const city = parts[0];
          const neighborhood = parts[1];
          const delivery_fee = parts.length > 2 ? parseFloat(parts[2]) || 0 : 0;
          
          if (city && neighborhood) {
            if (!result[city]) {
              result[city] = [];
            }
            result[city].push({
              name: neighborhood,
              delivery_fee: Math.max(0, delivery_fee), // Ensure non-negative
            });
          }
        }

        const data = Object.entries(result).map(([city, neighborhoods]) => ({
          city,
          neighborhoods,
        }));

        resolve(data);
      } catch (error) {
        reject(new Error('Error parsing file'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
}

/**
 * Generate JSON template for download
 */
export function generateJsonTemplate(): string {
  const template = [
    {
      city: "São Paulo",
      neighborhoods: [
        { name: "Centro", delivery_fee: 8.00 },
        { name: "Vila Mariana", delivery_fee: 10.00 },
        { name: "Pinheiros", delivery_fee: 12.00 },
        { name: "Zona Leste", delivery_fee: 15.00 },
        { name: "Zona Oeste", delivery_fee: 14.00 }
      ]
    },
    {
      city: "Rio de Janeiro",
      neighborhoods: [
        { name: "Centro", delivery_fee: 9.00 },
        { name: "Copacabana", delivery_fee: 12.00 },
        { name: "Leblon", delivery_fee: 14.00 },
        { name: "Zona Sul", delivery_fee: 11.00 },
        { name: "Zona Norte", delivery_fee: 10.00 }
      ]
    },
    {
      city: "Belo Horizonte",
      neighborhoods: [
        { name: "Centro", delivery_fee: 7.00 },
        { name: "Savassi", delivery_fee: 9.00 },
        { name: "Funcionários", delivery_fee: 8.50 },
        { name: "Zona Sul", delivery_fee: 10.00 },
        { name: "Zona Norte", delivery_fee: 9.00 }
      ]
    }
  ];

  return JSON.stringify(template, null, 2);
}

/**
 * Generate CSV template for download
 */
export function generateCsvTemplate(): string {
  return `city,neighborhood,delivery_fee
São Paulo,Centro,8.00
São Paulo,Vila Mariana,10.00
São Paulo,Pinheiros,12.00
São Paulo,Zona Leste,15.00
São Paulo,Zona Oeste,14.00
Rio de Janeiro,Centro,9.00
Rio de Janeiro,Copacabana,12.00
Rio de Janeiro,Leblon,14.00
Rio de Janeiro,Zona Sul,11.00
Rio de Janeiro,Zona Norte,10.00
Belo Horizonte,Centro,7.00
Belo Horizonte,Savassi,9.00
Belo Horizonte,Funcionários,8.50
Belo Horizonte,Zona Sul,10.00
Belo Horizonte,Zona Norte,9.00`;
}

/**
 * Validate neighborhood data before import
 * Supports both formats (with or without delivery_fee)
 */
export function validateNeighborhoodData(
  data: Array<{ city: string; neighborhoods: any[] }>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(data)) {
    errors.push('Data must be an array');
    return { valid: false, errors };
  }

  if (data.length === 0) {
    errors.push('Data cannot be empty');
    return { valid: false, errors };
  }

  let totalNeighborhoods = 0;

  for (let i = 0; i < data.length; i++) {
    const item = data[i];

    if (!item.city || typeof item.city !== 'string') {
      errors.push(`Item ${i + 1}: City is required and must be a string`);
    }

    if (!Array.isArray(item.neighborhoods) || item.neighborhoods.length === 0) {
      errors.push(`Item ${i + 1}: Neighborhoods must be a non-empty array`);
    }

    for (let j = 0; j < (item.neighborhoods?.length || 0); j++) {
      const neighborhood = item.neighborhoods[j];
      
      // Support both string and object formats
      if (typeof neighborhood === 'string') {
        if (!neighborhood.trim()) {
          errors.push(`Item ${i + 1}: Neighborhood ${j + 1} must be a non-empty string`);
        }
      } else if (typeof neighborhood === 'object' && neighborhood !== null) {
        if (!neighborhood.name || typeof neighborhood.name !== 'string' || !neighborhood.name.trim()) {
          errors.push(`Item ${i + 1}: Neighborhood ${j + 1} must have a valid name`);
        }
        
        // Validate delivery_fee if provided
        if ('delivery_fee' in neighborhood) {
          const fee = parseFloat(neighborhood.delivery_fee);
          if (isNaN(fee)) {
            errors.push(`Item ${i + 1}: Invalid delivery_fee for neighborhood ${j + 1}`);
          } else if (fee < 0) {
            errors.push(`Item ${i + 1}: Delivery fee cannot be negative for neighborhood ${j + 1}`);
          }
        }
      } else {
        errors.push(`Item ${i + 1}: Neighborhood ${j + 1} has invalid format`);
      }
    }

    totalNeighborhoods += item.neighborhoods?.length || 0;
  }

  if (totalNeighborhoods > 1000) {
    errors.push('Too many neighborhoods (max 1000)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
