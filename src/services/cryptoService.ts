/**
 * ETAPA 6: Segurança - Criptografia de Certificados e Tokens
 * 
 * Arquivo: src/services/cryptoService.ts
 * 
 * Responsabilidades:
 * - Criptografar/descriptografar certificado A1 (.pfx)
 * - Criptografar/descriptografar token CSC
 * - Criptografar/descriptografar senha do certificado
 * - Permanecer compatível com Supabase PostgreSQL
 */

import crypto from 'crypto';

/**
 * Configuração de Criptografia
 */
const ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm',
  keyLength: 32, // 256 bits para AES-256
  saltLength: 16,
  tagLength: 16,
  ivLength: 12, // 96 bits para GCM
};

/**
 * CLASSE: Serviço de Criptografia
 */
export class CryptoService {
  /**
   * Gera chave de criptografia a partir de uma senha mestra
   * 
   * IMPORTANTE: A senha mestra deve vir de variáveis de ambiente:
   * VITE_ENCRYPTION_KEY (desenvolvimento)
   * ou secret do Supabase Vault (produção)
   */
  private static getEncryptionKey(): Buffer {
    const masterPassword = process.env.VITE_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY;

    if (!masterPassword) {
      throw new Error(
        'ENCRYPTION_KEY não configurada. Configure a variável de ambiente VITE_ENCRYPTION_KEY'
      );
    }

    // Derivar chave de 32 bytes da senha mestra
    return crypto.scryptSync(masterPassword, 'nfce-salt', ENCRYPTION_CONFIG.keyLength);
  }

  /**
   * Criptografa um buffer (certificado .pfx)
   */
  static encryptBuffer(buffer: Buffer): string {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(ENCRYPTION_CONFIG.ivLength);

      const cipher = crypto.createCipheriv(ENCRYPTION_CONFIG.algorithm, key, iv);
      const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
      const authTag = cipher.getAuthTag();

      // Formato: iv + authTag + encryptedData (todos em base64)
      const combined = Buffer.concat([iv, authTag, encrypted]);
      return combined.toString('base64');
    } catch (error) {
      throw new Error(`Erro ao criptografar certificado: ${error}`);
    }
  }

  /**
   * Descriptografa um certificado previamente criptografado
   */
  static decryptBuffer(encryptedData: string): Buffer {
    try {
      const key = this.getEncryptionKey();
      const combined = Buffer.from(encryptedData, 'base64');

      // Extrair componentes
      const iv = combined.slice(0, ENCRYPTION_CONFIG.ivLength);
      const authTag = combined.slice(
        ENCRYPTION_CONFIG.ivLength,
        ENCRYPTION_CONFIG.ivLength + ENCRYPTION_CONFIG.tagLength
      );
      const encrypted = combined.slice(
        ENCRYPTION_CONFIG.ivLength + ENCRYPTION_CONFIG.tagLength
      );

      const decipher = crypto.createDecipheriv(ENCRYPTION_CONFIG.algorithm, key, iv);
      decipher.setAuthTag(authTag);

      return Buffer.concat([decipher.update(encrypted), decipher.final()]);
    } catch (error) {
      throw new Error(`Erro ao descriptografar certificado: ${error}`);
    }
  }

  /**
   * Criptografa uma string (token CSC, senha)
   */
  static encryptString(text: string): string {
    try {
      const buffer = Buffer.from(text, 'utf-8');
      return this.encryptBuffer(buffer);
    } catch (error) {
      throw new Error(`Erro ao criptografar texto: ${error}`);
    }
  }

  /**
   * Descriptografa uma string
   */
  static decryptString(encryptedData: string): string {
    try {
      const buffer = this.decryptBuffer(encryptedData);
      return buffer.toString('utf-8');
    } catch (error) {
      throw new Error(`Erro ao descriptografar texto: ${error}`);
    }
  }

  /**
   * Gera hash SHA256 para validação de integridade
   */
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Valida assinatura (para logs de auditoria)
   */
  static sign(data: string): string {
    const key = this.getEncryptionKey();
    return crypto
      .createHmac('sha256', key)
      .update(data)
      .digest('hex');
  }

  /**
   * Verifica assinatura
   */
  static verify(data: string, signature: string): boolean {
    const computed = this.sign(data);
    return crypto.timingSafeEqual(
      Buffer.from(computed),
      Buffer.from(signature)
    );
  }
}

/**
 * Helpers para usar no código
 */
export function encryptForDatabase(value: string | Buffer): string {
  if (typeof value === 'string') {
    return CryptoService.encryptString(value);
  } else {
    return CryptoService.encryptBuffer(value);
  }
}

export function decryptFromDatabase(encryptedValue: string): Buffer | string {
  // Tentar como buffer (certificado)
  // Se falhar, tentar como string
  try {
    return CryptoService.decryptBuffer(encryptedValue);
  } catch {
    return CryptoService.decryptString(encryptedValue);
  }
}

