export interface GenerateSchemaParams {
  title: string;
  description: string;
  pubDate: Date;
  updatedDate?: Date;
  heroImage?: { src: string };
  tags?: string[];
  url: string;
  siteUrl?: string;
}

export function generateBlogPostSchema({
  title,
  description,
  pubDate,
  updatedDate,
  heroImage,
  tags,
  url,
  siteUrl,
}: GenerateSchemaParams) {
  const blogPosting: any = {
    "@type": "BlogPosting",
    "@id": `${url}#content`,
    "isPartOf": {
      "@id": url
    },
    "headline": title,
    "description": description,
    "datePublished": pubDate.toISOString(),
    "author": {
      "@type": "Organization",
      "name": "LinkFarm Tech."
    },
    "publisher": {
      "@type": "Organization",
      "name": "LinkFarm Tech.",
      "logo": {
        "@type": "ImageObject",
        "url": new URL('favicon.svg', siteUrl || url).toString()
      }
    }
  };

  if (updatedDate) {
    blogPosting.dateModified = updatedDate.toISOString();
  }

  if (heroImage) {
    blogPosting.image = [new URL(heroImage.src, siteUrl || url).toString()];
  }

  if (tags && tags.length > 0) {
    blogPosting.keywords = tags.join(', ');
  }

  const breadcrumbList = {
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "ホーム",
        "item": siteUrl || new URL('/', url).toString()
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "活動日誌",
        "item": new URL('blog', siteUrl || url).toString()
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": title,
        "item": url
      }
    ]
  };

  return {
    "@context": "https://schema.org",
    "@graph": [blogPosting, breadcrumbList]
  };
}
