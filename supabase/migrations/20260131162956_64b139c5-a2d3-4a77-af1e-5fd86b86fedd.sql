-- Fix remaining permissive RLS policies on streamers and snapshots tables

-- 1. Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow all operations on streamers" ON public.streamers;
DROP POLICY IF EXISTS "Allow all operations on snapshots" ON public.snapshots;

-- 2. Create proper RLS policies for streamers (authenticated via valid session only)
-- Since we use edge functions with service role, we keep restrictive policies
CREATE POLICY "Service role only for streamers" 
ON public.streamers 
FOR ALL 
USING (false);

-- 3. Create proper RLS policies for snapshots
CREATE POLICY "Service role only for snapshots" 
ON public.snapshots 
FOR ALL 
USING (false);

-- 4. Fix function search path for update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;