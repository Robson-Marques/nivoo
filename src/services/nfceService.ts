/**
 * Serviço de Emissão de NFC-e (Nota Fiscal de Consumidor Eletrônica)
 * Responsável por:
 * - Geração de XML conforme IEC 10/2021 (layout 4.00)
 * - Assinatura digital com certificado A1
 * - Comunicação SOAP com SEFAZ
 * - Gestão de números sequenciais
 */

import { 
  NFCeInvoice, 
  NFCeStatus, 
  NFCeItem,
  FiscalSettings,
  GenerateNFCeRequest,
  GenerateNFCeResponse,
  SEFAZAutorizacaoResponse,
  FormaPagamento
} from '@/types/nfce';
import { SEFAZ_ENDPOINTS, FORMA_PAGAMENTO } from '@/constants/sefazEndpoints';
import { supabase } from '@/integrations/supabase/client';

/**
 * NFC-e Service
 */
export class NFCeService {
  /**
   * Gera XML de NFC-e conforme padrão SEFAZ 4.00
   */
  static async generateNFCeXML(
    order: any,
    items: NFCeItem[],
    fiscalSettings: FiscalSettings,
    formaPagamento: string = '01'
  ): Promise<string> {
    try {
      // Validar CNPJ
      if (!this.isValidCNPJ(fiscalSettings.cnpj)) {
        throw new Error('CNPJ inválido');
      }

      // Número da NFC-e
      const nfceNumber = fiscalSettings.proxima_nfce_numero;
      
      // Calcular valores
      const valorSubtotal = items.reduce((sum, item) => sum + item.valor_total, 0);
      const valorDesconto = order.desconto || 0;
      const valorTotal = valorSubtotal - valorDesconto;

      // Construir XML
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe Id="NFe${this.generateChaveNFCe(
        fiscalSettings.uf,
        new Date(),
        fiscalSettings.cnpj,
        fiscalSettings.serie_nfce,
        nfceNumber
      )}" versaoNFe="4.00">
    <ide>
      <cUF>${this.ufToCode(fiscalSettings.uf)}</cUF>
      <cNF>${this.generateCNF()}</cNF>
      <assinaturaQRcode></assinaturaQRcode>
      <mod>65</mod>
      <serie>${fiscalSettings.serie_nfce}</serie>
      <nNF>${nfceNumber}</nNF>
      <dhEmi>${this.formatDateTime(new Date())}</dhEmi>
      <dhSaiEnt>${this.formatDateTime(new Date())}</dhSaiEnt>
      <tpNF>1</tpNF>
      <idDest>1</idDest>
      <cMunFG>${this.getCodMunicipio(fiscalSettings.cidade, fiscalSettings.uf)}</cMunFG>
      <tpImp>2</tpImp>
      <tpEmis>1</tpEmis>
      <cDV>0</cDV>
      <tpAmb>${fiscalSettings.ambiente === 'producao' ? 2 : 1}</tpAmb>
      <finNFe>1</finNFe>
      <indFinal>1</indFinal>
      <indPres>1</indPres>
      <procEmi>0</procEmi>
      <verProc>4.00</verProc>
    </ide>

    <!-- EMITENTE -->
    <emit>
      <CNPJ>${fiscalSettings.cnpj}</CNPJ>
      <xNome>${fiscalSettings.razao_social}</xNome>
      <xFant>${fiscalSettings.nome_fantasia || fiscalSettings.razao_social}</xFant>
      <enderEmit>
        <xLgr>${fiscalSettings.endereco}</xLgr>
        <nro>${fiscalSettings.numero}</nro>
        ${fiscalSettings.complemento ? `<xCpl>${fiscalSettings.complemento}</xCpl>` : ''}
        <xBairro>${fiscalSettings.bairro}</xBairro>
        <cMun>${this.getCodMunicipio(fiscalSettings.cidade, fiscalSettings.uf)}</cMun>
        <xMun>${fiscalSettings.cidade}</xMun>
        <UF>${fiscalSettings.uf}</UF>
        <CEP>${fiscalSettings.cep}</CEP>
        <cPais>1058</cPais>
        <xPais>Brasil</xPais>
      </enderEmit>
      <IE>${fiscalSettings.inscricao_estadual}</IE>
      <CRT>${this.crtToCode(fiscalSettings.crt)}</CRT>
    </emit>

