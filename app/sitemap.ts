import { MetadataRoute } from 'next';
import { locales, defaultLocale } from '@/i18n';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://interaiofficial.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    const path = locale === defaultLocale ? '' : `/${locale}`;
    entries.push({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    });
  }

  return entries;
}
