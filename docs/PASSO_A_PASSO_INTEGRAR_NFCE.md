# 📋 GUIA PASSO A PASSO - INTEGRAR NFC-e NO FRONTEND

## ❌ PROBLEMA
As páginas NFC-e foram criadas mas **não estão integradas** nas rotas e no menu do painel admin.

## ✅ SOLUÇÃO - 4 PASSOS SIMPLES

---

## **PASSO 1: Adicionar a Importação das Páginas**

**Arquivo**: `src/App.tsx`

Adicione estas 2 linhas de importação após as outras importações de páginas:

```typescript
// Linha 25 (após: import Promotions from "./pages/Promotions";)
import FiscalSettings from "./pages/admin/FiscalSettings";
import NFCeHistory from "./pages/admin/NFCeHistory";
```

**Localização exata**:
```tsx
import Promotions from "./pages/Promotions";
// ➕ ADICIONE AQUI:
import FiscalSettings from "./pages/admin/FiscalSettings";
import NFCeHistory from "./pages/admin/NFCeHistory";
```

---

## **PASSO 2: Adicionar as Rotas**

**Arquivo**: `src/App.tsx`

Dentro do bloco `<Route element={<AdminPrivateRoute />}>`, adicione estas 2 rotas:

```tsx
<Route path="/admin/fiscal-settings" element={<FiscalSettings />} />
<Route path="/admin/nfce-history" element={<NFCeHistory />} />
```

**Localização exata** (procure por `<Route path="/customization"`):
```tsx
                  <Route path="/customization" element={<Customization />} />
                  {/* ➕ ADICIONE AQUI: */}
                  <Route path="/admin/fiscal-settings" element={<FiscalSettings />} />
                  <Route path="/admin/nfce-history" element={<NFCeHistory />} />
                </Route>
              </Route>
```

---

## **PASSO 3: Adicionar Item no Menu da Sidebar**

**Arquivo**: `src/components/layout/Sidebar.tsx`

Encontre este comentário:
```typescript
// Procure por:
const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
```

No início do arquivo, adicione esta importação do ícone:
```typescript
// Na linha 22 (com os outros imports de lucide-react):
  FileText,      // ➕ ADICIONE ESTA LINHA
```

Localização exata:
```typescript
import {
  ChevronRight,
  LayoutDashboard,
  ShoppingBag,
  Bike,
  Store,
  BarChart,
  Settings,
  Palette,
  MessageSquare,
  BrainCircuit,
  Menu,
  X,
  LogOut,
  Package2,
  Users,
  Tag,
  Trophy,
  FileText,      // ➕ ADICIONE AQUI
} from "lucide-react";
```

Agora, dentro do array `navItems`, adicione este item **após a linha "Customização"**:

```typescript
  {
    title: "Fiscal (NFC-e)",
    href: "/admin/fiscal-settings",
    icon: FileText,
  },
  {
    title: "Histórico NFC-e",
    href: "/admin/nfce-history",
    icon: FileText,
  },
```

**Localização exata**:
```typescript
  {
    title: "Customização",
    href: "/customization",
    icon: Palette,
  },
  // ➕ ADICIONE AQUI:
  {
    title: "Fiscal (NFC-e)",
    href: "/admin/fiscal-settings",
    icon: FileText,
  },
  {
    title: "Histórico NFC-e",
    href: "/admin/nfce-history",
    icon: FileText,
  },
  //  {
  //    title: 'Evolution API',
```

---

## **PASSO 4: Adicionar Variável de Ambiente**

**Arquivo**: `.env.local` (na raiz do projeto)

Adicione esta linha:
```
VITE_ENCRYPTION_KEY=sua_senha_super_secreta_para_criptografia_2024
```

---

## ✅ PRONTO! AGORA TESTAR

### 1. **Parar o servidor** (Ctrl+C)

### 2. **Reiniciar**
```bash
npm run dev
```

### 3. **Ver o resultado**
```
http://localhost:8087
```

**No menu você verá**:
```
Dashboard
Produtos
Pedidos
Movimentação
PDV
Cupons
Promoções
Relatórios
Usuários
Configurações
Customização
👉 Fiscal (NFC-e)        ✨ NOVO
👉 Histórico NFC-e      ✨ NOVO
```

---

## 🎯 FLUXO DE USO

```
1. Clique em "Fiscal (NFC-e)"
   ↓
2. Preencha dados da sua empresa
   ↓
3. Upload certificado A1 (.pfx)
   ↓
4. Salve configuração
   ↓
5. Vá em "Histórico NFC-e"
   ↓
6. Marque pedidos como "PAGO"
   ↓
7. NFC-e aparecerá automaticamente!
```

---

## 📝 RESUMO DAS MUDANÇAS

| Arquivo | Mudança |
|---------|---------|
| `src/App.tsx` | + 2 imports + 2 rotas |
| `src/components/layout/Sidebar.tsx` | + 1 import de ícone + 2 itens de menu |
| `.env.local` | + 1 variável de criptografia |

**Total de linhas**: ~10 linhas novas

---

## 🔍 SE ALGO DER ERRADO

**Erro: "Cannot find module 'FiscalSettings'"**
- ✅ Certifique-se que o import está correto: `import FiscalSettings from "./pages/admin/FiscalSettings";`

**Erro: "FiscalSettings is not exported"**
- ✅ A última linha de `src/pages/admin/FiscalSettings.tsx` deve ser: `export default FiscalSettingsPage;`

**NFC-e não aparece no menu**
- ✅ Atualize a página (F5)
- ✅ Reinicie o servidor `npm run dev`

**Erro: "ENCRYPTION_KEY não configurada"**
- ✅ Adicione ao `.env.local`: `VITE_ENCRYPTION_KEY=sua_senha`
- ✅ Reinicie: `npm run dev`

---

## 📚 PRÓXIMOS PASSOS

Após integrar, acesse:

1. **`/admin/fiscal-settings`** - Configurar dados fiscais
2. **`/admin/nfce-history`** - Ver NFC-e emitidas

Ambas as páginas com **toda a funcionalidade completa**:
- ✅ Formulário com validação
- ✅ Upload de certificado
- ✅ Dashboard de histórico
- ✅ Filtros e busca
- ✅ Download XML/DANFE

---

## 🚀 BUILD FINAL

Após integração, teste o build:
```bash
npm run build
```

Deve compilar **sem erros**:
```
✓ 3879 modules transformed
✓ built in ~25s
✓ 0 errors
```

---

## ✨ RESULTADO VISUAL

Seu painel admin terá:

```
┌─ MENU ─────────────────────┐
│ Dashboard                  │
│ Produtos                   │
│ Pedidos                    │
│ Movimentação               │
│ PDV                        │
│ Cupons                     │
│ Promoções                  │
│ Relatórios                 │
│ Usuários                   │
│ Configurações              │
│ Customização               │
│ 🆕 Fiscal (NFC-e)          │  ← NOVO!
│ 🆕 Histórico NFC-e         │  ← NOVO!
└────────────────────────────┘
```

---

**Status**: ✅ Pronto para implementar  
**Tempo estimado**: 5 minutos  
**Dificuldade**: ⭐☆☆☆☆ Muito fácil
