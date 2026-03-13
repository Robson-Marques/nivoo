# 🚀 INÍCIO RÁPIDO - NFC-e DELIVERY PRO

## ⚡ 5 MINUTOS PARA COMEÇAR

### 1️⃣ ADICIONAR VARIÁVEL DE AMBIENTE

Abra `.env.local` e adicione:
```
VITE_ENCRYPTION_KEY=uma_senha_super_secreta_para_criptografia_2024
```

### 2️⃣ SERVIDOR JÁ ESTÁ RODANDO

```
✅ http://localhost:8088
```

### 3️⃣ ACESSAR CONFIGURAÇÃO FISCAL

Vá para:
```
/admin/fiscal-settings
```

### 4️⃣ PREENCHER FORMULÁRIO

**Aba: Empresa**
- Razão Social: `Seu Restaurante LTDA`
- CNPJ: `12.345.678/0001-90` (com máscara)
- IE: `123456789012345`
- CRT: `SN` (Simples Nacional)

**Aba: Endereço**
- Rua: `Rua das Flores`
- Número: `123`
- Bairro: `Centro`
- Cidade: `São Paulo`
- UF: `SP`
- CEP: `01234-567`

**Aba: Certificado**
- Upload: seu arquivo `.pfx`
- Senha: a senha do .pfx
- Token CSC: `XXXXX...`
- ID Token: `123456`

**Aba: Ambiente**
- Ambiente: `Homologação` (para testar)
- Emissão automática: ☑️ Ativar

### 5️⃣ CLICAR EM "SALVAR CONFIGURAÇÃO"

Pronto! Dados criptografados no banco.

### 6️⃣ TESTAR

1. Crie um pedido qualquer no seu sistema
2. Marque como **PAGO**
3. NFC-e será emitida automaticamente ✨
4. Veja em `/admin/nfce-history`

---

## 📖 DOCUMENTAÇÃO COMPLETA

Leia os guias detalhados:

- **NFC_E_IMPLEMENTATION.md** - Tudo sobre implementação técnica
- **NFC_E_COMPLETION.md** - Resumo executivo com checklist

---

## 🎯 PRÓXIMOS PASSOS

| Passo | O quê | Onde |
|-------|-------|------|
| 1 | Configurar dados fiscais | `/admin/fiscal-settings` |
| 2 | Marcar pedido como pago | Seu PDV |
| 3 | Ver NFC-e emitida | `/admin/nfce-history` |
| 4 | Download XML/DANFE | Histórico |
| 5 | Produção (opcional) | Mudar ambiente em settings |

---

## ❓ DÚVIDAS?

**P: Preciso de certificado A1?**
- Sim, pra usar de verdade. Pela ITI: https://www.iti.gov.br/

**P: Posso testar sem certificado real?**
- Sim! Use ambiente "Homologação" (SEFAZ sandbox)

**P: Funciona em qual estado?**
- Todos os 27! SP, RJ, MG, BA, etc.

**P: Dados ficam seguros?**
- Sim! Certificado é criptografado AES-256-GCM

**P: Quando emite?**
- Quando você marca pedido como PAGO (automático)

---

## 🎉 PRONTO!

Seu sistema agora emite **NFC-e (Nota Fiscal de Consumidor Eletrônica)** conforme regulamentação SEFAZ.

**Última build**: ✅ Compilado com sucesso  
**Status**: 🟢 Pronto para uso  
**Servidor**: 🟢 Rodando em http://localhost:8088
