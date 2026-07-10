/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    "eventonow.local",
    "proveedores.eventonow.local",
    "admin.eventonow.local",
  ],
  // Preparado por si se adopta next/image más adelante (hoy se usa <img> plano,
  // así que esto no es estrictamente necesario todavía).
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};
export default nextConfig;
