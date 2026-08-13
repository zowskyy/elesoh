import type { Business, Website } from '@lso/domain';
import type { BusinessDto, WebsiteDto } from '@lso/schemas';

export function toBusinessDto(business: Business): BusinessDto {
  return {
    id: business.id,
    organizationId: business.organizationId,
    name: business.name,
    category: business.category,
    phone: business.phone,
    websiteUrl: business.websiteUrl,
    createdAt: business.createdAt.toISOString(),
    updatedAt: business.updatedAt.toISOString(),
  };
}

export function toWebsiteDto(website: Website): WebsiteDto {
  return {
    id: website.id,
    businessId: website.businessId,
    url: website.url,
    createdAt: website.createdAt.toISOString(),
    updatedAt: website.updatedAt.toISOString(),
  };
}
