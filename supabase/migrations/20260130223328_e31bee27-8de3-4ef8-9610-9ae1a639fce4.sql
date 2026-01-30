-- Criar tabela de streamers
CREATE TABLE public.streamers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  streamer_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  luck_gifts BIGINT DEFAULT 0,
  exclusive_gifts BIGINT DEFAULT 0,
  host_crystals BIGINT DEFAULT 0,
  minutes INTEGER DEFAULT 0,
  effective_days INTEGER DEFAULT 0 CHECK (effective_days >= 0 AND effective_days <= 31),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para busca rápida
CREATE INDEX idx_streamers_name ON public.streamers(name);
CREATE INDEX idx_streamers_streamer_id ON public.streamers(streamer_id);
CREATE INDEX idx_streamers_host_crystals ON public.streamers(host_crystals DESC);

-- Criar tabela de snapshots
CREATE TABLE public.snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'yearly')),
  period_label TEXT NOT NULL,
  snapshot_date DATE NOT NULL,
  data JSONB NOT NULL,
  total_crystals BIGINT DEFAULT 0,
  total_host_usd NUMERIC(12, 2) DEFAULT 0,
  total_agency_usd NUMERIC(12, 2) DEFAULT 0,
  streamer_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(period_type, period_label)
);

-- Criar índices para snapshots
CREATE INDEX idx_snapshots_period ON public.snapshots(period_type, snapshot_date DESC);
CREATE INDEX idx_snapshots_date ON public.snapshots(snapshot_date DESC);

-- Criar tabela de configurações globais (para senha)
CREATE TABLE public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir senha global padrão (hash de "0159")
INSERT INTO public.app_settings (key, value) VALUES ('global_password', '0159');

-- Criar tabela de sessões (para controle de login)
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days')
);

-- Criar índice para sessões
CREATE INDEX idx_sessions_token ON public.user_sessions(session_token);
CREATE INDEX idx_sessions_expires ON public.user_sessions(expires_at);

-- Função para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para streamers
CREATE TRIGGER update_streamers_updated_at
  BEFORE UPDATE ON public.streamers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para app_settings
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.streamers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para streamers (acesso público para sistema com senha global)
CREATE POLICY "Allow all operations on streamers" ON public.streamers
  FOR ALL USING (true) WITH CHECK (true);

-- Políticas RLS para snapshots
CREATE POLICY "Allow all operations on snapshots" ON public.snapshots
  FOR ALL USING (true) WITH CHECK (true);

-- Políticas RLS para app_settings (somente leitura da senha)
CREATE POLICY "Allow read app_settings" ON public.app_settings
  FOR SELECT USING (true);

-- Políticas RLS para user_sessions
CREATE POLICY "Allow all operations on user_sessions" ON public.user_sessions
  FOR ALL USING (true) WITH CHECK (true);