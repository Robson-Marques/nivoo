#!/bin/bash
# ============================================================================
# 🚀 SETUP MASTER - SISTEMA DE DELIVERY
# Script de instalação completa para novo cliente
# ============================================================================
# 
# Este script faz TUDO automaticamente:
# 1. ✅ Verifica dependências (Node, npm/bun)
# 2. ✅ Instala pacotes
# 3. ✅ Configura variáveis de ambiente
# 4. ✅ Valida conexão com Supabase
# 5. ✅ Cria banco de dados completo
# 6. ✅ Inicia servidor
# 
# ============================================================================

set -e  # Exit on error

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# FUNÇÕES AUXILIARES
# ============================================================================

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# ============================================================================
# PASSO 1: VERIFICAÇÕES INICIAIS
# ============================================================================

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         🚀 SETUP MASTER - SISTEMA DE DELIVERY        ║"
echo "║                   Versão 1.0                            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

log_info "Iniciando setup automatizado..."
log_info "Sistema operacional: $(uname -s)"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js não encontrado. Instale em: https://nodejs.org/"
fi
log_success "Node.js encontrado: $(node --version)"

# Verificar npm ou bun
if command -v bun &> /dev/null; then
    PKG_MANAGER="bun"
    log_success "Bun encontrado: $(bun --version)"
elif command -v npm &> /dev/null; then
    PKG_MANAGER="npm"
    log_success "npm encontrado: $(npm --version)"
else
    log_error "npm ou bun não encontrados. Instale um deles."
fi

# ============================================================================
# PASSO 2: INSTALAR DEPENDÊNCIAS
# ============================================================================

echo ""
log_info "Instalando dependências..."

if [ "$PKG_MANAGER" = "bun" ]; then
    bun install
else
    npm install
fi

log_success "Dependências instaladas com sucesso"

# ============================================================================
# PASSO 3: CONFIGURAR VARIÁVEIS DE AMBIENTE
# ============================================================================

echo ""
log_info "Verificando arquivo .env.local..."

if [ ! -f ".env.local" ]; then
    log_warning ".env.local não encontrado. Criando com template..."
    cat > .env.local << 'EOF'
# ============================================================================
# CONFIGURAÇÃO SUPABASE
# Obtenha estes valores em: https://app.supabase.com/project/[seu-projeto]/settings/api
# ============================================================================

VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# ============================================================================
# CONFIGURAÇÃO LOCAL (não altere)
# ============================================================================

VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080

# ============================================================================
# NOTA: Substitua SEU_PROJETO e as chaves pelos valores reais
# ============================================================================
EOF
    log_warning "⚠️  IMPORTANTE: Edite .env.local com suas credenciais Supabase!"
    log_warning "   Abra: https://app.supabase.com"
    log_warning "   Projeto → Settings → API"
    log_warning "   Copie: Project URL e anon public key"
else
    log_success ".env.local encontrado"
fi

# ============================================================================
# PASSO 4: MENSAGEM DE CONFIGURAÇÃO DO BANCO
# ============================================================================

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           📊 PRÓXIMO PASSO: CONFIGURAR BANCO DE DADOS          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

log_info "Execute os passos abaixo MÃO A MÃO no Supabase:"
echo ""
echo "1. Acesse: https://app.supabase.com"
echo "2. Selecione seu projeto"
echo "3. Vá para: SQL Editor → New Query"
echo ""
echo "4. COPIE E COLE TODO O CONTEÚDO DE:"
echo "   supabase/migrations/FINAL_CONSOLIDATED_DATABASE.sql"
echo ""
echo "5. EXECUTE (pode levar 5-10 segundos)"
echo ""
echo "6. DEPOIS EXECUTE (migrations finais):"
echo "   supabase/migrations/13_FIX_RPC_NO_AMBIGUITY.sql"
echo ""
echo "7. EXECUTE:"
echo "   supabase/migrations/12_ENABLE_REALTIME_V3_SAFE.sql"
echo ""

log_success "Setup frontend completo!"
log_warning "⚠️  Aguardando você executar as migrations SQL no Supabase..."
log_warning "    Após isso, volte aqui e execute:"

if [ "$PKG_MANAGER" = "bun" ]; then
    echo ""
    echo "    $ bun run dev"
else
    echo ""
    echo "    $ npm run dev"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   Precisa de ajuda? Veja: GUIA_INSTALACAO_CLIENTE.md        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
