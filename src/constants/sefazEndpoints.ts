// =====================================================
// SEFAZ Endpoints por Estado
// Configuração de endpoints para emissão de NFC-e
// =====================================================

import { SEFAZEndpoint } from '@/types/nfce';

export const SEFAZ_ENDPOINTS: Record<string, SEFAZEndpoint> = {
  // REGIÃO NORDESTE - SEFAZ-NFC-SP (coordenadora)
  BA: {
    uf: 'BA',
    homologacao: 'https://nfe-homolog.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
    producao: 'https://nfe.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
  },
  CE: {
    uf: 'CE',
    homologacao: 'https://nfe-homolog.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
    producao: 'https://nfe.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
  },
  PE: {
    uf: 'PE',
    homologacao: 'https://nfe-homolog.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
    producao: 'https://nfe.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
  },

  // REGIÃO NORTE
  AC: {
    uf: 'AC',
    homologacao: 'https://nfe-homolog.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
    producao: 'https://nfe.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
  },
  AM: {
    uf: 'AM',
    homologacao: 'https://nfe-homolog.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
    producao: 'https://nfe.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
  },
  AP: {
    uf: 'AP',
    homologacao: 'https://nfe-homolog.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
    producao: 'https://nfe.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
  },
  PA: {
    uf: 'PA',
    homologacao: 'https://nfe-homolog.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
    producao: 'https://nfe.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
  },
  RO: {
    uf: 'RO',
    homologacao: 'https://nfe-homolog.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
    producao: 'https://nfe.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
  },
  RR: {
    uf: 'RR',
    homologacao: 'https://nfe-homolog.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
    producao: 'https://nfe.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
  },
  TO: {
    uf: 'TO',
    homologacao: 'https://nfe-homolog.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
    producao: 'https://nfe.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
  },

  // REGIÃO CENTRO-OESTE
  DF: {
    uf: 'DF',
    homologacao: 'https://nfe-homolog.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
    producao: 'https://nfe.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
  },
  GO: {
    uf: 'GO',
    homologacao: 'https://nfe-homolog.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
    producao: 'https://nfe.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
  },
  MT: {
    uf: 'MT',
    homologacao: 'https://nfe-homolog.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
    producao: 'https://nfe.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
  },
  MS: {
    uf: 'MS',
    homologacao: 'https://nfe-homolog.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
    producao: 'https://nfe.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
  },

  // REGIÃO SUDESTE
  ES: {
    uf: 'ES',
    homologacao: 'https://nfe-homolog.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
    producao: 'https://nfe.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
  },
  MG: {
    uf: 'MG',
    homologacao: 'https://nfe-homolog.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
    producao: 'https://nfe.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
  },
  RJ: {
    uf: 'RJ',
    homologacao: 'https://nfe-homolog.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
    producao: 'https://nfe.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
  },
  SP: {
    uf: 'SP',
    homologacao: 'https://nfe-homolog.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
    producao: 'https://nfe.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
  },

  // REGIÃO SUL
  PR: {
    uf: 'PR',
    homologacao: 'https://nfe-homolog.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
    producao: 'https://nfe.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
  },
  RS: {
    uf: 'RS',
    homologacao: 'https://nfe-homolog.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
    producao: 'https://nfe.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
  },
  SC: {
    uf: 'SC',
    homologacao: 'https://nfe-homolog.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
    producao: 'https://nfe.svrs.rs.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
  },
};

/**
 * Estados brasileiros com seus códigos de telefone
 */
export const ESTADOS_BR = [
  { uf: 'AC', nome: 'Acre' },
  { uf: 'AL', nome: 'Alagoas' },
  { uf: 'AP', nome: 'Amapá' },
  { uf: 'AM', nome: 'Amazonas' },
  { uf: 'BA', nome: 'Bahia' },
  { uf: 'CE', nome: 'Ceará' },
  { uf: 'DF', nome: 'Distrito Federal' },
  { uf: 'ES', nome: 'Espírito Santo' },
  { uf: 'GO', nome: 'Goiás' },
  { uf: 'MA', nome: 'Maranhão' },
  { uf: 'MT', nome: 'Mato Grosso' },
  { uf: 'MS', nome: 'Mato Grosso do Sul' },
  { uf: 'MG', nome: 'Minas Gerais' },
  { uf: 'PA', nome: 'Pará' },
  { uf: 'PB', nome: 'Paraíba' },
  { uf: 'PR', nome: 'Paraná' },
  { uf: 'PE', nome: 'Pernambuco' },
  { uf: 'PI', nome: 'Piauí' },
  { uf: 'RJ', nome: 'Rio de Janeiro' },
  { uf: 'RN', nome: 'Rio Grande do Norte' },
  { uf: 'RS', nome: 'Rio Grande do Sul' },
  { uf: 'RO', nome: 'Rondônia' },
  { uf: 'RR', nome: 'Roraima' },
  { uf: 'SC', nome: 'Santa Catarina' },
  { uf: 'SP', nome: 'São Paulo' },
  { uf: 'SE', nome: 'Sergipe' },
  { uf: 'TO', nome: 'Tocantins' },
];