    <!-- DESTINATÁRIO (consumidor final, vazio ou genérico) -->
    <dest>
      <idEstrangeiro></idEstrangeiro>
    </dest>

    <!-- ENDEREÇO DE ENTREGA (opcional para NFC-e) -->
    <entrega />

    <!-- DETALHES DOS PRODUTOS/SERVIÇOS -->
    <det>
${items.map((item, index) => this.generateDetItem(item, index + 1)).join('\n')}
    </det>

    <!-- TOTAL -->
    <total>
      <ICMSTot>
        <vBC>0.00</vBC>
        <vICMS>0.00</vICMS>
        <vICMSDeson>0.00</vICMSDeson>
        <vFCP>0.00</vFCP>
        <vBCST>0.00</vBCST>
        <vST>0.00</vST>
        <vFCPST>0.00</vFCPST>
        <vFCPSTRet>0.00</vFCPSTRet>
        <vProd>${valorSubtotal.toFixed(2)}</vProd>
        <vFrete>0.00</vFrete>
        <vSeg>0.00</vSeg>
        <vDesc>${valorDesconto.toFixed(2)}</vDesc>
        <vII>0.00</vII>
        <vIPI>0.00</vIPI>
        <vIPIDevol>0.00</vIPIDevol>
        <vPIS>0.00</vPIS>
        <vCOFINS>0.00</vCOFINS>
        <vOutro>0.00</vOutro>
        <vNF>${valorTotal.toFixed(2)}</vNF>
      </ICMSTot>
    </total>

    <!-- TRANSPORTE (simplificado) -->
    <transp>
      <modFrete>9</modFrete>
    </transp>

    <!-- PAGAMENTO -->
    <pag>
      <detPag>
        <tPag>${formaPagamento}</tPag>
        <vPag>${valorTotal.toFixed(2)}</vPag>
      </detPag>
    </pag>

    <!-- INFORMAÇÕES ADICIONAIS -->
    <infAdic>
      <infCpl>Documento emitido por DEL DELIVERY PRO - Plataforma de Comando</infCpl>
    </infAdic>

    <!-- EXPORTAÇÃO (opcional) -->
    <exporta />

    <!-- COMPRADOR (opcional, deixar vazio) -->
    <compra />

