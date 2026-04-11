export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ms-cinema.vercel.app';
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/nguoi-dung/', '/api/'], // Không cho bot quét trang thông tin cá nhân/User actions
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
