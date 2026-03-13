# 📋 GUIA COMPLETO - CONFIGURAÇÃO NFC-e PARA CLIENTES

**Versão:** 1.0  
**Data:** Março 2026  
**Produto:** Sistema de Emissão de NFC-e para Delivery PRO  
**Suporte:** Configuração passo-a-passo

---

## 📑 ÍNDICE

1. [O Que é NFC-e?](#o-que-é-nfce)
2. [Pré-requisitos](#pré-requisitos)
3. [Onde Acessar](#onde-acessar)
4. [Passo-a-Passo Completo](#passo-a-passo-completo)
5. [Dados Necessários](#dados-necessários)
6. [Testes e Validação](#testes-e-validação)
7. [Troubleshooting](#troubleshooting)

---

## O Que é NFC-e?

**NFC-e = Nota Fiscal de Consumidor Eletrônica**

É um documento fiscal digital obrigatório no Brasil para:
- ✅ Restaurantes
- ✅ Lanchonetes
- ✅ Pizzarias
- ✅ Food trucks
- ✅ Qualquer negócio de alimentos

**Benefícios:**
- Emissão automática ao receber pagamento
- Validade fiscal imediata
- Rastreamento total de vendas
- Conformidade com Receita Federal
- Reduz autuações fiscais

---

## Pré-requisitos

Antes de começar, você precisa ter:

### 1️⃣ Certificado Digital A1 ✅
- **O que é:** Um arquivo (.pfx ou .p12) que comprova sua identidade
- **Validade:** 1 ano (deve renovar anualmente)
- **Custo:** R$ 150 - R$ 350/ano
- **Onde comprar:**
  - 🔗 [Autoridades Certificadoras ITI](https://www.iti.gov.br/)
  - Provedores: Certinfo, Serasa Experian, RFB

### 2️⃣ Token CSC (Código de Segurança)
- **O que é:** Código fornecido pela SEFAZ
- **Validade:** Indefinida até revogação
- **Custo:** Gratuito
- **Onde obter:**
  - 🔗 [Portal do SEFAZ do seu estado](https://www.nfe.fazenda.gov.br/portal/)
  - Exemplo SP: [SEFAZ-SP Portal](https://nf-e.santos.sp.gov.br/)

### 3️⃣ Dados da Empresa
- CNPJ
- Razão Social
- Nome Fantasia
- Inscrição Estadual
- Endereço completo
- UF (Estado)

### 4️⃣ Dados Pessoais do Responsável
- CPF
- Email
- Telefone

---

## Onde Acessar

### Local do Sistema

**URL:** `http://seu-servidor-delivery.com.br/admin`

**Navegação:**
```
Menu Lateral → "Fiscal (NFC-e)"
        ↓
   Clique em: "Configuração Fiscal"
```

### Páginas Disponíveis

| Página | URL | Função |
|--------|-----|--------|
| **Configuração** | `/admin/fiscal-settings` | Inserir dados fiscais |
| **Histórico** | `/admin/nfce-history` | Ver notas emitidas |
| **Dashboard** | `/dashboard` | Visualizar vendas |

---

## Passo-a-Passo Completo

### PASSO 1: Acessar o Sistema

```
1. Abra seu navegador
2. Digite: http://seu-servidor-delivery.com.br/admin
3. Faça login com suas credenciais
4. Procure por "Fiscal (NFC-e)" no menu lateral esquerdo
5. Clique em "Configuração"
```

### PASSO 2: Preencher Aba "EMPRESA"

**Localizar campos:**
```
┌─────────────────────────────────────┐
│ CONFIGURAÇÃO FISCAL - NFC-e         │
├─────────────────────────────────────┤
│ 📋 EMPRESA | Endereço | Certificado │
└─────────────────────────────────────┘
```

**Campo 1: Razão Social**
- **O que é:** Nome oficial da sua empresa no CNPJ
- **Exemplo:** "DEL DELIVERY PRO LTDA"
- **Onde encontrar:** Certidão da Junta Comercial ou Contrato Social
- **Obrigat?** ✅ SIM

**Campo 2: CNPJ**
- **O que é:** Número de 14 dígitos (XX.XXX.XXX/0001-XX)
- **Formato:** 12.345.678/0001-90
- **Onde encontrar:** 
  - 🔗 [Receita Federal](https://www.gov.br/gov.br-cnpj-consultarportalbrasil/cnpj/catalogo)
  - Seu cartão CNPJ
  - Nota fiscal anterior
- **Obrigat?** ✅ SIM

**Campo 3: Nome Fantasia**
- **O que é:** Como seu restaurante é conhecido
- **Exemplo:** "DEL DELIVERY PRO"
- **Onde encontrar:** Seu contrato/registro
- **Obrigat?** ⚠️ OPCIONAL

**Campo 4: Inscrição Estadual (IE)**
- **O que é:** Número de cadastro na Secretaria da Fazenda
- **Formato:** Varia por estado (SP: 12 números)
- **Onde encontrar:**
  - 🔗 [SEFAZ do seu estado](https://www.nfe.fazenda.gov.br/portal/)
  - Nota fiscal anterior
  - Documento de constituição
- **Obrigat?** ✅ SIM

**Campo 5: Código de Regime Tributário (CRT)**
- **O que é:** Enquadramento fiscal
- **Opções:**
  - 🏢 **SN** = Simples Nacional (RECOMENDADO para maioria)
  - 💼 **ME** = Lucro Presumido
  - 📊 **AR** = Lucro Real
- **Como verificar:** Contrato Social / Inscrição Estadual
- **Obrigat?** ✅ SIM

### PASSO 3: Preencher Aba "ENDEREÇO"

```
┌─────────────────────────────────────┐
│ CONFIGURAÇÃO FISCAL - NFC-e         │
├─────────────────────────────────────┤
│ Empresa | 📍 ENDEREÇO | Certificado │
└─────────────────────────────────────┘
```

**Campo 1: Rua/Logradouro**
- **O que é:** Nome da rua
- **Exemplo:** "Rua das Flores"
- **Obrigat?** ✅ SIM

**Campo 2: Número**
- **O que é:** Número do imóvel
- **Exemplo:** "123"
- **Obrigat?** ✅ SIM

**Campo 3: Complemento**
- **O que é:** Apartamento, sala, bloco (opcional)
- **Exemplo:** "Apto 1001"
- **Obrigat?** ⚠️ OPCIONAL

**Campo 4: Bairro**
- **O que é:** Nome do bairro
- **Exemplo:** "Centro"
- **Obrigat?** ✅ SIM

**Campo 5: Cidade**
- **O que é:** Nome da cidade
- **Exemplo:** "São Paulo"
- **Obrigat?** ✅ SIM

**Campo 6: UF (Estado)**
- **O que é:** Abreviação do estado
- **Opções:** SP, RJ, MG, RS, BA, etc
- **Obrigat?** ✅ SIM

**Campo 7: CEP**
- **O que é:** Código de Endereçamento Postal
- **Formato:** 12345-678
- **Onde encontrar:**
  - 🔗 [Correios CEP](https://buscacep.correios.com.br/)
  - Google Maps
- **Obrigat?** ✅ SIM

### PASSO 4: Preencher Aba "CERTIFICADO"

```
┌─────────────────────────────────────┐
│ CONFIGURAÇÃO FISCAL - NFC-e         │
├─────────────────────────────────────┤
│ Empresa | Endereço | 🔐 CERTIFICADO │
└─────────────────────────────────────┘
```

⚠️ **IMPORTANTE:** Este é o passo mais crítico!

**Campo 1: Upload do Certificado**
- **O que é:** Arquivo .pfx ou .p12 (seu certificado digital)
- **Como obter:**
  1. Acesse 🔗 [ITI - Autoridades Certificadoras](https://www.iti.gov.br/)
  2. Escolha uma AC (Certinfo, Serasa, RFB)
  3. Complete o cadastro
  4. Faça a validação presencial ou online
  5. Receba o arquivo .pfx por email
  6. Download do arquivo
- **Atenção:** Nunca compartilhe este arquivo!
- **Segurança:** Será criptografado no servidor
- **Obrigat?** ✅ SIM

**Campo 2: Senha do Certificado**
- **O que é:** Senha que você criou ao gerar o certificado
- **Exemplo:** "SenhaSegura@2024"
- **Atenção:** Salvamos criptografado
- **Obrigat?** ✅ SIM

**Campo 3: ID do Token CSC**
- **O que é:** Número ID fornecido pela SEFAZ
- **Formato:** Número (ex: "123456")
- **Como obter:**
  1. Acesse 🔗 [Portal do SEFAZ do seu estado](https://www.nfe.fazenda.gov.br/portal/)
  2. Faça login (CNPJ + Certificado)
  3. Menu → "CSC" ou "Token CSC"
  4. Copie o "ID do Token"
- **Obrigat?** ✅ SIM

**Campo 4: Token CSC (Código)**
- **O que é:** Código de segurança fornecido pela SEFAZ
- **Formato:** Letras e números (ex: "ABC12XYZ34")
- **Como obter:** Mesmo lugar do ID (portal SEFAZ)
- **Mudança:** Pode mudar a cada 365 dias
- **Obrigat?** ✅ SIM

### PASSO 5: Preencher Aba "AMBIENTE"

```
┌─────────────────────────────────────┐
│ CONFIGURAÇÃO FISCAL - NFC-e         │
├─────────────────────────────────────┤
│ Empresa | Endereço | ... | 🌍 AMBIENTE
└─────────────────────────────────────┘
```

**Campo 1: Ambiente de Operação**
- **O que é:** Qual servidor SEFAZ usar
- **Opções:**

  🟡 **HOMOLOGAÇÃO (TESTE)**
  - Para: Testes antes de começar
  - Validade: Nenhuma (fictício)
  - Risco: Nenhum
  - **RECOMENDADO:** Comece aqui!
  
  🟢 **PRODUÇÃO (REAL)**
  - Para: Depois de validado
  - Validade: Total (efetiva fiscalmente)
  - Risco: Afeta faturamento

- **Como escolher:** 
  1. Comece em HOMOLOGAÇÃO
  2. Teste por 1-2 semanas
  3. Depois mude para PRODUÇÃO

**Campo 2: Ativar Emissão Automática?**
- **O que faz:** Emite NFC-e automaticamente ao receber pagamento
- **Options:** ✅ Ativado / ❌ Desativado
- **Recomendado:** ✅ Ativar após validação

**Campo 3: Série NFC-e**
- **O que é:** Série numérica de emissão
- **Padrão:** 1
- **Quando mudar:** Raramente (quando autorizado pela SEFAZ)
- **Obrigat?** ✅ SIM

### PASSO 6: Salvar Configurações

```
1. Preencha todos os campos acima
2. Clique no botão verde: "💾 Salvar Configurações"
3. Aguarde a mensagem de sucesso (verde)
4. Pronto! Sistema configurado
```

**Mensagens esperadas:**
- ✅ "Configuração salva com sucesso!"
- ⚠️ "Certificado inválido" → Verificar arquivo
- ⚠️ "CNPJ inválido" → Verificar formato
- ⚠️ "Campo obrigatório" → Preencher todos

---

## Dados Necessários (Checklist)

Antes de começar, imprima e preencha:

```
📋 DADOS DA EMPRESA
├─ [ ] Razão Social: _________________________
├─ [ ] CNPJ: ______________________________
├─ [ ] Nome Fantasia: _______________________
├─ [ ] IE (Inscrição Estadual): _____________
└─ [ ] CRT (Regime Tributário): [ ] SN [ ] AR [ ] ME

📍 DADOS DO ENDEREÇO
├─ [ ] Rua: ________________________________
├─ [ ] Número: ____________________________
├─ [ ] Complemento (opcional): ______________
├─ [ ] Bairro: ____________________________
├─ [ ] Cidade: ____________________________
├─ [ ] UF: ________________________________
└─ [ ] CEP: ________________________________

🔐 DADOS DO CERTIFICADO
├─ [ ] Arquivo .pfx obtido (data: _________)
├─ [ ] Senha do certificado: ______________
├─ [ ] Validade: _____ até _____
└─ [ ] Local do arquivo: _________________

🎫 DADOS DO CSC
├─ [ ] ID Token CSC: _____________________
├─ [ ] Código CSC: _______________________
└─ [ ] Data de emissão: __________________

⚙️ CONFIGURAÇÃO
└─ [ ] Ambiente: [ ] Homologação [ ] Produção
```

---

## Testes e Validação

### TESTE 1: Testar Conexão

```
Menu → Fiscal (NFC-e) → Clique em "Testar Conexão"
```

**Resultado esperado:** ✅ "Conectado com sucesso"

**Se falhar:**
```
❌ "Conexão recusada"
   → Verificar internet
   → Verificar firewall
   
❌ "Certificado inválido"
   → Re-fazer upload do certificado
   → Verificar senha
   
❌ "Credenciais SEFAZ"
   → Verificar ID Token CSC
   → Verificar Código CSC
```

### TESTE 2: Emitir NFC-e de Teste

**Passos:**

```
1. Vá para Menu → PDV (Ponto de Venda)
2. Crie um pedido de TESTE (ex: Café + Pão)
3. Marque como "PAGO"
4. Sistema emitirá NFC-e automaticamente
5. Vá para "Histórico NFC-e"
6. Procure pelo seu pedido de teste
7. Status deve ser: ✅ "AUTORIZADA"
```

**Se status for:**
- ✅ **AUTORIZADA** → Sucesso! Pronto para produção
- ⏳ **PROCESSANDO** → Aguarde 30 segundos
- ❌ **REJEITADA** → Veja motivo e corrija

### TESTE 3: Validar no Portal SEFAZ

```
1. Acesse o Portal SEFAZ do seu estado
2. Menu → "Consultar NFC-e"
3. Digite a Chave da NFC-e (vem no histórico)
4. Clique em "Pesquisar"
5. Deve aparecer: ✅ "AUTORIZADA"
```

---

## Troubleshooting

### ❌ Problema: "Certificado expirado"

**Solução:**
```
1. Acesse 🔗 [ITI](https://www.iti.gov.br/)
2. Renove o certificado (custa ~R$200)
3. Faça novo upload no sistema
4. Teste novamente
```

### ❌ Problema: "CNPJ inválido"

**Solução:**
```
1. Verifique formato: XX.XXX.XXX/0001-XX
2. Copie direto da nota fiscal anterior
3. Remova espaços em branco
4. Salve novamente
```

### ❌ Problema: "CSC Token expirado"

**Solução:**
```
1. Acesse Portal SEFAZ do seu estado
2. Gere novo Token CSC
3. Copie ID e Código novo
4. Atualize no sistema
5. Salve e teste
```

### ❌ Problema: "Homologação funciona, mas Produção não"

**Solução:**
```
1. Aguarde liberação da SEFAZ (24-48h após homologação)
2. Solicite liberação no Portal SEFAZ
3. Verifique se ambiente está em "Produção"
4. Teste novamente
```

### ❌ Problema: "NFC-e não emite quando pago"

**Solução:**
```
1. Verifique se "Emissão Automática" está ✅ Ativada
2. Verifique se configuração foi salva
3. Tente marcar um pedido como "PAGO"
4. Vá ao "Histórico NFC-e"
5. Procure pelo novo pedido
```

---

## Links Importantes

### 🔗 Links Diretos

| Recurso | Link | Função |
|---------|------|--------|
| **Certificado** | https://www.iti.gov.br/ | Comprar certificado A1 |
| **SEFAZ SP** | https://sefaz.fazenda.sp.gov.br/ | Portal fiscal SP |
| **SEFAZ Geral** | https://www.nfe.fazenda.gov.br/portal/ | Portal federal |
| **Consultar CNPJ** | https://www.gov.br/ccj/ | Dados da empresa |
| **Consultar CEP** | https://buscacep.correios.com.br/ | Endereço |
| **Códigos IBGE** | https://www.ibge.gov.br/ | Códigos municipios |

### 📞 Suporte

**Em caso de dúvidas:**

| Problema | Contato |
|----------|---------|
| Técnico | suporte@deliverpro.com.br |
| Configuração | config@deliverpro.com.br |
| Fiscal | fiscal@deliverpro.com.br |
| Certificado | suporte.certificado@iti.gov.br |
| SEFAZ | hotline@sefaz.seu-estado.gov.br |

---

## 📊 Resumo Final

**Tempo estimado:** 30-45 minutos  
**Custo:** ~R$200 (certificado anual) + R$0 (sistema)  
**Benefício:** Conformidade fiscal 100%

**Após configurado:**
- ✅ NFC-e emite automaticamente
- ✅ Rastreamento de todas as vendas
- ✅ Reduz riscos de multa
- ✅ Facilita fiscalização

---

## 📝 Notas Importantes

1. **Segurança:** Nunca compartilhe seu certificado
2. **Backup:** Guarde cópia do certificado em lugar seguro
3. **Renovação:** Renove certificado antes de expirar
4. **Ambiente:** Comece SEMPRE em homologação
5. **Suporte:** Entre em contato se tiver dúvidas

---

**Este guia foi criado para o cliente final.**  
**Versão:** 1.0 | **Data:** Março 2026 | **Status:** ✅ Completo

Dúvidas? Contate o suporte técnico!

