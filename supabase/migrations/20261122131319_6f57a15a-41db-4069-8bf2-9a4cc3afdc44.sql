DO $$
DECLARE matched integer; removed integer;
BEGIN
  PERFORM 1 FROM public.fuel_logs WHERE id IN (
    '3c3e6b0f-f702-4cfd-a677-cc802b00a96d','f7c80034-0579-4a13-bea5-7c88902a8ebb',
    'ab40a9ad-d7f9-4d76-853e-8d9056df7144','0f905364-7506-4849-bbbe-167c5f6c3f27',
    '6f988965-756e-45a0-a401-6c47bff45bb2','494bb89e-a61e-4c96-b273-748e81ba244c',
    'a1b5766e-a481-4972-9f0c-6ccf32fe7e63','8dbc17c6-4fd1-4201-a067-ae6d8ff64c7d',
    'd633913c-7cc6-4a1c-8ab2-fe6cb2dec343','1c44f0d0-8dde-41a3-8dd7-e058b8b23a43',
    '0131e9b8-8575-4681-bcc6-b1b52ccaa8fb','53de07b2-07e0-414e-bd0a-0ca97b0a9637',
    '2346256d-6cf7-4b20-8ea9-02c665440683','e36241a4-d9ce-4bfe-8f33-f0d11c9f4953'
  ) FOR UPDATE;
  SELECT count(*) INTO matched
  FROM public.fuel_logs f JOIN public.vehicles v ON v.id=f.vehicle_id
  JOIN (VALUES
    ('3c3e6b0f-f702-4cfd-a677-cc802b00a96d'::uuid,'INT-MUSI1UA2RJDJJ',45.2,67.8),
    ('f7c80034-0579-4a13-bea5-7c88902a8ebb'::uuid,'INT-MUSI1UA2RJDJJ',52.7,79.05),
    ('ab40a9ad-d7f9-4d76-853e-8d9056df7144'::uuid,'INT-MUSIBEFK6TX1M',45.2,67.8),
    ('0f905364-7506-4849-bbbe-167c5f6c3f27'::uuid,'INT-MUSIBEFK6TX1M',52.7,79.05),
    ('6f988965-756e-45a0-a401-6c47bff45bb2'::uuid,'INT-MUSIH8V380SRO',45.2,67.8),
    ('494bb89e-a61e-4c96-b273-748e81ba244c'::uuid,'INT-MUSIH8V380SRO',52.7,79.05),
    ('a1b5766e-a481-4972-9f0c-6ccf32fe7e63'::uuid,'INT-MUSIPVEAHZW3K',45.2,67.8),
    ('8dbc17c6-4fd1-4201-a067-ae6d8ff64c7d'::uuid,'INT-MUSIPVEAHZW3K',52.7,79.05),
    ('d633913c-7cc6-4a1c-8ab2-fe6cb2dec343'::uuid,'INT-MUSK2TUNQWOG4',45.2,67.8),
    ('1c44f0d0-8dde-41a3-8dd7-e058b8b23a43'::uuid,'INT-MUSK2TUNQWOG4',52.7,79.05),
    ('0131e9b8-8575-4681-bcc6-b1b52ccaa8fb'::uuid,'INT-MUSKI8L9UXW7M',45.2,67.8),
    ('53de07b2-07e0-414e-bd0a-0ca97b0a9637'::uuid,'INT-MUSKI8L9UXW7M',52.7,79.05),
    ('2346256d-6cf7-4b20-8ea9-02c665440683'::uuid,'INT-MUSKVIA7Z59KZ',45.2,67.8),
    ('e36241a4-d9ce-4bfe-8f33-f0d11c9f4953'::uuid,'INT-MUSKVIA7Z59KZ',52.7,79.05)
  ) AS expected(id,plate,liters,cost) ON expected.id=f.id
  WHERE v.plate_number=expected.plate AND f.liters_added=expected.liters AND f.total_cost=expected.cost
    AND f.odometer_reading=0 AND f.cost_per_liter=1.5 AND f.fuel_type='diesel'
    AND f.company_id IS NULL AND f.driver_id IS NULL AND f.station_name IS NULL
    AND f.notes IS NULL AND f.receipt_image_path IS NULL
    AND f.created_at >= '2026-10-03 00:00:00+00'::timestamptz
    AND f.created_at < '2026-10-04 00:00:00+00'::timestamptz
    AND f.updated_at=f.created_at;
  IF matched<>14 THEN RAISE EXCEPTION 'Cleanup aborted: expected 14 unchanged simulated entries, found %',matched; END IF;
  DELETE FROM public.fuel_logs WHERE id IN (
    '3c3e6b0f-f702-4cfd-a677-cc802b00a96d','f7c80034-0579-4a13-bea5-7c88902a8ebb',
    'ab40a9ad-d7f9-4d76-853e-8d9056df7144','0f905364-7506-4849-bbbe-167c5f6c3f27',
    '6f988965-756e-45a0-a401-6c47bff45bb2','494bb89e-a61e-4c96-b273-748e81ba244c',
    'a1b5766e-a481-4972-9f0c-6ccf32fe7e63','8dbc17c6-4fd1-4201-a067-ae6d8ff64c7d',
    'd633913c-7cc6-4a1c-8ab2-fe6cb2dec343','1c44f0d0-8dde-41a3-8dd7-e058b8b23a43',
    '0131e9b8-8575-4681-bcc6-b1b52ccaa8fb','53de07b2-07e0-414e-bd0a-0ca97b0a9637',
    '2346256d-6cf7-4b20-8ea9-02c665440683','e36241a4-d9ce-4bfe-8f33-f0d11c9f4953'
  );
  GET DIAGNOSTICS removed=ROW_COUNT;
  IF removed<>14 THEN RAISE EXCEPTION 'Cleanup aborted: deletion count % differs from 14',removed; END IF;
END $$;