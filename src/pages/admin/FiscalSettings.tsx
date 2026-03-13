import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FiscalSettingsForm } from '@/components/fiscal/FiscalSettingsForm';
import { AlertTriangle, CheckCircle2, Settings, Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FiscalSettings } from '@/types/nfce';

export function FiscalSettingsPage() {
  const { toast } = useToast();
  const { data: restaurant } = useQuery({
    queryKey: ['restaurant'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });
  const [fiscalSettings, setFiscalSettings] = useState<FiscalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    loadFiscalSettings();
  }, [restaurant?.id]);

  const loadFiscalSettings = async () => {
    try {
      setLoading(true);

      if (!restaurant?.id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('fiscal_settings')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setFiscalSettings(data || null);
    } catch (error: any) {
      console.error('Erro ao carregar configurações fiscais:', error);
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar suas configurações fiscais',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (data: FiscalSettings) => {
    setFiscalSettings(data);
    setEditMode(false);
    loadFiscalSettings();
  };

  const downloadSchema = () => {
    const schema = {
      empresa: {
        razao_social: 'DEL DELIVERY PRO LTDA',
        nome_fantasia: 'DEL DELIVERY PRO',
        cnpj: '12.345.678/0001-90',
        inscricao_estadual: '123456789012345',
        crt: 'SN' // ou 'AR' ou 'ME'
      },
      endereco: {
        endereco: 'Rua das Flores',
        numero: '123',
        complemento: 'Sala 10',
        bairro: 'Centro',
        cidade: 'São Paulo',
        uf: 'SP',
        cep: '01234-567'
      },
      certificado: {
        token_csc: 'XXXXXXXXXXXXX',
        id_token_csc: '123456',
        ambiente: 'homologacao' // ou 'producao'
      }
    };

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(schema, null, 2)));
    element.setAttribute('download', 'fiscal_settings_schema.json');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast({
      title: 'Template baixado',
      description: 'Arquivo schema_template.json foi baixado com sucesso',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Configuração Fiscal" />
      
      <div className="flex-1 p-4 md:p-6 space-y-6">

      {/* FORMULÁRIO OU RESUMO */}
      {editMode || !fiscalSettings ? (
        <FiscalSettingsForm
          restaurantId={restaurant?.id || ''}
          initialData={fiscalSettings || undefined}
          onSave={handleSave}
        />
      ) : (
        <>
          {/* RESUMO CONFIGURAÇÃO */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <CardTitle className="text-green-900">Configuração Ativa</CardTitle>
                    <CardDescription className="text-green-800">
                      Seus dados fiscais estão configurados
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Razão Social</p>
                  <p className="font-semibold">{fiscalSettings.razao_social}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">CNPJ</p>
                  <p className="font-semibold font-mono">{fiscalSettings.cnpj}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Inscrição Estadual</p>
                  <p className="font-semibold font-mono">{fiscalSettings.inscricao_estadual}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Código de Regime Tributário</p>
                  <p className="font-semibold">
                    {fiscalSettings.crt === 'SN' ? 'Simples Nacional' : 
                     fiscalSettings.crt === 'AR' ? 'Lucro Real' : 'Lucro Presumido'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Localização</p>
                  <p className="font-semibold">{fiscalSettings.cidade}, {fiscalSettings.uf}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ambiente</p>
                  <p className="font-semibold">
                    <span className={fiscalSettings.ambiente === 'homologacao' ? 'text-amber-600' : 'text-green-600'}>
                      {fiscalSettings.ambiente === 'homologacao' ? '🧪 Homologação' : '✅ Produção'}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Série NFC-e</p>
                  <p className="font-semibold">{fiscalSettings.serie_nfce}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Próximo número</p>
                  <p className="font-semibold">{fiscalSettings.proxima_nfce_numero}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={() => setEditMode(true)} variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Editar Configuração
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* STATUS EMISSÃO */}
          {fiscalSettings.is_ativo && (
            <Alert className="border-blue-200 bg-blue-50">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-900">Emissão Automática Ativada</AlertTitle>
              <AlertDescription className="text-blue-700">
                NFC-e será emitida automaticamente quando você marcar pedidos como pagos. 
                Ao pagar um pedido, a NFC-e será gerada, assinada e enviada para a SEFAZ.
              </AlertDescription>
            </Alert>
          )}

          {!fiscalSettings.is_ativo && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-900">Emissão Manual</AlertTitle>
              <AlertDescription className="text-amber-700">
                A emissão automática está desativada. Você pode emitir NFC-e manualmente na págin
a de histórico de notas fiscais.
              </AlertDescription>
            </Alert>
          )}

          {/* CARDS DE AÇÃO */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Histórico de NFC-e</CardTitle>
                <CardDescription>Visualize e gerencie suas notas fiscais emitidas</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Ir para Histórico
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Testar Configuração</CardTitle>
                <CardDescription>Envie uma NFC-e de teste para validar sua configuração</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Emitir Teste
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Documentação</CardTitle>
                <CardDescription>Baixe o template JSON para referência</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline" onClick={downloadSchema}>
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Template
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
      </div>
    </div>
  );
}

export default FiscalSettingsPage;
