
WITH c AS (SELECT 1)
SELECT 1;

UPDATE public.products p SET description = 'Купить ' || regexp_replace(name,'[^[:alnum:][:space:],.()«»/–~+%-]','','g') || ' — охлаждённая рыба в рыбном магазине Rybman. Цена ' || trim(to_char(price,'FM999999')) || ' ₽, свежая поставка под предзаказ, доставка по Истре и Истринскому району или самовывоз в четверг, пятницу и субботу.'
WHERE category = 'fish_chilled' AND name NOT ILIKE 'Доставка%';

UPDATE public.products p SET description = regexp_replace(name,'[^[:alnum:][:space:],.()«»/–~+%-]','','g') || ' слабосолёная — купить в Rybman за ' || trim(to_char(price,'FM999999')) || ' ₽. Солим сами небольшими партиями и режем нужным куском. Слабосолёная рыба с доставкой по Истре и Истринскому району.'
WHERE category = 'fish_salted';

UPDATE public.products p SET description = regexp_replace(name,'[^[:alnum:][:space:],.()«»/–~+%-]','','g') || ' — копчёная рыба собственного копчения от Rybman, цена ' || trim(to_char(price,'FM999999')) || ' ₽. Готовим под заказ, без консервантов. Заказать копчёную рыбу с доставкой по Истре и Истринскому району.'
WHERE category = 'fish_smoked';

UPDATE public.products p SET description = regexp_replace(name,'[^[:alnum:][:space:],.()«»/–~+%-]','','g') || ' — красная икра от Rybman, цена ' || trim(to_char(price,'FM999999')) || ' ₽. Малосольная икра свежего урожая в охлаждённом виде. Купить икру с доставкой по Истре и Истринскому району.'
WHERE category = 'caviar';

UPDATE public.products p SET description = regexp_replace(name,'[^[:alnum:][:space:],.()«»/–~+%-]','','g') || ' — свежемороженые морепродукты Rybman, цена ' || trim(to_char(price,'FM999999')) || ' ₽. Креветки, мидии, гребешок и краб с доставкой по Истре и Истринскому району.'
WHERE category = 'seafood';

UPDATE public.products p SET description = regexp_replace(name,'[^[:alnum:][:space:],.()«»/–~+%-]','','g') || ' — рыба в маринаде от Rybman, цена ' || trim(to_char(price,'FM999999')) || ' ₽. Готовая к запеканию рыба в фирменном маринаде: осталось отправить в духовку. Доставка по Истре и Истринскому району.'
WHERE category = 'marinades';

UPDATE public.products p SET description = regexp_replace(name,'[^[:alnum:][:space:],.()«»/–~+%-]','','g') || ' — домашние полуфабрикаты Rybman, цена ' || trim(to_char(price,'FM999999')) || ' ₽. Готовим вручную из свежего сырья и замораживаем. Доставка по Истре и Истринскому району.'
WHERE category = 'semifinished';

UPDATE public.products p SET description = regexp_replace(name,'[^[:alnum:][:space:],.()«»/–~+%-]','','g') || ' — рыбные консервы Rybman, цена ' || trim(to_char(price,'FM999999')) || ' ₽. Натуральный состав, дальневосточное сырьё. Купить с доставкой по Истре и Истринскому району.'
WHERE category = 'canned';

UPDATE public.site_content SET content = content || jsonb_build_object(
  'hero_title_line1','Rybman —',
  'hero_title_line2','свежая рыба к вашему столу',
  'catalog_title','Каталог недели',
  'catalog_subtitle','Свежая рыба, морепродукты, икра, копчёности и полуфабрикаты — цены и наличие на текущую неделю',
  'footer_text','© Rybman · Рыба, морепродукты и деликатесы · Предзаказ с доставкой в чт/пт/сб по Истре и Истринскому району'
) WHERE id = 'main';
