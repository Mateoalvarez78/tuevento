import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">TE</span>
              </div>
              <span className="font-bold text-xl text-white">
                Tu<span className="text-primary">Evento</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              El marketplace de servicios para eventos más completo de Uruguay.
            </p>
          </div>

          {/* Servicios */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Servicios</h4>
            <ul className="space-y-2 text-sm">
              {[
                "Catering",
                "DJ & Música",
                "Fotografía",
                "Decoración",
                "Animación",
              ].map((s) => (
                <li key={s}>
                  <Link
                    href={`/catalogo?categoria=${s.toLowerCase()}`}
                    className="hover:text-white transition-colors"
                  >
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Empresa</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: "Cómo funciona", href: "/#como-funciona" },
                { label: "Para proveedores", href: "/registro?tipo=proveedor" },
                { label: "Términos y condiciones", href: "#" },
                { label: "Política de privacidad", href: "#" },
              ].map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Contacto</h4>
            <ul className="space-y-2 text-sm">
              <li>hola@tuevento.com.uy</li>
              <li>Montevideo, Uruguay</li>
              <li className="flex gap-3 pt-1">
                {["IG", "FB", "WA"].map((s) => (
                  <a
                    key={s}
                    href="#"
                    className="w-8 h-8 rounded-full bg-gray-700 hover:bg-primary flex items-center justify-center text-xs font-bold text-white transition-colors"
                  >
                    {s}
                  </a>
                ))}
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs">
          <p>
            © {new Date().getFullYear()} TuEvento. Todos los derechos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
