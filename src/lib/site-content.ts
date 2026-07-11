export type CustomSection = {
  id: string;
  title: string;
  body: string;
  image_url?: string;
};

export type SiteContent = {
  hero_title_line1: string;
  hero_title_line2: string;
  hero_subtitle: string;
  hero_image_url: string;
  catalog_title: string;
  catalog_subtitle: string;
  footer_text: string;
  sections: CustomSection[];
};

export const DEFAULT_SITE_CONTENT: SiteContent = {
  hero_title_line1: "Свежий улов —",
  hero_title_line2: "на вашем столе",
  hero_subtitle:
    "Собираем предзаказ рыбы, морепродуктов и полуфабрикатов раз в неделю.",
  hero_image_url: "",
  catalog_title: "Каталог недели",
  catalog_subtitle: "",
  footer_text: "© Свежий улов",
  sections: [],
};

export function normalizeContent(raw: unknown): SiteContent {
  const r = (raw ?? {}) as Partial<SiteContent>;
  return {
    ...DEFAULT_SITE_CONTENT,
    ...r,
    sections: Array.isArray(r.sections) ? r.sections : [],
  };
}
