import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * SEO Component for Wolf Tactical
 * Provides meta tags, Open Graph, and Twitter Cards
 */
const SEO = ({
    title = 'Wolf Tactical Chile - Artículos y Equipamiento Táctico',
    description = 'Tienda líder en artículos tácticos en Chile. Equipamiento táctico profesional, accesorios, gear y productos de alta calidad para profesionales y entusiastas.',
    keywords = 'artículos tácticos chile, equipamiento táctico, tienda táctica chile, productos tácticos, gear táctico, accesorios tácticos, wolf tactical',
    image = '/logo.png',
    url = window.location.href,
    type = 'website',
    structuredData = null
}) => {
    const siteUrl = 'https://wolfftactical.cl';
    const fullUrl = url.startsWith('http') ? url : `${siteUrl}${url}`;
    const fullImage = image.startsWith('http') ? image : `${siteUrl}${image}`;

    return (
        <Helmet>
            {/* Primary Meta Tags */}
            <title>{title}</title>
            <meta name="title" content={title} />
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />

            {/* Canonical URL */}
            <link rel="canonical" href={fullUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={fullImage} />
            <meta property="og:site_name" content="Wolf Tactical Chile" />
            <meta property="og:locale" content="es_CL" />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={fullUrl} />
            <meta property="twitter:title" content={title} />
            <meta property="twitter:description" content={description} />
            <meta property="twitter:image" content={fullImage} />

            {/* Structured Data */}
            {structuredData && (
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            )}
        </Helmet>
    );
};

export default SEO;
