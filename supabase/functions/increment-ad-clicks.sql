CREATE OR REPLACE FUNCTION increment_ad_clicks(ad_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the advertisement clicks
  UPDATE advertisements
  SET clicks = clicks + 1
  WHERE id = ad_id;

  -- Update or insert analytics record for today
  INSERT INTO ad_analytics (ad_id, date, clicks)
  VALUES (ad_id, CURRENT_DATE, 1)
  ON CONFLICT (ad_id, date)
  DO UPDATE SET clicks = ad_analytics.clicks + 1;
END;
$$;