-- 1. Remove overly permissive policies
DROP POLICY IF EXISTS "Allow read app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Allow all operations on user_sessions" ON public.user_sessions;

-- 2. Create secure RLS policies for app_settings
-- No public read - only service role can access (edge functions)
CREATE POLICY "No public access to app_settings" 
ON public.app_settings 
FOR ALL 
USING (false);

-- 3. Create secure RLS policies for user_sessions
-- Users can only validate their own session via edge function
-- Direct table access is blocked for security
CREATE POLICY "No direct public access to user_sessions" 
ON public.user_sessions 
FOR ALL 
USING (false);

-- 4. Add ip_address and user_agent columns for session security
ALTER TABLE public.user_sessions 
ADD COLUMN IF NOT EXISTS ip_address text,
ADD COLUMN IF NOT EXISTS user_agent text,
ADD COLUMN IF NOT EXISTS last_validated_at timestamp with time zone DEFAULT now();