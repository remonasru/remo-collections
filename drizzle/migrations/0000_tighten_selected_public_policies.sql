DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
CREATE POLICY "Public reviews belong to existing products" ON public.reviews
  FOR SELECT
  TO anon, authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.products
    WHERE products.id = reviews.product_id
  ));

DROP POLICY IF EXISTS "Anyone can place an order" ON public.orders;
CREATE POLICY "Public customers can place validated orders" ON public.orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    jsonb_typeof(customer) = 'object'
    AND length(btrim(customer->>'name')) BETWEEN 1 AND 100
    AND length(btrim(customer->>'address')) BETWEEN 1 AND 500
    AND (customer->>'phone') ~ '^[0-9+ -]{10,15}$'
    AND customer->>'payment' IN ('COD', 'UPI')
    AND subtotal >= 0
    AND discount >= 0
    AND total >= 0
    AND CASE
      WHEN jsonb_typeof(items) = 'array' THEN
        jsonb_array_length(items) BETWEEN 1 AND 100
        AND NOT EXISTS (
          SELECT 1
          FROM jsonb_array_elements(items) AS entry(value)
          WHERE jsonb_typeof(entry.value) <> 'object'
            OR length(btrim(entry.value->>'title')) NOT BETWEEN 1 AND 250
            OR length(entry.value->>'size') > 60
            OR (entry.value->>'qty') !~ '^[1-9][0-9]{0,2}$'
            OR (entry.value->>'price') !~ '^[0-9]{1,7}(\.[0-9]{1,2})?$'
        )
      ELSE false
    END
  );

DROP POLICY IF EXISTS "Anyone can read app settings" ON public.app_settings;
CREATE POLICY "Public can read the APK download setting" ON public.app_settings
  FOR SELECT
  TO anon, authenticated
  USING (key = 'apk_url');