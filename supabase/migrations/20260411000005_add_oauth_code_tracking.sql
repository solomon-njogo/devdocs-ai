-- OAuth code tracking: prevent duplicate code exchanges and track request idempotency.
-- Stores used codes with expiry, and tracks callback requests by idempotency key.

CREATE TABLE IF NOT EXISTS public.oauth_code_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  token TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '10 minutes',
  UNIQUE(code_hash)
);

CREATE INDEX IF NOT EXISTS idx_oauth_code_log_user_id ON public.oauth_code_log (user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_code_log_expires_at ON public.oauth_code_log (expires_at);

COMMENT ON TABLE public.oauth_code_log IS 'Prevent duplicate code exchanges by tracking used OAuth codes and their results';
COMMENT ON COLUMN public.oauth_code_log.code_hash IS 'SHA256(code) to avoid storing actual codes';
COMMENT ON COLUMN public.oauth_code_log.token IS 'Successfully exchanged token (stored when code succeeds)';
COMMENT ON COLUMN public.oauth_code_log.error IS 'Error message if code exchange failed';

-- Callback request deduplication: track requests by user + state to prevent duplicate processing
CREATE TABLE IF NOT EXISTS public.oauth_callback_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state_hash TEXT NOT NULL,
  idempotency_key TEXT,
  result_token TEXT,
  result_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '10 minutes',
  UNIQUE(user_id, state_hash)
);

CREATE INDEX IF NOT EXISTS idx_oauth_callback_requests_user_id ON public.oauth_callback_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_callback_requests_idempotency_key ON public.oauth_callback_requests (idempotency_key);
CREATE INDEX IF NOT EXISTS idx_oauth_callback_requests_expires_at ON public.oauth_callback_requests (expires_at);

COMMENT ON TABLE public.oauth_callback_requests IS 'Deduplicate callback requests and ensure idempotent processing';
COMMENT ON COLUMN public.oauth_callback_requests.state_hash IS 'SHA256(state) for deduplication';
COMMENT ON COLUMN public.oauth_callback_requests.idempotency_key IS 'Optional client-provided idempotency key for extra safety';