/**
 * Código de Regime Tributário
 */
export const CRT_OPTIONS = [
  { value: 'SN', label: 'Simples Nacional' },
  { value: 'AR', label: 'Lucro Real' },
  { value: 'ME', label: 'Lucro Presumido' },
];

/**
 * Formas de Pagamento NFCe
 */
export const FORMA_PAGAMENTO = [
  { tPag: '01', label: 'Dinheiro', padrao: true },
  { tPag: '02', label: 'Cheque' },
  { tPag: '03', label: 'Cartão de Crédito' },
  { tPag: '04', label: 'Cartão de Débito' },
  { tPag: '05', label: 'Crédito Loja' },
  { tPag: '10', label: 'Vale Refeição' },
  { tPag: '11', label: 'Vale Alimentação' },
  { tPag: '12', label: 'Vale Combustível' },
  { tPag: '13', label: 'Vale Cultura' },
  { tPag: '14', label: 'Vale Educação' },
  { tPag: '15', label: 'Vale Presença' },
  { tPag: '16', label: 'Vale Transporte' },
  { tPag: '17', label: 'Boleto Bancário' },
  { tPag: '18', label: 'Depósito Bancário' },
  { tPag: '19', label: 'Pagamento Instantâneo (PIX/TED/DOC)' },
  { tPag: '20', label: 'Transferência Bancária' },
  { tPag: '30', label: 'Sem Pagamento' },
  { tPag: '99', label: 'Outro' },
];

/**
 * Códigos NCM mais comuns para alimentação
 */
export const NCM_ALIMENTACAO_COMUNS = [
  { ncm: '21069090', descricao: 'Alimentos preparados (refeições prontas)' },
  { ncm: '19059000', descricao: 'Produtos de panificação' },
  { ncm: '04100000', descricao: 'Leite fresco sem fermentação' },
  { ncm: '04031000', descricao: 'Queijo Fresco' },
  { ncm: '21011000', descricao: 'Leveduras (fermento)' },
  { ncm: '22030000', descricao: 'Bebidas cervejadas' },
  { ncm: '22011000', descricao: 'Água potável' },
  { ncm: '22050000', descricao: 'Bebidas destiladas e alcoólicas' },
];

/**
 * Códigos CFOP (Classificação Fiscal de Operações e Prestações)
 * Série 5000 = Operações internas (ESTADUAL)
 */
export const CFOP_VENDAS = [
  { cfop: '5102', descricao: 'Venda de mercadoria' },
  { cfop: '5949', descricao: 'Outra saída de mercadoria' },
];

/**
 * Unidades de Medida (SEFAZ)
 */
export const UNIDADES_MEDIDA = [
  { un: 'UN', label: 'Unidade' },
  { un: 'KG', label: 'Quilograma' },
  { un: 'G', label: 'Grama' },
  { un: 'L', label: 'Litro' },
  { un: 'ML', label: 'Mililitro' },
  { un: 'M', label: 'Metro' },
  { un: 'M2', label: 'Metro Quadrado' },
  { un: 'M3', label: 'Metro Cúbico' },
  { un: 'TON', label: 'Tonelada' },
  { un: 'DZ', label: 'Dúzia' },
];

/**
 * Situação Tributária de ICMS
 */
export const ICMS_SITUACAO_TRIBUTARIA = [
  { st: '00', label: 'Tributada integralmente' },
  { st: '10', label: 'Tributada e com cobrança do ICMS por substituição tributária' },
  { st: '20', label: 'Com redução de base de cálculo' },
  { st: '30', label: 'Isenta' },
  { st: '40', label: 'Não tributada' },
  { st: '41', label: 'Não tributada (ISSQN)' },
  { st: '50', label: 'Suspensão' },
  { st: '60', label: 'Diferimento' },
  { st: '70', label: 'Com redução de base de cálculo e cobrança do ICMS por substituição tributária' },
  { st: '90', label: 'Outras' },
];
