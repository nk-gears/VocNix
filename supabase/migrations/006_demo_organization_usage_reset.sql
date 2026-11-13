-- ====================================================================
-- 006_demo_organization_usage_reset.sql
-- Add is_demo column to organizations and events, and automatic 24-hour
-- usage reset support.
-- ====================================================================

-- 1. Add is_demo and last_usage_reset_at to organizations
ALTER TABLE IF EXISTS public.organizations
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_usage_reset_at TIMESTAMPTZ;

-- 2. Add is_demo to events
ALTER TABLE IF EXISTS public.events
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;

-- 3. Create index for fast lookups of demo organizations
CREATE INDEX IF NOT EXISTS idx_organizations_is_demo ON public.organizations (is_demo);
CREATE INDEX IF NOT EXISTS idx_events_is_demo ON public.events (is_demo);

-- 4. Mark 'App Demo Event' and any demo organizations as is_demo = TRUE
UPDATE public.organizations
SET is_demo = TRUE,
    last_usage_reset_at = NOW()
WHERE LOWER(name) LIKE '%demo%'
   OR LOWER(slug) LIKE '%demo%'
   OR id = '9dcb9463-e256-455e-aebc-691f54f388a3';

-- 5. Mark corresponding events as is_demo = TRUE
UPDATE public.events
SET is_demo = TRUE
WHERE organization_id IN (
  SELECT id FROM public.organizations WHERE is_demo = TRUE
) OR LOWER(title) LIKE '%demo%';

-- 6. Helper function to reset demo organization usage older than 24 hours
CREATE OR REPLACE FUNCTION public.reset_demo_usage_24h()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Delete usage records older than 24 hours for demo organizations
  WITH deleted AS (
    DELETE FROM public.usage_records
    WHERE organization_id IN (
      SELECT id FROM public.organizations WHERE is_demo = TRUE
    )
    AND recorded_at < (NOW() - INTERVAL '24 hours')
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  -- Update last_usage_reset_at on demo organizations
  UPDATE public.organizations
  SET last_usage_reset_at = NOW()
  WHERE is_demo = TRUE;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
