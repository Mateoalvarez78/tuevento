/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    "eventonow.local",
    "proveedores.eventonow.local",
    "admin.eventonow.local",
  ],
  // Preparado por si se adopta next/image más adelante (hoy se usa <img> plano,
  // así que esto no es estrictamente necesario todavía).
  // Las condiciones para proveedores se mudaron al portal de proveedores
  // (las áreas legales de cliente y proveedor no se cruzan). Redirección
  // temporal (307) para no romper enlaces de la primera publicación.
  async redirects() {
    return [
      { source: '/terminos/proveedores', destination: '/provider/legal/condiciones', permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};
export default nextConfig;
