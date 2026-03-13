@echo off
REM ============================================================================
REM 🚀 SETUP MASTER - SISTEMA DE DELIVERY (Windows)
REM Script de instalação completa para novo cliente
REM ============================================================================

setlocal enabledelayedexpansion

REM Cores (emuladas com echo)
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║         🚀 SETUP MASTER - SISTEMA DE DELIVERY              ║
echo ║                   Versão 1.0                                ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM ============================================================================
REM PASSO 1: VERIFICAÇÕES INICIAIS
REM ============================================================================

echo ℹ️  Iniciando setup automatizado...

REM Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo ❌ Node.js não encontrado!
    echo.
    echo Instale em: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js encontrado: %NODE_VERSION%

REM Verificar npm ou bun
set PKG_MANAGER=npm
bun --version >nul 2>&1
if errorlevel 0 (
    for /f "tokens=*" %%i in ('bun --version') do set BUN_VERSION=%%i
    echo ✅ Bun encontrado: !BUN_VERSION!
    set PKG_MANAGER=bun
) else (
    npm --version >nul 2>&1
    if errorlevel 1 (
        color 0C
        echo ❌ npm não encontrado!
        pause
        exit /b 1
    )
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo ✅ npm encontrado: !NPM_VERSION!
)

REM ============================================================================
REM PASSO 2: INSTALAR DEPENDÊNCIAS
REM ============================================================================

echo.
echo ℹ️  Instalando dependências...
echo.

if "%PKG_MANAGER%"=="bun" (
    bun install
) else (
    npm install
)

if errorlevel 1 (
    color 0C
    echo ❌ Erro ao instalar dependências!
    pause
    exit /b 1
)

echo.
echo ✅ Dependências instaladas com sucesso
echo.

REM ============================================================================
REM PASSO 3: CONFIGURAR VARIÁVEIS DE AMBIENTE
REM ============================================================================

echo ℹ️  Verificando arquivo .env.local...

if not exist ".env.local" (
    echo ⚠️  .env.local não encontrado. Criando com template...
    (
        echo # ============================================================================
        echo # CONFIGURAÇÃO SUPABASE
        echo # Obtenha estes valores em: https://app.supabase.com/project/[seu-projeto]/settings/api
        echo # ============================================================================
        echo.
        echo VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
        echo VITE_SUPABASE_ANON_KEY=your-anon-key-here
        echo.
        echo # ============================================================================
        echo # CONFIGURAÇÃO LOCAL (não altere)
        echo # ============================================================================
        echo.
        echo VITE_API_URL=http://localhost:8080
        echo VITE_WS_URL=ws://localhost:8080
        echo.
        echo # ============================================================================
        echo # NOTA: Substitua SEU_PROJETO e as chaves pelos valores reais
        echo # ============================================================================
    ) > .env.local
    
    color 0E
    echo ⚠️  IMPORTANTE: Edite .env.local com suas credenciais Supabase!
    color 0A
) else (
    echo ✅ .env.local encontrado
)

echo.
echo ============================================================================
echo           📊 PRÓXIMO PASSO: CONFIGURAR BANCO DE DADOS
echo ============================================================================
echo.

echo ℹ️  Execute os passos abaixo no Supabase:
echo.
echo 1. Acesse: https://app.supabase.com
echo 2. Selecione seu projeto
echo 3. Vá para: SQL Editor → New Query
echo.
echo 4. COPIE TODO O CONTEÚDO DE:
echo    supabase/migrations/FINAL_CONSOLIDATED_DATABASE.sql
echo    E COLE no SQL Editor
echo.
echo 5. EXECUTE (pode levar 5-10 segundos)
echo.
echo 6. DEPOIS EXECUTE (migrations finais):
echo    supabase/migrations/13_FIX_RPC_NO_AMBIGUITY.sql
echo.
echo 7. DEPOIS EXECUTE:
echo    supabase/migrations/12_ENABLE_REALTIME_V3_SAFE.sql
echo.

color 0B
echo ✅ Setup frontend completo!

color 0E
echo ⚠️  Após executar as migrations SQL, volte aqui e execute:
if "%PKG_MANAGER%"=="bun" (
    echo.
    echo    bun run dev
) else (
    echo.
    echo    npm run dev
)

echo.
color 0A
echo ============================================================================
echo    Precisa de ajuda? Veja: GUIA_INSTALACAO_CLIENTE.md
echo ============================================================================
echo.

pause
