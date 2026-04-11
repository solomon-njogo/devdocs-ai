-- Persist GitHub OAuth tokens on the user profile so Vercel deployments do not lose them.

ALTER TABLE public.users_profile
  ADD COLUMN IF NOT EXISTS github_token TEXT;

COMMENT ON COLUMN public.users_profile.github_token IS 'GitHub access token for the connected user (server-side only)';