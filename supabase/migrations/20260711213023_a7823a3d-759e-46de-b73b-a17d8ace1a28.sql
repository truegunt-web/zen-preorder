
-- Site content singleton table
CREATE TABLE public.site_content (
  id TEXT PRIMARY KEY,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site content"
  ON public.site_content FOR SELECT
  USING (true);

CREATE POLICY "Staff can insert site content"
  ON public.site_content FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update site content"
  ON public.site_content FOR UPDATE
  TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete site content"
  ON public.site_content FOR DELETE
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE TRIGGER site_content_updated_at
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the main content row with current defaults
INSERT INTO public.site_content (id, content) VALUES (
  'main',
  jsonb_build_object(
    'hero_title_line1', 'Свежий улов —',
    'hero_title_line2', 'на вашем столе',
    'hero_subtitle', 'Собираем предзаказ рыбы, морепродуктов и полуфабрикатов раз в неделю. Мы закупаем ровно то, что заказали вы — минимум остатков, максимум свежести.',
    'hero_image_url', '',
    'catalog_title', 'Каталог недели',
    'catalog_subtitle', '',
    'footer_text', '© Свежий улов · Предзаказ с доставкой в чт/пт/сб',
    'sections', '[]'::jsonb
  )
);
