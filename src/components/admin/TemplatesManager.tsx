import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { templateService } from '@/services/templateService';
import { BusinessTypeTemplate, TemplateConfiguration, TemplateAddon } from '@/types/template';
import { Plus, Edit2, Trash2, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TemplateEditorDialogProps {
  isOpen: boolean;
  template: BusinessTypeTemplate | null;
  onClose: () => void;
  onSave: () => void;
}

function TemplateEditorDialog({ isOpen, template, onClose, onSave }: TemplateEditorDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    info: true,
    configurations: true,
    addons: true,
  });
  const [editingTemplate, setEditingTemplate] = useState<Partial<BusinessTypeTemplate> | null>(null);
  const [configurations, setConfigurations] = useState<TemplateConfiguration[]>([]);
  const [addons, setAddons] = useState<TemplateAddon[]>([]);
  const [newConfig, setNewConfig] = useState({
    config_key: '',
    config_label: '',
    field_type: 'select',
    is_required: false,
    display_order: 0,
    help_text: '',
    options: '',
  });
  const [newAddon, setNewAddon] = useState({
    name: '',
    description: '',
    price: 0,
    display_order: 0,
    category: 'Adicionais',
  });

  useEffect(() => {
    if (template && isOpen) {
      setEditingTemplate(template);
      loadTemplateData();
    }
  }, [template, isOpen]);

  const loadTemplateData = async () => {
    if (!template) return;
    setIsLoading(true);
    try {
      const [configs, addonsData] = await Promise.all([
        templateService.getTemplateConfigurations(template.id),
        templateService.getTemplateAddons(template.id),
      ]);
      setConfigurations(configs);
      setAddons(addonsData);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao carregar dados do template',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddConfiguration = async () => {
    if (!template || !editingTemplate) return;

    if (!newConfig.config_key.trim() || !newConfig.config_label.trim()) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
      });
      return;
    }

    setIsSaving(true);
    try {
      const options = newConfig.options
        ? newConfig.options.split(',').map(opt => opt.trim())
        : null;

      const config = await templateService.addConfigurationToTemplate(
        template.id,
        newConfig.config_key,
        newConfig.config_label,
        newConfig.field_type,
        newConfig.is_required,
        newConfig.display_order,
        options,
        newConfig.help_text || undefined
      );

      setConfigurations([...configurations, config]);
      setNewConfig({
        config_key: '',
        config_label: '',
        field_type: 'select',
        is_required: false,
        display_order: 0,
        help_text: '',
        options: '',
      });

      toast({
        title: 'Sucesso!',
        description: 'Configuração adicionada ao template',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao adicionar configuração',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAddon = async () => {
    if (!template || !editingTemplate) return;

    if (!newAddon.name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Nome do adicional é obrigatório',
      });
      return;
    }

    setIsSaving(true);
    try {
      const addon = await templateService.addAddonToTemplate(
        template.id,
        newAddon.name,
        newAddon.description || null,
        parseFloat(String(newAddon.price)),
        newAddon.display_order,
        newAddon.category
      );

      setAddons([...addons, addon]);
      setNewAddon({
        name: '',
        description: '',
        price: 0,
        display_order: 0,
        category: 'Adicionais',
      });

      toast({
        title: 'Sucesso!',
        description: 'Adicional adicionado ao template',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao adicionar adicional',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template?.display_name || 'Template'}</DialogTitle>
          <DialogDescription>{template?.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader
              className="cursor-pointer"
              onClick={() => toggleSection('info')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Informações Básicas</CardTitle>
                {expandedSections.info ? <ChevronUp /> : <ChevronDown />}
              </div>
            </CardHeader>
            {expandedSections.info && (
              <CardContent className="space-y-4">
                <div>
                  <Label>Nome do Template</Label>
                  <Input
                    value={editingTemplate?.display_name || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={editingTemplate?.description || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label>Emoji</Label>
                  <Input
                    value={editingTemplate?.icon_emoji || ''}
                    disabled
                    className="bg-muted w-16"
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Configurações */}
          <Card>
            <CardHeader
              className="cursor-pointer"
              onClick={() => toggleSection('configurations')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  Configurações ({configurations.length})
                </CardTitle>
                {expandedSections.configurations ? <ChevronUp /> : <ChevronDown />}
              </div>
            </CardHeader>
            {expandedSections.configurations && (
              <CardContent className="space-y-4">
                {configurations.length > 0 && (
                  <div className="space-y-2">
                    {configurations.map(config => (
                      <div
                        key={config.id}
                        className="p-3 rounded border bg-muted text-sm"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{config.config_label}</div>
                            <div className="text-xs text-muted-foreground">
                              Chave: {config.config_key} | Tipo: {config.field_type}
                              {config.is_required && (
                                <Badge variant="secondary" className="ml-2">
                                  Obrigatório
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-medium text-sm">Adicionar Configuração</h4>
                  <Input
                    placeholder="Chave (ex: size)"
                    value={newConfig.config_key}
                    onChange={e =>
                      setNewConfig({ ...newConfig, config_key: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Rótulo (ex: Tamanho)"
                    value={newConfig.config_label}
                    onChange={e =>
                      setNewConfig({ ...newConfig, config_label: e.target.value })
                    }
                  />
                  <Select
                    value={newConfig.field_type}
                    onValueChange={value =>
                      setNewConfig({ ...newConfig, field_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="select">Seleção</SelectItem>
                      <SelectItem value="checkbox">Checkbox</SelectItem>
                      <SelectItem value="radio">Rádio</SelectItem>
                      <SelectItem value="text">Texto</SelectItem>
                      <SelectItem value="number">Número</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Opções separadas por vírgula (ex: Pequena,Média,Grande)"
                    value={newConfig.options}
                    onChange={e =>
                      setNewConfig({ ...newConfig, options: e.target.value })
                    }
                  />
                  <Button
                    onClick={handleAddConfiguration}
                    disabled={isSaving}
                    size="sm"
                  >
                    Adicionar Configuração
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Adicionais */}
          <Card>
            <CardHeader
              className="cursor-pointer"
              onClick={() => toggleSection('addons')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  Adicionais ({addons.length})
                </CardTitle>
                {expandedSections.addons ? <ChevronUp /> : <ChevronDown />}
              </div>
            </CardHeader>
            {expandedSections.addons && (
              <CardContent className="space-y-4">
                {addons.length > 0 && (
                  <div className="space-y-2">
                    {addons.map(addon => (
                      <div
                        key={addon.id}
                        className="p-3 rounded border bg-muted text-sm"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{addon.name}</div>
                            <div className="text-xs text-muted-foreground">
                              R$ {addon.price.toFixed(2)} | {addon.category}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-medium text-sm">Adicionar Adicional</h4>
                  <Input
                    placeholder="Nome do adicional"
                    value={newAddon.name}
                    onChange={e =>
                      setNewAddon({ ...newAddon, name: e.target.value })
                    }
                  />
                  <Textarea
                    placeholder="Descrição (opcional)"
                    value={newAddon.description}
                    onChange={e =>
                      setNewAddon({ ...newAddon, description: e.target.value })
                    }
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Preço</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newAddon.price}
                        onChange={e =>
                          setNewAddon({
                            ...newAddon,
                            price: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Categoria</Label>
                      <Input
                        placeholder="Adicionais"
                        value={newAddon.category}
                        onChange={e =>
                          setNewAddon({ ...newAddon, category: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddAddon}
                    disabled={isSaving}
                    size="sm"
                  >
                    Adicionar Adicional
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TemplatesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<BusinessTypeTemplate | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [applyTemplateDialog, setApplyTemplateDialog] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  // Buscar produtos
  const { data: products = [] } = useQuery({
    queryKey: ['products-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Buscar templates - simples e direto
  const { data: templates = [], isLoading, refetch } = useQuery({
    queryKey: ['business-templates'],
    queryFn: async () => {
      console.log('🔄 [TemplatesManager] Chamando getAllTemplates...');
      const result = await templateService.getAllTemplates();
      console.log(`✅ [TemplatesManager] Retornou ${result.length} templates`);
      return result;
    },
    retry: 2,
    retryDelay: 1000,
  });

  const handleEditTemplate = (template: BusinessTypeTemplate) => {
    setSelectedTemplate(template);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setSelectedTemplate(null);
    queryClient.invalidateQueries({ queryKey: ['business-templates'] });
    // Force refetch após fechar editor
    refetch();
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplate || !selectedProductId) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Selecione um produto',
      });
      return;
    }

    setIsApplying(true);
    try {
      const result = await templateService.applyTemplateToProduct({
        product_id: selectedProductId,
        template_id: selectedTemplate.id,
        override_existing: true,
      });

      toast({
        title: 'Sucesso!',
        description: result.message,
      });

      setApplyTemplateDialog(false);
      setSelectedProductId('');
      queryClient.invalidateQueries({ queryKey: ['products'] });
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Gerenciar Templates de Configuração
            <Badge variant="outline">{templates.length} Templates</Badge>
          </CardTitle>
          <CardDescription>
            Templates prontos para diferentes tipos de negócio. Clique para editar ou aplicar a um produto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando templates...
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum template disponível
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {templates.map(template => (
                <Card key={template.id} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="text-2xl mb-2">{template.icon_emoji}</div>
                    <CardTitle className="text-lg">{template.display_name}</CardTitle>
                    <CardDescription className="text-xs">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setApplyTemplateDialog(true);
                        }}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Aplicar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editor de Template */}
      <TemplateEditorDialog
        isOpen={isEditorOpen}
        template={selectedTemplate}
        onClose={handleCloseEditor}
        onSave={handleCloseEditor}
      />

      {/* Dialog para aplicar template */}
      <Dialog open={applyTemplateDialog} onOpenChange={setApplyTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Aplicar Template: {selectedTemplate?.display_name}
            </DialogTitle>
            <DialogDescription>
              Escolha um produto para aplicar este template. As configurações e adicionais serão adicionados ao produto.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Selecione um Produto</Label>
             <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um produto..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApplyTemplateDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleApplyTemplate}
              disabled={isApplying || !selectedProductId}
            >
              Aplicar Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TemplatesManager;
