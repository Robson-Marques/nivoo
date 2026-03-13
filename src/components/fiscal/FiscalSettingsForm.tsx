import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { FileUp, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { FiscalSettings } from '@/types/nfce';
import { supabase } from '@/integrations/supabase/client';
import { ESTADOS_BR, CRT_OPTIONS } from '@/constants/sefazEndpoints';

interface FiscalSettingsFormProps {
  restaurantId: string;
  initialData?: FiscalSettings;
  onSave?: (data: FiscalSettings) => void;
}

export function FiscalSettingsForm({ restaurantId, initialData, onSave }: FiscalSettingsFormProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [certificadoFile, setCertificadoFile] = useState<File | null>(null);
  const [testando, setTestando] = useState(false);

  const [formData, setFormData] = useState<Partial<FiscalSettings>>({
    razao_social: initialData?.razao_social || '',
    nome_fantasia: initialData?.nome_fantasia || '',
    cnpj: initialData?.cnpj || '',
    inscricao_estadual: initialData?.inscricao_estadual || '',
    crt: initialData?.crt || 'SN',
    endereco: initialData?.endereco || '',
    numero: initialData?.numero || '',
    complemento: initialData?.complemento || '',
    bairro: initialData?.bairro || '',
    cidade: initialData?.cidade || '',
    uf: initialData?.uf || 'SP',
    cep: initialData?.cep || '',
    serie_nfce: initialData?.serie_nfce || 1,
    id_token_csc: initialData?.id_token_csc || '',
    token_csc: initialData?.token_csc || '',
    certificado_senha: initialData?.certificado_senha || '',
    ambiente: initialData?.ambiente || 'homologacao',
    is_ativo: initialData?.is_ativo || false,
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMaskedInput = (field: string, value: string) => {
    let masked = value.replace(/\D/g, '');

    if (field === 'cnpj') {
      masked = masked
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    } else if (field === 'cep') {
      masked = masked
        .replace(/(\d{5})(\d)/, '$1-$2');
    }

    handleInputChange(field, masked);
  };

  const handleCertificadoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pfx') && !file.name.endsWith('.p12')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Envie um certificado A1 em formato .pfx ou .p12',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O certificado não pode exceder 5 MB',
        variant: 'destructive',
      });
      return;
    }

    setCertificadoFile(file);
    toast({
      title: 'Certificado carregado',
      description: `Arquivo "${file.name}" pronto para ser enviado`,
    });
  };

  const testarConfiguracao = async () => {
    try {
      setTestando(true);

      // Validações básicas
      if (!formData.cnpj || formData.cnpj.replace(/\D/g, '').length !== 14) {
        throw new Error('CNPJ deve estar completo (14 dígitos)');
      }

      if (!formData.token_csc || formData.token_csc.length < 5) {
        throw new Error('Token CSC inválido');
      }

      if (!formData.id_token_csc) {
        throw new Error('ID do token CSC é obrigatório');
      }

      toast({
        title: 'Configuração válida',
        description: 'Os dados foram validados com sucesso. Salve a configuração.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro na validação',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setTestando(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Validações
      if (!formData.razao_social?.trim()) {
        throw new Error('Razão social é obrigatória');
      }

      if (!formData.cnpj || formData.cnpj.replace(/\D/g, '').length !== 14) {
        throw new Error('CNPJ inválido');
      }

      if (!formData.uf) {
        throw new Error('Estado é obrigatório');
      }

      if (!formData.cidade?.trim()) {
        throw new Error('Cidade é obrigatória');
      }

      // Se é novo e requer certificado
      if (!initialData && !certificadoFile) {
        throw new Error('Certificado A1 é obrigatório');
      }

      let dados: any = {
        restaurant_id: restaurantId,
        ...formData,
        cnpj: formData.cnpj.replace(/\D/g, ''),
        cep: formData.cep?.replace(/\D/g, ''),
      };

      if (initialData?.id) {
        // Atualizar
        const { data, error } = await supabase
          .from('fiscal_settings')
          .update(dados)
          .eq('id', initialData.id)
          .select()
          .single();

        if (error) throw error;

        toast({
          title: 'Configuração atualizada',
          description: 'Dados fiscais foram atualizados com sucesso',
        });

        onSave?.(data);
      } else {
        // Criar
        const { data, error } = await supabase
          .from('fiscal_settings')
          .insert([dados])
          .select()
          .single();

        if (error) throw error;

        toast({
          title: 'Configuração criada',
          description: 'Sua empresa foi configurada para emitir NFC-e',
        });

        onSave?.(data);
        navigate('/admin/fiscal-settings');
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuração Fiscal - NFC-e</CardTitle>
          <CardDescription>
            Configure seus dados fiscais para emitir Nota Fiscal de Consumidor Eletrônica (NFC-e)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-900">Dados sensíveis</AlertTitle>
              <AlertDescription className="text-amber-700">
                Mantenha seus dados fiscais seguros. O certificado será criptografado no servidor.
              </AlertDescription>
            </Alert>

            <Tabs defaultValue="empresa" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="empresa">Empresa</TabsTrigger>
                <TabsTrigger value="endereco">Endereço</TabsTrigger>
                <TabsTrigger value="certificado">Certificado</TabsTrigger>
                <TabsTrigger value="ambiente">Ambiente</TabsTrigger>
              </TabsList>

              {/* TAB: EMPRESA */}
              <TabsContent value="empresa" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="razao_social">Razão Social *</Label>
                    <Input
                      id="razao_social"
                      placeholder="Ex: DEL DELIVERY PRO LTDA"
                      value={formData.razao_social || ''}
                      onChange={(e) => handleInputChange('razao_social', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                    <Input
                      id="nome_fantasia"
                      placeholder="Ex: DEL DELIVERY PRO"
                      value={formData.nome_fantasia || ''}
                      onChange={(e) => handleInputChange('nome_fantasia', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="cnpj">CNPJ *</Label>
                    <Input
                      id="cnpj"
                      placeholder="XX.XXX.XXX/XXXX-XX"
                      value={formData.cnpj || ''}
                      onChange={(e) => handleMaskedInput('cnpj', e.target.value)}
                      maxLength={18}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Sem a máscara: {formData.cnpj?.replace(/\D/g, '').length || 0}/14 dígitos
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="ie">Inscrição Estadual *</Label>
                    <Input
                      id="ie"
                      placeholder="Ex: 123456789012345"
                      value={formData.inscricao_estadual || ''}
                      onChange={(e) => handleInputChange('inscricao_estadual', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="crt">Código de Regime Tributário *</Label>
                    <Select value={formData.crt || 'SN'} onValueChange={(value: any) => handleInputChange('crt', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CRT_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="serie">Série da NFC-e *</Label>
                    <Input
                      id="serie"
                      type="number"
                      min="1"
                      value={formData.serie_nfce || 1}
                      onChange={(e) => handleInputChange('serie_nfce', parseInt(e.target.value))}
                      required
                    />
                  </div>
                </div>
              </TabsContent>

              {/* TAB: ENDEREÇO */}
              <TabsContent value="endereco" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="endereco">Endereço *</Label>
                    <Input
                      id="endereco"
                      placeholder="Rua, Avenida, etc"
                      value={formData.endereco || ''}
                      onChange={(e) => handleInputChange('endereco', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="numero">Número *</Label>
                    <Input
                      id="numero"
                      placeholder="Ex: 123"
                      value={formData.numero || ''}
                      onChange={(e) => handleInputChange('numero', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      placeholder="Apto, Sala, etc"
                      value={formData.complemento || ''}
                      onChange={(e) => handleInputChange('complemento', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="bairro">Bairro *</Label>
                    <Input
                      id="bairro"
                      placeholder="Bairro"
                      value={formData.bairro || ''}
                      onChange={(e) => handleInputChange('bairro', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="cidade">Cidade *</Label>
                    <Input
                      id="cidade"
                      placeholder="São Paulo"
                      value={formData.cidade || ''}
                      onChange={(e) => handleInputChange('cidade', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="uf">Estado (UF) *</Label>
                    <Select value={formData.uf || 'SP'} onValueChange={(value) => handleInputChange('uf', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ESTADOS_BR.map(estado => (
                          <SelectItem key={estado.uf} value={estado.uf}>
                            {estado.nome} ({estado.uf})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="cep">CEP *</Label>
                    <Input
                      id="cep"
                      placeholder="XXXXX-XXX"
                      value={formData.cep || ''}
                      onChange={(e) => handleMaskedInput('cep', e.target.value)}
                      maxLength={9}
                      required
                    />
                  </div>
                </div>
              </TabsContent>

              {/* TAB: CERTIFICADO */}
              <TabsContent value="certificado" className="space-y-4">
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-900">Certificado Digital</AlertTitle>
                  <AlertDescription className="text-red-700">
                    Você deve possuir um certificado digital A1 (arquivo .pfx) para emitir NFC-e. 
                    Este é fornecido por autoridades certificadoras credenciadas. Procure a Receita Federal para mais informações.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>Certificado A1 (.pfx) *</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
                    onClick={() => document.getElementById('certificado-input')?.click()}>
                    <input
                      id="certificado-input"
                      type="file"
                      accept=".pfx,.p12"
                      onChange={handleCertificadoUpload}
                      className="hidden"
                    />
                    <FileUp className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm font-medium">
                      {certificadoFile ? (
                        <>
                          <CheckCircle2 className="inline h-4 w-4 text-green-600 mr-2" />
                          {certificadoFile.name}
                        </>
                      ) : (
                        'Clique para fazer upload do certificado'
                      )}
                    </p>
                    <p className="text-xs text-gray-500">Máximo 5 MB</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="cert_password">Senha do Certificado *</Label>
                  <Input
                    id="cert_password"
                    type="password"
                    placeholder="Senha do certificado .pfx"
                    value={formData.certificado_senha || ''}
                    onChange={(e) => handleInputChange('certificado_senha', e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Será criptografada e armazenada com segurança</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="token_csc">Token CSC *</Label>
                    <Input
                      id="token_csc"
                      type="password"
                      placeholder="Código de Segurança do Contribuinte"
                      value={formData.token_csc || ''}
                      onChange={(e) => handleInputChange('token_csc', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="id_token_csc">ID Token CSC *</Label>
                    <Input
                      id="id_token_csc"
                      placeholder="Ex: 123456"
                      value={formData.id_token_csc || ''}
                      onChange={(e) => handleInputChange('id_token_csc', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </TabsContent>

              {/* TAB: AMBIENTE */}
              <TabsContent value="ambiente" className="space-y-4">
                <div>
                  <Label>Ambiente de Emissão *</Label>
                  <RadioGroup value={formData.ambiente || 'homologacao'} onValueChange={(value: any) => handleInputChange('ambiente', value)}>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="homologacao" id="homolog" />
                      <Label htmlFor="homolog" className="flex-1 cursor-pointer">
                        <span className="font-medium">Homologação (Testes)</span>
                        <p className="text-xs text-gray-500">Use para testar a configuração com SEFAZ antes de produção</p>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="producao" id="prod" />
                      <Label htmlFor="prod" className="flex-1 cursor-pointer">
                        <span className="font-medium">Produção</span>
                        <p className="text-xs text-gray-500">Emissão real de NFC-e com valor fiscal</p>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-900">Recomendação</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    Inicie em <strong>Homologação</strong> para testar toda a configuração. 
                    Após confirmado, mude para <strong>Produção</strong>.
                  </AlertDescription>
                </Alert>

                <div className="flex items-center space-x-2 p-3 border rounded-lg bg-gray-50">
                  <Checkbox
                    id="ativo"
                    checked={formData.is_ativo || false}
                    onCheckedChange={(checked) => handleInputChange('is_ativo', checked)}
                  />
                  <Label htmlFor="ativo" className="cursor-pointer">
                    <span className="font-medium">Ativar emissão automática de NFC-e</span>
                    <p className="text-xs text-gray-500">Quando habilitado, NFC-e será emitida automaticamente ao marcar pedido como pago</p>
                  </Label>
                </div>
              </TabsContent>
            </Tabs>

            {/* BOTÕES DE AÇÃO */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={testarConfiguracao}
                disabled={loading || testando}
              >
                {testando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Validar Dados
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? 'Atualizar' : 'Salvar Configuração'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default FiscalSettingsForm;
