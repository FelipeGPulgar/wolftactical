/**
 * Structured Data (Schema.org) utilities for Wolf Tactical
 * Generates JSON-LD for better SEO
 */

export const generateOrganizationSchema = () => {
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Wolf Tactical Chile",
        "url": "https://wolfftactical.cl", // TODO: Replace with production URL
        "logo": "https://wolfftactical.cl/logo.png",
        "description": "Tienda líder en artículos y equipamiento táctico en Chile",
        "address": {
            "@type": "PostalAddress",
            "addressCountry": "CL",
            "addressLocality": "Chile"
        },
        "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer service",
            "availableLanguage": "Spanish"
        },
        "sameAs": [
            // Add social media links here
        ]
    };
};

export const generateProductSchema = (product) => {
    if (!product) return null;

    const schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "description": product.includes_note || `${product.name} - Producto táctico de alta calidad`,
        "sku": product.model || product.id.toString(),
        "brand": {
            "@type": "Brand",
            "name": "Wolf Tactical"
        },
        "offers": {
            "@type": "Offer",
            "url": `https://wolfftactical.cl/producto/${product.id}`,
            "priceCurrency": "CLP",
            "price": product.price,
            "availability": product.stock_status === 'disponible'
                ? "https://schema.org/InStock"
                : "https://schema.org/PreOrder",
            "seller": {
                "@type": "Organization",
                "name": "Wolf Tactical Chile"
            }
        }
    };

    // Add image if available
    if (product.main_image || product.cover_image) {
        schema.image = `http://localhost/wolfftactical/backend/${product.main_image || product.cover_image}`;
    }

    return schema;
};

export const generateBreadcrumbSchema = (items) => {
    if (!items || items.length === 0) return null;

    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": items.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "item": item.url
        }))
    };
};

export const generateWebSiteSchema = () => {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Wolf Tactical Chile",
        "url": "https://wolfftactical.cl",
        "potentialAction": {
            "@type": "SearchAction",
            "target": "https://wolfftactical.cl/productos?search={search_term_string}",
            "query-input": "required name=search_term_string"
        }
    };
};

export const generateLocalBusinessSchema = () => {
    return {
        "@context": "https://schema.org",
        "@type": "Store",
        "name": "Wolf Tactical Chile",
        "image": "https://wolfftactical.cl/logo.png",
        "description": "Tienda especializada en artículos y equipamiento táctico profesional",
        "address": {
            "@type": "PostalAddress",
            "addressCountry": "CL"
        },
        "priceRange": "$$",
        "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday"
            ],
            "opens": "09:00",
            "closes": "18:00"
        }
    };
};
