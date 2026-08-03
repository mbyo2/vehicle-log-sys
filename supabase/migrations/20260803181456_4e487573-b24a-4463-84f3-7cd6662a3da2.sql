CREATE OR REPLACE FUNCTION public.increment_ad_clicks(ad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_exists boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.advertisements a
    WHERE a.id = ad_id
      AND a.is_active = true
      AND (a.end_date IS NULL OR a.end_date >= now())
  ) INTO v_exists;

  IF NOT v_exists THEN
    RAISE EXCEPTION 'Advertisement not available';
  END IF;

  -- Throttle: max 3 click registrations per user per ad per 60 minutes
  IF NOT public.check_rate_limit(
    v_uid::text || '_ad_click_' || ad_id::text,
    'ad_click',
    3,
    60
  ) THEN
    RAISE EXCEPTION 'Too many click registrations for this advertisement';
  END IF;

  UPDATE public.advertisements
  SET clicks = COALESCE(clicks, 0) + 1
  WHERE id = ad_id;

  INSERT INTO public.ad_analytics (ad_id, date, clicks)
  VALUES (ad_id, CURRENT_DATE, 1)
  ON CONFLICT (ad_id, date)
  DO UPDATE SET clicks = ad_analytics.clicks + 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_ad_clicks(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_ad_clicks(uuid) TO authenticated;