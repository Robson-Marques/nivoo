import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNeighborhoodSearch, useNeighborhoodFee, useCities } from "@/hooks/useNeighborhoods";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, AlertCircle } from "lucide-react";
import { getExactNeighborhood } from "@/utils/neighborhood-search";

interface NeighborhoodSelectorProps {
  onSelect: (city: string, neighborhood: string, fee: number) => void;
  onStatusChange?: (status: {
    city: string;
    neighborhoodText: string;
    isValid: boolean;
    fee: number | null;
  }) => void;
  defaultCity?: string;
  defaultNeighborhood?: string;
  disabled?: boolean;
}

export function NeighborhoodSelector({
  onSelect,
  onStatusChange,
  defaultCity,
  defaultNeighborhood,
  disabled = false,
}: NeighborhoodSelectorProps) {
  const { cities } = useCities();
  const [selectedCity, setSelectedCity] = useState(defaultCity || "");
  const [searchQuery, setSearchQuery] = useState(defaultNeighborhood || "");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(defaultNeighborhood || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const lastReportedRef = useRef<string>("");

  const { results: suggestions } = useNeighborhoodSearch(selectedCity, searchQuery);
  const { fee: selectedFee } = useNeighborhoodFee(selectedCity, selectedNeighborhood);

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setSearchQuery("");
    setSelectedNeighborhood("");
    setShowSuggestions(false);

    onStatusChange?.({
      city,
      neighborhoodText: "",
      isValid: false,
      fee: null,
    });
  };

  const handleNeighborhoodSelect = (neighborhood: string, fee: number) => {
    setSelectedNeighborhood(neighborhood);
    setSearchQuery(neighborhood);
    setShowSuggestions(false);
    
    // Chamar onSelect imediatamente com o fee do suggestion
    onSelect(selectedCity, neighborhood, fee);

    onStatusChange?.({
      city: selectedCity,
      neighborhoodText: neighborhood,
      isValid: true,
      fee,
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(true);
    setSelectedNeighborhood("");

    onStatusChange?.({
      city: selectedCity,
      neighborhoodText: value,
      isValid: false,
      fee: null,
    });
  };

  useEffect(() => {
    if (!selectedCity) return;
    const exact = searchQuery ? getExactNeighborhood(selectedCity, searchQuery) : null;
    if (exact) {
      setSelectedNeighborhood(exact);
    }
  }, [selectedCity, searchQuery]);

  useEffect(() => {
    if (!onStatusChange) return;
    if (!selectedCity) return;
    const isValid = Boolean(selectedNeighborhood) && selectedFee !== null;
    const neighborhoodText = selectedNeighborhood || searchQuery;
    const fee = isValid ? selectedFee : null;
    const key = `${selectedCity}__${neighborhoodText}__${String(isValid)}__${String(fee)}`;
    if (key === lastReportedRef.current) return;
    lastReportedRef.current = key;

    onStatusChange({
      city: selectedCity,
      neighborhoodText,
      isValid,
      fee,
    });
  }, [onStatusChange, searchQuery, selectedCity, selectedFee, selectedNeighborhood]);

  const isNeighborhoodValid = selectedNeighborhood && selectedFee !== null;

  return (
    <div className="space-y-4">
      {/* City Selection */}
      <div className="space-y-2">
        <Label htmlFor="city">Cidade</Label>
        <Select value={selectedCity} onValueChange={handleCityChange} disabled={disabled}>
          <SelectTrigger id="city">
            <SelectValue placeholder="Selecione uma cidade" />
          </SelectTrigger>
          <SelectContent>
            {cities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Neighborhood Input with Autocomplete */}
      {selectedCity && (
        <div className="space-y-2 relative">
          <Label htmlFor="neighborhood">Bairro</Label>
          <div className="relative">
            <Input
              id="neighborhood"
              placeholder="Digite o bairro..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowSuggestions(true)}
              disabled={disabled}
              className={selectedNeighborhood && selectedFee !== null ? "border-green-500" : ""}
            />

            {/* Autocomplete Suggestions */}
            {showSuggestions && searchQuery && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border rounded-md shadow-lg z-50 mt-1 max-h-64 overflow-y-auto">
                {suggestions.map((suggestion) => (
                  <button
                    key={`${suggestion.city}-${suggestion.neighborhood}`}
                    type="button"
                    onClick={() => handleNeighborhoodSelect(suggestion.neighborhood, suggestion.fee)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b last:border-b-0 transition-colors"
                  >
                    <div className="font-medium">{suggestion.neighborhood}</div>
                    <div className="text-sm text-gray-500">Taxa: R$ {suggestion.fee?.toFixed(2) || "0.00"}</div>
                  </button>
                ))}

                {suggestions.length === 0 && searchQuery && (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    Nenhum bairro encontrado
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Neighborhood Selected Status */}
          {isNeighborhoodValid && (
            <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
              <CheckCircle className="h-4 w-4" />
              <span>Bairro válido - Taxa: R$ {selectedFee?.toFixed(2)}</span>
            </div>
          )}

          {/* No neighborhoods available for city */}
          {selectedCity && suggestions.length === 0 && !searchQuery && (
            <div className="flex items-center gap-2 text-sm text-orange-600 mt-2">
              <AlertCircle className="h-4 w-4" />
              <span>Nenhum bairro configurado para esta cidade</span>
            </div>
          )}
        </div>
      )}

      {/* Fee Display Card */}
      {isNeighborhoodValid && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Bairro:</span>
                <span className="text-sm">{selectedNeighborhood}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Cidade:</span>
                <span className="text-sm">{selectedCity}</span>
              </div>
              <div className="border-t border-green-200 pt-2 flex justify-between">
                <span className="font-semibold">Taxa de Entrega:</span>
                <span className="font-semibold text-green-700">
                  R$ {selectedFee?.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