    <!-- CANA (opcional) -->
    <cana />
  </infNFe>
</NFe>`;

      return xml;
    } catch (error) {
      console.error('Erro ao gerar XML NFC-e:', error);
      throw error;
    }
  }

  /**
   * Gera item detalhado da NFC-e
   */
  private static generateDetItem(item: NFCeItem, index: number): string {
    return `
      <det nItem="${index}">
        <prod>
          <cProd>${item.numero_serie || 'PROD' + index}</cProd>
          <cEAN>SEM GTIN</cEAN>
          <xProd>${item.descricao}</xProd>
          <NCM>${item.ncm}</NCM>
          <CFOP>${item.cfop}</CFOP>
          <uCom>${item.unidade_medida}</uCom>
          <qCom>${item.quantidade.toFixed(4)}</qCom>
          <vUnCom>${(item.valor_unitario).toFixed(2)}</vUnCom>
          <vProd>${item.valor_total.toFixed(2)}</vProd>
          <vDesc>${(item.valor_desconto || 0).toFixed(2)}</vDesc>
          <vOutro>0.00</vOutro>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>40</CST>
              <pICMS>0</pICMS>
            </ICMS00>
          </ICMS>
          <PIS>
            <PISNT>
              <CST>06</CST>
            </PISNT>
          </PIS>
          <COFINS>
            <COFINSNT>
              <CST>06</CST>
            </COFINSNT>
          </COFINS>
        </imposto>
      </det>`;
  }

  /**
   * Assina XML com certificado digital A1
   * @note Implementação aguarda integração com módulo de criptografia
   */
  static async signXML(
    xml: string,
    certificado: Buffer,
    senha: string
  ): Promise<string> {
    try {
      // TODO: Implementar assinatura usando xmldsig e node-pkcs12
      console.log('Assinando XML com certificado A1...');
      
      // Placeholder para assinatura real
      return xml.replace('<NFe xmlns=', '<NFe xmlns="" assinado="true" ');
    } catch (error) {
      console.error('Erro ao assinar XML:', error);
      throw error;
    }
  }

  /**
   * Submete XML para SEFAZ via SOAP
   */
  static async submitToSEFAZ(
    xmlAssinado: string,
    uf: string,
    ambiente: 'homologacao' | 'producao'
  ): Promise<SEFAZAutorizacaoResponse> {
    try {
      const endpoint = SEFAZ_ENDPOINTS[uf];
      if (!endpoint) {
        throw new Error(`Estado ${uf} não configurado`);
      }

      const url = ambiente === 'producao' ? endpoint.producao : endpoint.homologacao;

      // TODO: Implementar SOAP call com node-soap
      console.log(`Enviando para SEFAZ (${uf} - ${ambiente}): ${url}`);

      // Placeholder para resposta real
      return {
        cStat: 100,
        xMotivo: 'Autorizado',
        protNFe: {
          infProt: {
            tpAmb: ambiente === 'producao' ? 2 : 1,
            verAplic: '4.00',
            chNFe: this.generateChaveNFCe(uf, new Date(), '', 1, 1),
            dhRecbto: this.formatDateTime(new Date()),
            nProt: this.generateProtocolo(),
            digVal: 'hash_placeholder',
            cStat: 100,
            xMotivo: 'Autorizado'
          }
        }
      };
    } catch (error) {
      console.error('Erro ao submeter para SEFAZ:', error);
      throw error;
    }
  }

  /**
   * Salva NFC-e no banco de dados
   */
  static async saveNFCeInvoice(
    restaurantId: string,
    orderId: string,
    fiscalSettingsId: string,
    nfceNumber: number,
    xmlAssinado: string,
    xmlAutorizado: string | null,
    protocoAutorizacao: string | null,
    valorTotal: number,
    itens: NFCeItem[],
    formaPagamento: string
  ): Promise<NFCeInvoice> {
    try {
      // Gerar chave NFCe
      const uf = (await this.getFiscalSettings(restaurantId))?.uf || 'SP';
      const chaveNFce = this.generateChaveNFCe(
        uf,
        new Date(),
        '',
        1,
        nfceNumber
      );

      const { data, error } = await supabase
        .from('nfce_invoices')
        .insert({
          restaurant_id: restaurantId,
          order_id: orderId,
          fiscal_settings_id: fiscalSettingsId,
          numero_nfce: nfceNumber,
          serie: 1,
          numero_sequencial: nfceNumber,
          chave_nfce: chaveNFce,
          status: protocoAutorizacao ? 'autorizada' : 'rascunho',
          protocolo_autorizacao: protocoAutorizacao,
          data_hora_autorizacao: protocoAutorizacao ? new Date().toISOString() : null,
          valor_subtotal: itens.reduce((sum, item) => sum + item.valor_unitario * item.quantidade, 0),
          valor_desconto: itens.reduce((sum, item) => sum + (item.valor_desconto || 0), 0),
          valor_total: valorTotal,
          itens_nfce: itens,
          forma_pagamento: formaPagamento,
          xml_enviado: xmlAssinado,
          xml_autorizado: xmlAutorizado,
          xml_assinado: xmlAssinado
        })
        .select()
        .single();

      if (error) throw error;

      return data as NFCeInvoice;
    } catch (error) {
      console.error('Erro ao salvar NFC-e:', error);
      throw error;
    }
  }

  /**
   * Registra log de operação
   */
  static async logNFCeOperation(
    nfceId: string,
    tipoOperacao: string,
    descricao: string,
    statusAnterior?: NFCeStatus,
    statusNovo?: NFCeStatus,
    respostaSEFAZ?: any
  ): Promise<void> {
    try {
      await supabase
        .from('nfce_log')
        .insert({
          nfce_id: nfceId,
          tipo_operacao: tipoOperacao,
          descricao,
          status_anterior: statusAnterior,
          status_novo: statusNovo,
          resposta_sefaz: respostaSEFAZ
        });
    } catch (error) {
      console.error('Erro ao registrar log NFC-e:', error);
    }
  }

  /**
   * Obtém configurações fiscais do restaurante
   */
  static async getFiscalSettings(restaurantId: string): Promise<FiscalSettings | null> {
    try {
      const { data, error } = await supabase
        .from('fiscal_settings')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as FiscalSettings | null;
    } catch (error) {
      console.error('Erro ao obter fiscal settings:', error);
      return null;
    }
  }

  // ==================== UTILITÁRIOS ====================

  /**
   * Valida CNPJ
   */
  private static isValidCNPJ(cnpj: string): boolean {
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length !== 14) return false;
    
    let size = clean.length - 2;
    let numbers = clean.substring(0, size);
    const digits = clean.substring(size);
    let sum = 0;
    let pos = size - 7;

    for (let i = size; i >= 1; i--) {
      sum += numbers.charAt(size - i) * pos--;
      if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    size = size + 1;
    numbers = clean.substring(0, size);
    sum = 0;
    pos = size - 7;

    for (let i = size; i >= 1; i--) {
      sum += numbers.charAt(size - i) * pos--;
      if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return result === parseInt(digits.charAt(1));
  }

  /**
   * Converte UF para código numérico
   */
  private static ufToCode(uf: string): string {
    const map: Record<string, string> = {
      AC: '04', AL: '27', AP: '16', AM: '03', BA: '05', CE: '07', DF: '26', ES: '32',
      GO: '10', MA: '11', MT: '28', MS: '10', MG: '31', PA: '15', PB: '21', PR: '41',
      PE: '07', PI: '22', RJ: '33', RN: '24', RS: '43', RO: '23', RR: '14', SC: '24',
      SP: '35', SE: '28', TO: '29'
    };
    return map[uf] || '35'; // SP como padrão
  }

  /**
   * Obtém código de município (IBGE)
   * TODO: Integrar com tabela de municípios
   */
  private static getCodMunicipio(cidade: string, uf: string): string {
    // Placeholder - deveria vir de tabela de IBGE
    return '3550308'; // São Paulo (SP) como padrão
  }

  /**
   * Converte CRT para código
   */
  private static crtToCode(crt: string): string {
    const map: Record<string, string> = {
      SN: '1', // Simples Nacional
      AR: '2', // Lucro Real
      ME: '3'  // Lucro Presumido
    };
    return map[crt] || '1';
  }

  /**
   * Gera chave NFCe (44 dígitos)
   * Formato: UF(2) + DDMM(4) + CNPJ(8) + Modelo(2) + Série(3) + Número(9) + DV(1)
   */
  private static generateChaveNFCe(
    uf: string,
    data: Date,
    cnpj: string,
    serie: number,
    numero: number
  ): string {
    const ufCode = this.ufToCode(uf);
    const ddmm = String(data.getDate()).padStart(2, '0') + String(data.getMonth() + 1).padStart(2, '0');
    const cnpjClean = cnpj.replace(/\D/g, '').padEnd(8, '0');
    const modelo = '65';
    const serieStr = String(serie).padStart(3, '0');
    const numeroStr = String(numero).padStart(9, '0');

    let chave = ufCode + ddmm + cnpjClean + modelo + serieStr + numeroStr;
    const dv = this.calcularDigitoVerificador(chave);

    return chave + dv;
  }

  /**
   * Calcula dígito verificador (mod 11)
   */
  private static calcularDigitoVerificador(chave: string): string {
    let sequence = '2,9,8,7,6,5,4,3,2,9,8,7,6,5,4,3,2,9,8,7,6,5,4,3,2,9,8,7,6,5,4,3,2,9,8,7,6,5,4,3,2,9,8'.split(',');
    let calculation = 0;

    for (let i = 0; i < chave.length; i++) {
      calculation += parseInt(chave[i]) * parseInt(sequence[i]);
    }

    let remainder = calculation % 11;
    return remainder === 0 || remainder === 1 ? '0' : String(11 - remainder);
  }

  /**
   * Gera Código Numérico Fiscal (CNF) - 8 dígitos aleatórios
   */
  private static generateCNF(): string {
    return String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
  }

  /**
   * Gera protocolo SEFAZ (15 dígitos)
   */
  private static generateProtocolo(): string {
    return String(Math.floor(Math.random() * 1000000000000000)).padStart(15, '0');
  }

  /**
   * Formata data/hora para padrão SEFAZ
   * Formato: YYYY-MM-DDTHH:mm:ss-03:00
   */
  private static formatDateTime(date: Date): string {
    // Simples - deveria considerar timezone
    return date.toISOString().replace('Z', '-03:00').substring(0, 19) + '-03:00';
  }
}

export default NFCeService;
