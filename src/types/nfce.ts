// =====================================================
// Tipos para Sistema NFC-e (Emissão de Notas Fiscais)
// =====================================================

export type NFCeStatus = 'rascunho' | 'processando' | 'autorizada' | 'cancelada' | 'rejeitada' | 'contingencia';
export type NFCeAmbiente = 'homologacao' | 'producao';
export type NFCeCRT = 'SN' | 'AR' | 'ME'; // SN=Simples Nacional, AR=Lucro Real, ME=Lucro Presumido

/**
 * Configurações fiscais do restaurante
 */
export interface FiscalSettings {
  id: string;
  restaurant_id: string;
  
  // Dados da Empresa
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  inscricao_estadual: string;
  crt: NFCeCRT;
  
  // Endereço
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  
  // Configuração NFCe
  serie_nfce: number;
  proxima_nfce_numero: number;
  
  // Certificado (não exposto em API responses)
  certificado_a1_encrypted?: string;
  certificado_senha?: string;
  
  // Token CSC
  token_csc: string;
  id_token_csc: string;
  
  // Ambiente
  ambiente: NFCeAmbiente;
  is_ativo: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Item de uma NFC-e
 */
export interface NFCeItem {
  id?: string;
  descricao: string;
  ncm: string; // Código NCM (8 dígitos)
  cfop: string; // Código CFOP (4 dígitos)
  quantidade: number;
  unidade_medida: string; // 'UN', 'KG', 'L', etc
  valor_unitario: number;
  valor_desconto?: number;
  valor_total: number;
  
  // Informações de IPI, ICMS, PAIS
  icms_situacao_tributaria?: string;
  icms_aliquota?: number;
  ipi_aliquota?: number;
  
  // Rastreamento (opcional)
  numero_serie?: string;
  lote?: string;
}

/**
 * NFC-e (Nota Fiscal de Consumidor Eletrônica)
 */
export interface NFCeInvoice {
  id: string;
  restaurant_id: string;
  order_id: string;
  fiscal_settings_id: string;
  
  // Identificação
  numero_nfce: number;
  serie: number;
  numero_sequencial: number;
  chave_nfce: string;
  
  // Status
  status: NFCeStatus;
  
  // Protocolo SEFAZ
  protocolo_autorizacao?: string;
  data_hora_autorizacao?: string;
  
  // Preços
  valor_subtotal: number;
  valor_desconto: number;
  valor_total: number;
  
  // Itens
  itens_nfce: NFCeItem[];
  
  // Pagamento
  forma_pagamento: string; // '01'=Dinheiro, '04'=Cartão, etc
  
  // XML
  xml_enviado?: string;
  xml_autorizado?: string;
  xml_assinado?: string;
  
  // DANFE
  danfe_url?: string;
  
  // Mensagens
  mensagem_retorno?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  data_emissao: string;
}

/**
 * Log de operações em NFC-e
 */
export interface NFCeLog {
  id: string;
  nfce_id: string;
  tipo_operacao: string;
  descricao?: string;
  status_anterior?: NFCeStatus;
  status_novo?: NFCeStatus;
  resposta_sefaz?: Record<string, any>;
  created_at: string;
}

/**
 * Contingência NFC-e
 */
export interface NFCeContingencia {
  id: string;
  restaurant_id: string;
  motivo: string;
  data_inicio: string;
  data_fim?: string;
  tipo: 'sefaz_offline' | 'sistema_offline' | 'outro';
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Cancelamento de NFC-e
 */
export interface NFCeCancelamento {
  id: string;
  nfce_id: string;
  data_cancelamento: string;
  motivo: string;
  justificativa?: string;
  protocolo_cancelamento?: string;
  data_hora_cancelamento?: string;
  xml_cancelamento?: string;
  created_at: string;
}

/**
 * Resposta SEFAZ da Autorização
 */
export interface SEFAZAutorizacaoResponse {
  cStat: number; // 100=Autorizado, 110=Cancelado, 301=Uso Denegado, etc
  xMotivo: string;
  protNFe?: {
    infProt: {
      tpAmb: number; // 2=Produção, 1=Homologação
      verAplic: string;
      chNFe: string;
      dhRecbto: string;
      nProt: string;
      digVal: string;
      cStat: number;
      xMotivo: string;
    };
  };
}

/**
 * Resposta SEFAZ do Cancelamento
 */
export interface SEFAZCancelamentoResponse {
  cStat: number;
  xMotivo: string;
  retEvento?: {
    infEvento: {
      tpAmb: number;
      verAplic: string;
      chNFe: string;
      dhRecbto: string;
      nSeqEvento: number;
      CNPJAutor: string;
      idLote: string;
      cStat: number;
      xMotivo: string;
      nProt: string;
    };
  };
}

/**
 * Forma de Pagamento
 */
export interface FormaPagamento {
  tPag: string; // Tipo: '01'=Dinheiro, '04'=Cartão Crédito, '05'=Cartão Débito, '10'=Vale Refeição, etc
  vPag: number; // Valor
  CNPJ?: string; // CNPJ da administradora (cartão)
  tBanc?: string; // Tipo de banco
  tpIntegra?: number; // Tipo de integração
}

/**
 * Configuração de Endpoints SEFAZ por Estado
 */
export interface SEFAZEndpoint {
  uf: string;
  homologacao: string;
  producao: string;
  timeout?: number;
}

/**
 * Requisição para gerar NFC-e
 */
export interface GenerateNFCeRequest {
  order_id: string;
  restaurant_id: string;
  forma_pagamento: string;
  observacoes?: string;
}

/**
 * Resposta de geração NFC-e
 */
export interface GenerateNFCeResponse {
  success: boolean;
  nfce_id?: string;
  message: string;
  data?: {
    chave_nfce: string;
    numero_nfce: number;
    protocolo_autorizacao?: string;
  };
}
