import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { templateService } from '@/services/templateService';
import { BusinessTypeTemplate } from '@/types/template';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TemplateSelectionProps {
  productId: string;
  isOpen: boolean;
  onClose: () => void;
  onApply?: (result: any) => void;
}

export function TemplateSelection({
  productId,
  isOpen,
  onClose,
  onApply,
}: TemplateSelectionProps) {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<BusinessTypeTemplate | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // Buscar templates disponíveis - simples e direto
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['business-templates-select'],
    queryFn: async () => {
      console.log('🔄 [TemplateSelection] Chamando getAllTemplates...');
      const result = await templateService.getAllTemplates();
      console.log(`✅ [TemplateSelection] Retornou ${result.length} templates`);
      return result;
    },
    enabled: isOpen,
    retry: 2,
    retryDelay: 1000,
  });

  const handleSelectTemplate = (template: BusinessTypeTemplate) => {
    setSelectedTemplate(template);
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplate) return;

    setIsApplying(true);
    try {
      const result = await templateService.applyTemplateToProduct({
        product_id: productId,
        template_id: selectedTemplate.id,
        override_existing: true,
      });

      toast({
        title: 'Sucesso!',
        description: result.message,
      });

      onApply?.(result);
      onClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao aplicar template',
      });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Selecione um Template de Configuração</DialogTitle>
          <DialogDescription>
            Escolha um template pronto para configurar automaticamente os adicionais e personalizações do seu produto.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Carregando templates...
          </div>
        ) : templates.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhum template disponível no momento.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
              {templates.map(template => (
                <div
                  key={template.id}
                  className={`p-4 rounded border-2 cursor-pointer transition ${
                    selectedTemplate?.id === template.id
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-muted-foreground'
                  }`}
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div className="text-2xl mb-2">{template.icon_emoji}</div>
                  <div className="font-medium">{template.display_name}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {template.description}
                  </div>
                </div>
              ))}
            </div>

            {selectedTemplate && (
              <Card className="bg-muted/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">
                    Visualização: {selectedTemplate.display_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div>
                    <span className="font-medium">Descrição:</span>{' '}
                    {selectedTemplate.description}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleApplyTemplate}
            disabled={!selectedTemplate || isApplying}
          >
            {isApplying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Aplicar Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TemplateSelection;
