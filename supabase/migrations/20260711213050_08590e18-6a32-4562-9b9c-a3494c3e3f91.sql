
CREATE POLICY "Staff can upload site images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'site-images' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff can update site images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'site-images' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete site images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'site-images' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff can list site images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'site-images' AND public.is_staff(auth.uid()));