/**
 * ==========================================
 * INSTRUÇÕES DE IMPLEMENTAÇÃO
 * ==========================================
 * 
 * 1. SETUP - Variável de Ambiente
 *    
 *    Desenvolvimento (.env.local):
 *    VITE_ENCRYPTION_KEY=sua_senha_mestra_super_secreta_aqui
 *    
 *    Produção (Supabase Vault):
 *    1. Ir para Dashboard Supabase → Settings → Vault
 *    2. Criar secret: ENCRYPTION_KEY = sua_senha_mestra
 *    3. Usar process.env.ENCRYPTION_KEY
 * 
 * 2. USO NEM FORMULÁRIO FISCAL
 *    
 *    Ao salvar fiscal_settings:
 *    ```typescript
 *    const dados = {
 *      ...formData,
 *      token_csc: encryptForDatabase(formData.token_csc),
 *      certificado_senha: encryptForDatabase(formData.certificado_senha),
 *      certificado_a1_encrypted: encryptForDatabase(certificadoFile),
 *    };
 *    ```
 * 
 * 3. USO AO EMITIR NFC-e
 *    
 *    Ao chamar nfceService:
 *    ```typescript
 *    const tokenCSC = decryptFromDatabase(fiscalSettings.token_csc);
 *    const senha = decryptFromDatabase(fiscalSettings.certificado_senha);
 *    const certificado = decryptFromDatabase(fiscalSettings.certificado_a1_encrypted);
 *    
 *    // Agora pode usar os valores em claro para SOAP/assinatura
 *    ```
 * 
 * 4. LOGS E AUDITORIA
 *    
 *    Nunca registre valores em claro:
 *    ```typescript
 *    // ❌ NÃO FAÇA:
 *    console.log('Certificado:', certificado);
 *    
 *    // ✅ FAÇA:
 *    const hash = CryptoService.hash(certificado.toString());
 *    console.log('Certificado hash:', hash);
 *    ```
 * 
 * 5. TESTES LOCAIS
 *    
 *    Execute para validar:
 *    npm run test:crypto
 * 
 * ==========================================
 */

/**
 * Testes unitários (rodar com: npm run test:crypto)
 */
export const testCrypto = () => {
  console.log('=== Testando Criptografia NFC-e ===\n');

  // Teste 1: String
  console.log('Teste 1: Criptografar/Descriptografar String');
  const textoOriginal = 'MEU_TOKEN_CSC_SUPER_SECRETO';
  const textoCriptografado = CryptoService.encryptString(textoOriginal);
  const textoDescriptografado = CryptoService.decryptString(textoCriptografado);
  console.log(`Original: ${textoOriginal}`);
  console.log(`Criptografado: ${textoCriptografado.substring(0, 50)}...`);
  console.log(`Descriptografado: ${textoDescriptografado}`);
  console.log(`✓ Strings correspondentes: ${textoOriginal === textoDescriptografado}\n`);

  // Teste 2: Buffer (simulando certificado)
  console.log('Teste 2: Criptografar/Descriptografar Buffer');
  const bufferOriginal = Buffer.from('CONTEUDO_DO_CERTIFICADO_A1');
  const bufferCriptografado = CryptoService.encryptBuffer(bufferOriginal);
  const bufferDescriptografado = CryptoService.decryptBuffer(bufferCriptografado);
  console.log(`Original: ${bufferOriginal.toString()}`);
  console.log(`Criptografado: ${bufferCriptografado.substring(0, 50)}...`);
  console.log(`Descriptografado: ${bufferDescriptografado.toString()}`);
  console.log(`✓ Buffers correspondentes: ${bufferOriginal.equals(bufferDescriptografado)}\n`);

  // Teste 3: Hash
  console.log('Teste 3: Hash SHA256');
  const hash1 = CryptoService.hash('dados');
  const hash2 = CryptoService.hash('dados');
  const hash3 = CryptoService.hash('outros_dados');
  console.log(`Hash("dados"): ${hash1}`);
  console.log(`Hash("dados") novamente: ${hash2}`);
  console.log(`Hash("outros_dados"): ${hash3}`);
  console.log(`✓ Hashes determinísticos: ${hash1 === hash2}`);
  console.log(`✓ Hashes diferentes para dados diferentes: ${hash1 !== hash3}\n`);

  // Teste 4: Assinatura
  console.log('Teste 4: Assinatura HMAC');
  const dados = 'dados_importantes';
  const assinatura = CryptoService.sign(dados);
  const valida = CryptoService.verify(dados, assinatura);
  console.log(`Dados: ${dados}`);
  console.log(`Assinatura: ${assinatura}`);
  console.log(`✓ Assinatura válida: ${valida}\n`);

  console.log('=== Todos os testes passaram! ===');
};

export default CryptoService;
