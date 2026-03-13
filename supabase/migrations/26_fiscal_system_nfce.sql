-- =====================================================
-- Migration 26: Fiscal System - NFC-e Integration
-- Propósito: Implementar sistema de emissão de NFC-e
-- Data: 2026-03-11
-- =====================================================

-- =====================================================
-- 1. CRIAR ENUM PARA STATUS NFCe
-- =====================================================

DO $$ BEGIN
    CREATE TYPE nfce_status AS ENUM (
        'rascunho',           -- Nota em rascunho
        'processando',        -- Enviando para SEFAZ
        'autorizada',         -- Autorizada pela SEFAZ
        'cancelada',          -- Cancelada
        'rejeitada',          -- Rejeitada pela SEFAZ
        'contingencia'        -- Em regime de contingência
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE nfce_ambiente AS ENUM ('homologacao', 'producao');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE nfce_crt AS ENUM ('SN', 'AR', 'ME');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. TABELA: FISCAL_SETTINGS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.fiscal_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    
    -- Dados da Empresa
    cnpj VARCHAR(14) NOT NULL,
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    inscricao_estadual VARCHAR(20) NOT NULL,
    crt nfce_crt NOT NULL DEFAULT 'SN', -- Código de Regime Tributário
    
    -- Endereço
    endereco VARCHAR(255) NOT NULL,
    numero VARCHAR(10) NOT NULL,
    complemento VARCHAR(100),
    bairro VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    uf VARCHAR(2) NOT NULL,
    cep VARCHAR(8) NOT NULL,
    
    -- Configuração NFCe
    serie_nfce INTEGER NOT NULL DEFAULT 1,
    proxima_nfce_numero INTEGER NOT NULL DEFAULT 1,
    
    -- Certificado A1 (criptografado)
    certificado_a1_encrypted BYTEA, -- Salvo criptografado
    certificado_senha VARCHAR(255),  -- Criptografado
    
    -- Token CSC
    token_csc VARCHAR(255) NOT NULL, -- Criptografado
    id_token_csc VARCHAR(6) NOT NULL,
    
    -- Ambiente
    ambiente nfce_ambiente NOT NULL DEFAULT 'homologacao',
    is_ativo BOOLEAN NOT NULL DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fiscal_settings_restaurant ON public.fiscal_settings(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_settings_cnpj ON public.fiscal_settings(cnpj);
CREATE INDEX IF NOT EXISTS idx_fiscal_settings_ativo ON public.fiscal_settings(is_ativo);

-- =====================================================
-- 3. TABELA: NFCE_INVOICES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.nfce_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relacionamentos
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    fiscal_settings_id UUID NOT NULL REFERENCES public.fiscal_settings(id) ON DELETE RESTRICT,
    
    -- Identificação
    numero_nfce INTEGER NOT NULL,
    serie INTEGER NOT NULL,
    numero_sequencial INTEGER NOT NULL, -- Chave NFCe
    chave_nfce VARCHAR(44) UNIQUE,
    
    -- Status
    status nfce_status NOT NULL DEFAULT 'rascunho',
    
    -- Protocolo SEFAZ
    protocolo_autorizacao VARCHAR(15),
    data_hora_autorizacao TIMESTAMP WITH TIME ZONE,
    
    -- Preço
    valor_subtotal NUMERIC(10, 2) NOT NULL,
    valor_desconto NUMERIC(10, 2) DEFAULT 0,
    valor_total NUMERIC(10, 2) NOT NULL,
    
    -- Produtos/Itens
    itens_nfce JSONB NOT NULL DEFAULT '[]', -- Array de itens com NCM, CFOP, etc
    
    -- Forma de Pagamento
    forma_pagamento VARCHAR(2) NOT NULL, -- 01=Dinheiro, 04=Cartão Crédito, etc
    
    -- XML e Documentos
    xml_enviado TEXT, -- XML enviado para SEFAZ
    xml_autorizado TEXT, -- XML autorizado sem assinatura
    xml_assinado TEXT, -- XML assinado
    
    -- Arquivo DANFE
    danfe_url VARCHAR(500), -- URL para download DANFE
    
    -- Mensagens SEFAZ
    mensagem_retorno TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    data_emissao TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nfce_invoices_restaurant ON public.nfce_invoices(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_nfce_invoices_order ON public.nfce_invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_nfce_invoices_status ON public.nfce_invoices(status);
CREATE INDEX IF NOT EXISTS idx_nfce_invoices_chave ON public.nfce_invoices(chave_nfce);
CREATE INDEX IF NOT EXISTS idx_nfce_invoices_data ON public.nfce_invoices(data_emissao DESC);

-- =====================================================
-- 4. TABELA: NFCE_LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS public.nfce_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nfce_id UUID NOT NULL REFERENCES public.nfce_invoices(id) ON DELETE CASCADE,
    
    -- Log
    tipo_operacao VARCHAR(50) NOT NULL, -- 'criacao', 'envio', 'autorizacao', 'cancelamento', etc
    descricao TEXT,
    status_anterior nfce_status,
    status_novo nfce_status,
    
    -- Resposta SEFAZ
    resposta_sefaz JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nfce_log_nfce ON public.nfce_log(nfce_id);
CREATE INDEX IF NOT EXISTS idx_nfce_log_tipo ON public.nfce_log(tipo_operacao);

-- =====================================================
-- 5. TABELA: NFCE_CONTINGENCIA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.nfce_contingencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    
    -- Contingência
    motivo VARCHAR(255) NOT NULL,
    data_inicio TIMESTAMP WITH TIME ZONE DEFAULT now(),
    data_fim TIMESTAMP WITH TIME ZONE,
    
    -- Tipo de Contingência
    tipo VARCHAR(50) NOT NULL, -- 'sefaz_offline', 'sistema_offline', 'outro'
    
    -- Status
    ativo BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nfce_contingencia_restaurant ON public.nfce_contingencia(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_nfce_contingencia_ativo ON public.nfce_contingencia(ativo);

-- =====================================================
-- 6. TABELA: NFCE_CANCELAMENTO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.nfce_cancelamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nfce_id UUID NOT NULL REFERENCES public.nfce_invoices(id) ON DELETE CASCADE,
    
    -- Cancelamento
    data_cancelamento TIMESTAMP WITH TIME ZONE DEFAULT now(),
    motivo TEXT NOT NULL,
    justificativa TEXT,
    
    -- Protocolo
    protocolo_cancelamento VARCHAR(15),
    data_hora_cancelamento TIMESTAMP WITH TIME ZONE,
    
    -- XML
    xml_cancelamento TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nfce_cancelamento_nfce ON public.nfce_cancelamento(nfce_id);

-- =====================================================
-- ✅ Migration 26 Complete
-- Sistema fiscal com NFC-e configurado e pronto
-- =====================================================
