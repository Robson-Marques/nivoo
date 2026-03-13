// ProductConfigurationBuilder.tsx
// Componente admin para criar/editar configurações dinâmicas de produtos

import React, { useState } from "react";
import { Plus, Trash2, Edit, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ProductConfiguration, ProductFieldType, ProductConfigurationPayload } from "@/types/productAdvanced";
import { productConfigurationsService } from "@/services/productAdvancedService";

interface ProductConfigurationBuilderProps {
  productId: string;
  configurations: ProductConfiguration[];
  disabled?: boolean;
  className?: string;
  onConfigurationsChange?: (configurations: ProductConfiguration[]) => void;
}

export function ProductConfigurationBuilder({
  productId,
  configurations,
  disabled = false,
  className,
  onConfigurationsChange,
}: ProductConfigurationBuilderProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { toast } = useToast();

  const [editForm, setEditForm] = useState<ProductConfigurationPayload | null>(null);

  const fieldTypes: ProductFieldType[] = ["radio", "checkbox", "select", "text", "number"];

  const getFieldTypeLabel = (type: ProductFieldType) => {
    switch (type) {
      case "radio":
        return "Seleção única";
      case "checkbox":
        return "Seleção múltipla";
      case "select":
        return "Lista";
      case "text":
        return "Texto";
      case "number":
        return "Número";
    }
  };

  const startEdit = (config: ProductConfiguration) => {
    setEditingId(config.id);
    setEditForm({
      configKey: config.configKey,
      configLabel: config.configLabel,
      fieldType: config.fieldType,
      isRequired: config.isRequired,
      displayOrder: config.displayOrder,
      maxSelections: config.maxSelections,
      minLength: config.minLength,
      maxLength: config.maxLength,
      step: config.step,
      minValue: config.minValue,
      maxValue: config.maxValue,
      defaultValue: config.defaultValue,
      helpText: config.helpText,
      options: Array.isArray(config.options) ? config.options : [],
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleSaveConfig = async () => {
    if (!editForm) return;

    // Validação básica
    if (!editForm.configLabel.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Digite um nome para a configuração",
      });
      return;
    }

    if (!editForm.configKey.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Digite uma chave para a configuração",
      });
      return;
    }

    if ((editForm.fieldType === "radio" || editForm.fieldType === "checkbox" || editForm.fieldType === "select") && (!Array.isArray(editForm.options) || editForm.options.length === 0)) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: `${getFieldTypeLabel(editForm.fieldType)} requer pelo menos uma opção`,
      });
      return;
    }

    setIsSaving(true);
    try {
      const isNewConfig = editingId?.toString().startsWith("new_");

      if (isNewConfig) {
        // Adicionar nova configuração
        await productConfigurationsService.addConfiguration(productId, editForm);
        
        toast({
          title: "Sucesso",
          description: "Configuração adicionada com sucesso",
        });
      } else {
        // Atualizar configuração existente
        await productConfigurationsService.updateConfiguration(editingId!, editForm);
        
        toast({
          title: "Sucesso",
          description: "Configuração atualizada com sucesso",
        });
      }

      // IMPORTANTE: Recarregar configurações do localStorage para garantir persistência
      const freshConfigs = await productConfigurationsService.getProductConfigurations(productId);
      
      // Atualizar o estado do componente pai
      if (onConfigurationsChange) {
        onConfigurationsChange(freshConfigs);
      }

      // Cancelar edição
      cancelEdit();
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar configuração",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfig = async (configId: string) => {
    if (!window.confirm("Tem certeza que deseja deletar esta configuração?")) {
      return;
    }

    try {
      await productConfigurationsService.deleteConfiguration(configId);
      
      // Recarregar configurações do localStorage para garantir sincronização
      const freshConfigs = await productConfigurationsService.getProductConfigurations(productId);
      
      // Atualizar o estado do componente pai
      if (onConfigurationsChange) {
        onConfigurationsChange(freshConfigs);
      }
      
      toast({
        title: "Sucesso",
        description: "Configuração removida com sucesso",
      });
    } catch (error) {
      console.error("Erro ao deletar configuração:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao deletar configuração",
      });
    }
  };

  const handleAddNewConfig = () => {
    const newConfig: ProductConfigurationPayload = {
      configKey: `config_${Date.now()}`,
      configLabel: "Nova Configuração",
      fieldType: "radio",
      isRequired: false,
      displayOrder: configurations.length,
      options: [],
    };
    setEditingId(`new_${Date.now()}`);
    setEditForm(newConfig);
  };

  const handleAddOption = () => {
    if (!editForm) return;

    const newOption = {
      label: "Nova Opção",
      value: `option_${Date.now()}`,
      additionalPrice: 0,
      displayOrder: Array.isArray(editForm.options) ? editForm.options.length : 0,
      isActive: true,
      id: `new_opt_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setEditForm({
      ...editForm,
      options: [...(Array.isArray(editForm.options) ? editForm.options : []), newOption],
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Configurações Personalizadas</CardTitle>
        <CardDescription>
          {configurations.length === 1
            ? "1 configuração definida"
            : `${configurations.length} configurações definidas`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lista de Configurações */}
        {configurations.map((config) => (
          <div
            key={config.id}
            className="border rounded-lg p-3 hover:bg-muted/50 transition"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-foreground">
                    {config.configLabel}
                  </p>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {getFieldTypeLabel(config.fieldType)}
                  </span>
                  {config.isRequired && (
                    <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">
                      Obrigatório
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {config.options.length}{" "}
                  {config.options.length === 1 ? "opção" : "opções"}
                </p>
              </div>

              {/* Ações */}
              <div className="flex gap-2 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() =>
                    setExpandedId(
                      expandedId === config.id ? null : config.id
                    )
                  }
                >
                  {expandedId === config.id ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => startEdit(config)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => handleDeleteConfig(config.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Detalhes Expandidos */}
            {expandedId === config.id && (
              <div className="mt-3 pt-3 border-t space-y-2 text-sm">
                {Array.isArray(config.options) && config.options.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-center justify-between p-2 bg-muted/40 rounded"
                  >
                    <span className="text-foreground">{option.label}</span>
                    {option.additionalPrice > 0 && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        +R$ {option.additionalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Formulário de Edição */}
        {editForm && (
          <div className="border-2 border-primary rounded-lg p-4 bg-primary/5 space-y-4">
            <h3 className="font-semibold text-foreground">
              {editingId?.toString().startsWith("new_") ? "Nova" : "Editar"}{" "}
              Configuração
            </h3>

            {/* Campos Básicos */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Label</Label>
                <Input
                  type="text"
                  value={editForm.configLabel}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      configLabel: e.target.value,
                    })
                  }
                  className="text-sm h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Key</Label>
                <Input
                  type="text"
                  value={editForm.configKey}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      configKey: e.target.value,
                    })
                  }
                  className="text-sm h-8"
                />
              </div>
            </div>

            {/* Type & Required */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Tipo</Label>
                <Select
                  value={editForm.fieldType}
                  onValueChange={(value) =>
                    setEditForm({
                      ...editForm,
                      fieldType: value as ProductFieldType,
                    })
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {getFieldTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="required"
                    checked={editForm.isRequired}
                    onCheckedChange={(checked) =>
                      setEditForm({
                        ...editForm,
                        isRequired: checked === true,
                      })
                    }
                  />
                  <Label
                    htmlFor="required"
                    className="text-xs cursor-pointer"
                  >
                    Obrigatório
                  </Label>
                </div>
              </div>
            </div>

            {/* Máximo de seleções (apenas para checkbox) */}
            {editForm.fieldType === "checkbox" && (
              <div className="space-y-1">
                <Label className="text-xs font-medium">Máximo de seleções (opcional)</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Deixe vazio para ilimitado"
                  value={editForm.maxSelections || ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      maxSelections: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  className="h-8 text-sm"
                />
              </div>
            )}

            {/* Opções (para radio/checkbox/select) */}
            {(editForm.fieldType === "radio" ||
              editForm.fieldType === "checkbox" ||
              editForm.fieldType === "select") && (
              <div className="space-y-2">
                <p className="text-xs font-semibold">Opções</p>
                {Array.isArray(editForm.options) && editForm.options.map((option, idx) => (
                  <div key={idx} className="flex gap-2 items-end">
                    <Input
                      type="text"
                      placeholder="Label"
                      value={option.label}
                      onChange={(e) => {
                        const newOptions = [...(Array.isArray(editForm.options) ? editForm.options : [])];
                        newOptions[idx].label = e.target.value;
                        setEditForm({
                          ...editForm,
                          options: newOptions,
                        });
                      }}
                      className="text-sm h-8 flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Preço"
                      value={option.additionalPrice}
                      onChange={(e) => {
                        const newOptions = [...(Array.isArray(editForm.options) ? editForm.options : [])];
                        newOptions[idx].additionalPrice = parseFloat(
                          e.target.value
                        );
                        setEditForm({
                          ...editForm,
                          options: newOptions,
                        });
                      }}
                      className="text-sm h-8 w-24"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      type="button"
                      onClick={() => {
                        const newOptions = (Array.isArray(editForm.options) ? editForm.options : []).filter(
                          (_, i) => i !== idx
                        );
                        setEditForm({
                          ...editForm,
                          options: newOptions,
                        });
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={handleAddOption}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Opção
                </Button>
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex gap-2 pt-3 border-t">
              <Button
                size="sm"
                type="button"
                onClick={cancelEdit}
                variant="outline"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                type="button"
                onClick={handleSaveConfig}
                disabled={isSaving}
              >
                {isSaving ? "Salvando..." : "Salvar Configuração"}
              </Button>
            </div>
          </div>
        )}

        {/* Botão Adicionar */}
        {!editForm && (
          <Button
            type="button"
            onClick={handleAddNewConfig}
            className="w-full"
            variant="outline"
            disabled={disabled}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Configuração
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default ProductConfigurationBuilder;
