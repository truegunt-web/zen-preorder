
-- Grants for Data API access
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

GRANT SELECT ON public.preorder_windows TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.preorder_windows TO authenticated;
GRANT ALL ON public.preorder_windows TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT INSERT ON public.orders TO anon;
GRANT ALL ON public.orders TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT INSERT ON public.order_items TO anon;
GRANT ALL ON public.order_items TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- Switch all products to "штуки" (pieces) as the unit of measure
UPDATE public.products SET unit = 'pcs', min_order = 1, step = 1;

-- Assign catalog images per category (files in /public/catalog/)
UPDATE public.products SET image_url = '/catalog/fish_chilled.jpg' WHERE category = 'fish_chilled';
UPDATE public.products SET image_url = '/catalog/fish_salted.jpg' WHERE category = 'fish_salted';
UPDATE public.products SET image_url = '/catalog/fish_smoked.jpg' WHERE category = 'fish_smoked';
UPDATE public.products SET image_url = '/catalog/caviar.jpg' WHERE category = 'caviar';
UPDATE public.products SET image_url = '/catalog/seafood.jpg' WHERE category = 'seafood';
UPDATE public.products SET image_url = '/catalog/marinades.jpg' WHERE category = 'marinades';
UPDATE public.products SET image_url = '/catalog/semifinished.jpg' WHERE category = 'semifinished';
UPDATE public.products SET image_url = '/catalog/canned.jpg' WHERE category = 'canned';

-- Open the preorder window for the next 7 days
UPDATE public.preorder_windows
   SET opens_at = now() - interval '1 hour',
       closes_at = now() + interval '7 days',
       is_active = true
 WHERE id = (SELECT id FROM public.preorder_windows ORDER BY created_at DESC LIMIT 1);
