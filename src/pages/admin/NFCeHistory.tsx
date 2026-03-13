import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Download, 
  FileText, 
  Loader2, 
  Eye, 
  AlertTriangle,
  CheckCircle2,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { NFCeInvoice, NFCeStatus } from '@/types/nfce';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

type StatusFilter = 'todas' | NFCeStatus;

const statusConfig: Record<NFCeStatus, { label: string; color: string; bgColor: string }> = {
  rascunho: { label: 'Rascunho', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  processando: { label: 'Processando', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  autorizada: { label: 'Autorizada', color: 'text-green-600', bgColor: 'bg-green-100' },
  rejeitada: { label: 'Rejeitada', color: 'text-red-600', bgColor: 'bg-red-100' },
  cancelada: { label: 'Cancelada', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  contingencia: { label: 'Contingência', color: 'text-orange-600', bgColor: 'bg-orange-100' },
};

export function NFCeHistoryPage() {
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
  const [invoices, setInvoices] = useState<NFCeInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todas');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<NFCeInvoice | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, [restaurant?.id, statusFilter, dateFrom, dateTo]);

  const loadInvoices = async () => {
    try {
      setLoading(true);

      if (!restaurant?.id) return;

      let query = supabase
        .from('nfce_invoices')
        .select('*')
        .eq('restaurant_id', restaurant.id);

      if (statusFilter !== 'todas') {
        query = query.eq('status', statusFilter);
      }

      if (dateFrom) {
        query = query.gte('data_emissao', new Date(dateFrom).toISOString());
      }

      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('data_emissao', endDate.toISOString());
      }

      const { data, error } = await query.order('data_emissao', { ascending: false });

      if (error) {
        console.error('Erro ao carregar NFC-e:', error);
        
        // Se a tabela não existe ou coluna não encontrada, mostrar mensagem amigável
        if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
          toast({
            title: 'Funcionalidade em desenvolvimento',
            description: 'O módulo NFC-e ainda não está disponível neste ambiente.',
            variant: 'default',
          });
          setInvoices([]);
          return;
        }
        
        throw error;
      }

      setInvoices(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar NFC-e:', error);
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar o histórico de NFC-e',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      inv.numero_nfce.toString().includes(term) ||
      inv.chave_nfce?.includes(term) ||
      inv.protocolo_autorizacao?.includes(term)
    );
  });

  const handleDownloadXML = async (invoice: NFCeInvoice) => {
    try {
      if (!invoice.xml_assinado) {
        toast({
          title: 'XML não disponível',
          description: 'O XML assinado não está disponível para download',
          variant: 'destructive',
        });
        return;
      }

      const element = document.createElement('a');
      element.setAttribute(
        'href',
        'data:text/xml;charset=utf-8,' + encodeURIComponent(invoice.xml_assinado)
      );
      element.setAttribute(
        'download',
        `nfce_${invoice.numero_nfce}_${invoice.chave_nfce}.xml`
      );
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      toast({
        title: 'XML baixado',
        description: `NFC-e ${invoice.numero_nfce} foi baixada com sucesso`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao download',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDownloadDANFE = async (invoice: NFCeInvoice) => {
    if (!invoice.danfe_url) {
      toast({
        title: 'DANFE não disponível',
        description: 'O DANFE não foi gerado ainda',
        variant: 'destructive',
      });
      return;
    }

    window.open(invoice.danfe_url, '_blank');
  };

  const getStatusBadge = (status: NFCeStatus) => {
    const config = statusConfig[status];
    return (
      <Badge className={config.bgColor}>
        <span className={config.color}>{config.label}</span>
      </Badge>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Histórico de NFC-e" />
      
      <div className="flex-1 p-4 md:p-6 space-y-6">
      {/* FILTROS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Buscar NFC-e</label>
              <Input
                placeholder="Número, Chave ou Protocolo"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="processando">Processando</SelectItem>
                  <SelectItem value="autorizada">Autorizada</SelectItem>
                  <SelectItem value="rejeitada">Rejeitada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                  <SelectItem value="contingencia">Contingência</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Data Inicial</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Data Final</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de NFC-e</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{filteredInvoices.length}</p>
            <p className="text-xs text-gray-500">neste período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Autorizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {filteredInvoices.filter(i => i.status === 'autorizada').length}
            </p>
            <p className="text-xs text-gray-500">sucesso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejeitadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {filteredInvoices.filter(i => i.status === 'rejeitada').length}
            </p>
            <p className="text-xs text-gray-500">falhas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(
                filteredInvoices.reduce((sum, i) => sum + i.valor_total, 0)
              )}
            </p>
            <p className="text-xs text-gray-500">montante</p>
          </CardContent>
        </Card>
      </div>

      {/* TABELA */}
      <Card>
        <CardHeader>
          <CardTitle>Notas Fiscais</CardTitle>
          <CardDescription>
            {filteredInvoices.length} resultado{filteredInvoices.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Nenhuma NFC-e encontrada</AlertTitle>
              <AlertDescription>
                Nenhuma nota fiscal corresponde aos filtros selecionados
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NFC-e</TableHead>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Protocolo</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-sm">
                        {invoice.numero_nfce}
                      </TableCell>
                      <TableCell className="text-sm">
                        {invoice.order_id ? (
                          <div>
                            <p className="font-medium">{invoice.order_id}</p>
                            <p className="text-xs text-gray-500">Pedido vinculado</p>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(invoice.data_emissao)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(invoice.valor_total)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(invoice.status)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {invoice.protocolo_autorizacao || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setShowDetail(true);
                            }}
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {invoice.xml_assinado && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownloadXML(invoice)}
                              title="Download XML"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          {invoice.danfe_url && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownloadDANFE(invoice)}
                              title="Download DANFE"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DIALOG DE DETALHES */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da NFC-e #{selectedInvoice?.numero_nfce}</DialogTitle>
            <DialogDescription>
              Chave: <span className="font-mono">{selectedInvoice?.chave_nfce}</span>
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Status</h3>
                {getStatusBadge(selectedInvoice.status)}
                {selectedInvoice.mensagem_retorno && (
                  <p className="text-sm text-gray-600 mt-2">{selectedInvoice.mensagem_retorno}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Emissão</p>
                  <p className="font-semibold">{formatDate(selectedInvoice.data_emissao)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Série/Número</p>
                  <p className="font-semibold">{selectedInvoice.serie} / {selectedInvoice.numero_nfce}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Valor Total</p>
                  <p className="font-semibold text-lg">{formatCurrency(selectedInvoice.valor_total)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Forma de Pagamento</p>
                  <p className="font-semibold">{selectedInvoice.forma_pagamento}</p>
                </div>
              </div>

              {selectedInvoice.protocolo_autorizacao && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <p className="font-semibold text-green-900">Autorizada</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-green-700">Protocolo</p>
                      <p className="font-mono font-semibold">{selectedInvoice.protocolo_autorizacao}</p>
                    </div>
                    {selectedInvoice.data_hora_autorizacao && (
                      <div>
                        <p className="text-green-700">Data/Hora</p>
                        <p className="font-semibold">{formatDate(selectedInvoice.data_hora_autorizacao)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-sm font-semibold mb-2">Itens</p>
                <div className="space-y-2">
                  {selectedInvoice.itens_nfce && Array.isArray(selectedInvoice.itens_nfce) && selectedInvoice.itens_nfce.map((item: any, i: number) => (
                    <div key={i} className="text-sm p-2 bg-gray-50 rounded">
                      <p className="font-medium">{item.descricao}</p>
                      <p className="text-gray-600">
                        {item.quantidade} {item.unidade_medida} × {formatCurrency(item.valor_unitario)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                {selectedInvoice.xml_assinado && (
                  <Button onClick={() => handleDownloadXML(selectedInvoice!)} size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Baixar XML
                  </Button>
                )}
                {selectedInvoice.danfe_url && (
                  <Button onClick={() => handleDownloadDANFE(selectedInvoice!)} size="sm" variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Baixar DANFE
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}

export default NFCeHistoryPage;
