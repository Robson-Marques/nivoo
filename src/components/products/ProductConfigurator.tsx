// ProductConfigurator.tsx
// Sistema avançado de configurações dinâmicas
// Suporta: radio, checkbox, select, text, number

import React, { useCallback, useMemo } from "react";
import { ProductConfiguration, SelectedProductConfiguration } from "@/types/productAdvanced";
import { cn } from "@/lib/utils";
import { AlertCircle, HelpCircle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import "./ProductConfigurator.module.css";

interface ProductConfiguratorProps {
  configurations: ProductConfiguration[];
  selectedConfigs: Record<string, any>;
  validationErrors?: Record<string, string>;
  onConfigChange?: (configKey: string, value: any) => void;
  onAdditionalPriceChange?: (price: number) => void;
  disabled?: boolean;
  className?: string;
}

export function ProductConfigurator({
  configurations,
  selectedConfigs,
  validationErrors = {},
  onConfigChange,
  onAdditionalPriceChange,
  disabled = false,
  className,
}: ProductConfiguratorProps) {
  // Se não há configurações, retornar null
  if (!configurations || configurations.length === 0) {
    return null;
  }

  // Calcular preço adicional total
  const totalAdditionalPrice = useMemo(() => {
    let total = 0;

    for (const config of configurations) {
      const selected = selectedConfigs[config.configKey];
      if (!selected) continue;

      if (config.fieldType === "radio" || config.fieldType === "select") {
        // Se selected é um objeto com additionalPrice, usar direto
        if (typeof selected === "object" && selected.additionalPrice) {
          total += selected.additionalPrice;
        }
      } else if (config.fieldType === "checkbox") {
        // Checkbox pode ter múltiplas seleções (array de objetos)
        if (Array.isArray(selected)) {
          for (const item of selected) {
            if (typeof item === "object" && item.additionalPrice) {
              total += item.additionalPrice;
            }
          }
        }
      }
    }

    return total;
  }, [configurations, selectedConfigs]);

  // Notificar mudança de preço
  React.useEffect(() => {
    if (onAdditionalPriceChange) {
      onAdditionalPriceChange(totalAdditionalPrice);
    }
  }, [totalAdditionalPrice, onAdditionalPriceChange]);

  const handleRadioChange = useCallback(
    (configKey: string, option: any) => {
      if (onConfigChange) {
        onConfigChange(configKey, {
          label: option.label,
          value: option.value,
          additionalPrice: option.additionalPrice
        });
      }
    },
    [onConfigChange]
  );

  const handleCheckboxChange = useCallback(
    (configKey: string, option: any, checked: boolean) => {
      const currentValues = Array.isArray(selectedConfigs[configKey])
        ? selectedConfigs[configKey]
        : [];

      let newValues = currentValues;
      if (checked) {
        newValues = [...currentValues, {
          label: option.label,
          value: option.value,
          additionalPrice: option.additionalPrice
        }];
      } else {
        newValues = currentValues.filter((v: any) => v.value !== option.value);
      }

      if (onConfigChange) {
        onConfigChange(configKey, newValues.length > 0 ? newValues : null);
      }
    },
    [selectedConfigs, onConfigChange]
  );

  const handleSelectChange = useCallback(
    (configKey: string, option: any) => {
      if (onConfigChange) {
        onConfigChange(configKey, {
          label: option.label,
          value: option.value,
          additionalPrice: option.additionalPrice
        });
      }
    },
    [onConfigChange]
  );

  const handleTextChange = useCallback(
    (configKey: string, value: string, config: ProductConfiguration) => {
      if (config.maxLength && value.length > config.maxLength) {
        return;
      }

      if (onConfigChange) {
        onConfigChange(configKey, value);
      }
    },
    [onConfigChange]
  );

  const handleNumberChange = useCallback(
    (configKey: string, value: string, config: ProductConfiguration) => {
      const numValue = value ? parseFloat(value) : null;

      if (numValue === null) {
        if (onConfigChange) {
          onConfigChange(configKey, null);
        }
        return;
      }

      if (config.minValue && numValue < config.minValue) {
        return;
      }
      if (config.maxValue && numValue > config.maxValue) {
        return;
      }

      if (onConfigChange) {
        onConfigChange(configKey, numValue);
      }
    },
    [onConfigChange]
  );

  return (
    <TooltipProvider>
      <div className={cn("space-y-4 w-full", className)}>
        {/* Título da Seção (apenas aviso de obrigatoriedade) */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mt-1">
            Campos marcados com * são obrigatórios
          </p>
        </div>

        {/* Configurações */}
        {configurations.map((config) => (
          <div
            key={config.id}
            className={cn(
              "space-y-2 pb-4 border-b border-gray-200",
              "last:border-0"
            )}
          >
            {/* Label + Indicador Obrigatório */}
            <div className="flex items-start justify-between gap-2">
              <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                {config.configLabel}
                {config.isRequired && (
                  <span className="text-red-500 font-bold">*</span>
                )}
                {config.helpText && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>{config.helpText}</TooltipContent>
                  </Tooltip>
                )}
              </label>
            </div>

            {/* Campo Dinâmico baseado em field_type */}
            {config.fieldType === "radio" && (
              <RadioGroup
                value={selectedConfigs[config.configKey]?.value || ""}
                onValueChange={(value) => {
                  const option = config.options?.find((o) => o.value === value);
                  if (option) handleRadioChange(config.configKey, option);
                }}
                disabled={disabled}
              >
                <div className="space-y-2">
                  {config.options?.map((option) => (
                    <div
                      key={option.id}
                      className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <RadioGroupItem
                        value={option.value}
                        id={`${config.configKey}-${option.value}`}
                        disabled={disabled}
                      />
                      <Label
                        htmlFor={`${config.configKey}-${option.value}`}
                        className="flex-1 cursor-pointer font-normal"
                      >
                        {option.label}
                        {option.additionalPrice > 0 && (
                          <span className="text-xs text-gray-500 ml-2">
                            +R$ {option.additionalPrice.toFixed(2)}
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}

            {/* Checkbox */}
            {config.fieldType === "checkbox" && (
              <div className="space-y-2">
                {config.options?.map((option) => {
                  const isSelected = Array.isArray(
                    selectedConfigs[config.configKey]
                  )
                    ? selectedConfigs[config.configKey].some((v: any) => v.value === option.value)
                    : false;

                  const maxReached =
                    config.maxSelections &&
                    Array.isArray(selectedConfigs[config.configKey]) &&
                    selectedConfigs[config.configKey].length >=
                      config.maxSelections &&
                    !isSelected;

                  return (
                    <div
                      key={option.id}
                      className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50"
                    >
                      <Checkbox
                        id={`${config.configKey}-${option.value}`}
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange(
                            config.configKey,
                            option,
                            checked === true
                          )
                        }
                        disabled={disabled || maxReached}
                      />
                      <Label
                        htmlFor={`${config.configKey}-${option.value}`}
                        className={cn(
                          "flex-1 cursor-pointer font-normal",
                          maxReached ? "opacity-50 cursor-not-allowed" : ""
                        )}
                      >
                        {option.label}
                        {option.additionalPrice > 0 && (
                          <span className="text-xs text-gray-500 ml-2">
                            +R$ {option.additionalPrice.toFixed(2)}
                          </span>
                        )}
                      </Label>
                    </div>
                  );
                })}
                {config.maxSelections && (
                  <p className="text-xs text-gray-500 mt-2">
                    Máximo {config.maxSelections} seleção(ões)
                    {Array.isArray(selectedConfigs[config.configKey]) && 
                     selectedConfigs[config.configKey].length >= config.maxSelections && 
                     " (limite alcançado)"}
                  </p>
                )}
              </div>
            )}

            {/* Select */}
            {config.fieldType === "select" && (
              <Select
                value={selectedConfigs[config.configKey]?.value || ""}
                onValueChange={(value) => {
                  const option = config.options?.find((o) => o.value === value);
                  if (option) handleSelectChange(config.configKey, option);
                }}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Selecione ${config.configLabel.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {config.options?.map((option) => (
                    <SelectItem key={option.id} value={option.value}>
                      {option.label}
                      {option.additionalPrice > 0 && (
                        <span className="text-xs text-gray-500 ml-2">
                          +R$ {option.additionalPrice.toFixed(2)}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Text Input */}
            {config.fieldType === "text" && (
              <Input
                type="text"
                placeholder={config.configLabel}
                value={selectedConfigs[config.configKey] || ""}
                onChange={(e) =>
                  handleTextChange(config.configKey, e.target.value, config)
                }
                maxLength={config.maxLength}
                disabled={disabled}
                className="text-sm"
              />
            )}

            {/* Number Input */}
            {config.fieldType === "number" && (
              <Input
                type="number"
                placeholder={config.configLabel}
                value={selectedConfigs[config.configKey] || ""}
                onChange={(e) =>
                  handleNumberChange(config.configKey, e.target.value, config)
                }
                step={config.step || 1}
                min={config.minValue}
                max={config.maxValue}
                disabled={disabled}
                className="text-sm"
              />
            )}

            {/* Erro de Validação */}
            {validationErrors[config.configKey] && (
              <div className="flex items-start gap-2 mt-2 p-2 bg-red-50 border border-red-200 rounded">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-700">
                  {validationErrors[config.configKey]}
                </p>
              </div>
            )}
          </div>
        ))}

        {/* Resumo de Preço Adicional */}
        {totalAdditionalPrice > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm font-medium text-blue-900">
              Preço adicional: <span className="text-lg">+R$ {totalAdditionalPrice.toFixed(2)}</span>
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

export default ProductConfigurator;
