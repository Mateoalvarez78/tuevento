import Link from 'next/link';
import { notFound } from 'next/navigation';
import LegalDocument, { legalMetadata } from '@/components/legal/LegalDocument';
import { BRAND, CONTACT_EMAIL, LEGAL_PAGES_REACHABLE, legalIdentityRows } from '@/lib/site';

export const metadata = legalMetadata({
  title: 'Política de privacidad',
  description: `Cómo ${BRAND} trata los datos personales de clientes y proveedores: qué se recoge, para qué, con quién se comparte y cómo ejercer tus derechos.`,
  path: '/privacidad',
});

// ─── BASE DE ESTE DOCUMENTO ──────────────────────────────────────────────────
// Cada tratamiento y cada tercero mencionado abajo fue VERIFICADO en el código o
// en la infraestructura. No se nombra ningún proveedor que no esté realmente en
// uso. En particular, se verificó en el HTML publicado que el sitio NO carga
// analítica ni píxeles de seguimiento de ningún tipo (sin Google Analytics,
// Tag Manager, Meta, Hotjar, Clarity, PostHog, Segment ni Vercel Insights):
// todos los scripts son propios. De ahí la sección sobre cookies.
//
// QUÉ FALTA para publicarla como vigente:
//   · Identificación fiscal y domicilio del responsable (pendientes de confirmar).
//   · Plazos concretos de conservación por tipo de dato (decisión pendiente).
//   · Revisión de un abogado uruguayo, incluido el encuadre en la Ley 18.331 y
//     si corresponde inscribir la base ante la URCDP. NO se afirma que la base
//     esté inscripta, porque no hay evidencia de que lo esté.
export default function PrivacidadPage() {
  // FAIL-CLOSED — mismo criterio que /terminos: en producción, con la compuerta
  // cerrada, 404. `noindex` no es control de acceso. Ver app/terminos/page.js.
  if (!LEGAL_PAGES_REACHABLE) notFound();

  const identityRows = legalIdentityRows();

  return (
    <LegalDocument
      title="Política de privacidad"
      updatedNote={`Versión de trabajo · ${BRAND}`}
      intro={`Esta política explica qué datos personales trata ${BRAND}, con qué finalidad, con quién se comparten y cómo podés ejercer tus derechos.`}
    >
      <h2>1. Responsable del tratamiento</h2>
      <ul>
        {identityRows.map((row) => (
          <li key={row.label}>
            <strong>{row.label}:</strong> {row.value}
          </li>
        ))}
        <li>
          <strong>Contacto:</strong>{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </li>
      </ul>

      <h2>2. Qué datos tratamos</h2>

      <h3>Si tenés una cuenta de cliente</h3>
      <ul>
        <li>Nombre, correo electrónico y teléfono.</li>
        <li>Tu contraseña, almacenada siempre <strong>cifrada mediante hash</strong>: no la guardamos en texto legible y no podemos leerla.</li>
        <li>Tus servicios favoritos y los borradores de evento que armes en la plataforma.</li>
      </ul>

      <h3>Si sos proveedor</h3>
      <ul>
        <li>Datos de la cuenta y de contacto de la persona responsable.</li>
        <li>Datos comerciales del negocio: nombre, identificación fiscal, ciudad, zonas de cobertura, medio de cobro y datos necesarios para liquidarte.</li>
        <li>La oferta que publicás: servicios, paquetes, precios, imágenes y disponibilidad.</li>
      </ul>

      <h3>Cuando solicitás o contratás un servicio</h3>
      <ul>
        <li>Datos del evento: fecha, horario, cantidad de personas y requerimientos.</li>
        <li>
          <strong>Dirección del evento.</strong> Para validarla y normalizarla
          usamos el servicio de direcciones de Google (Places). La consulta la
          hace nuestro servidor, no tu navegador.
        </li>
        <li>El mensaje que le escribas al proveedor junto con tu solicitud.</li>
      </ul>

      <h3>Cuando usás el formulario de contacto</h3>
      <ul>
        <li>Nombre, correo, asunto (si lo completás) y el mensaje.</li>
        <li>
          <strong>No guardamos tu dirección IP</strong> al enviar el formulario.
          El control de abuso funciona con un contador temporal en memoria del
          servidor que no se almacena en la base de datos.
        </li>
        <li>No te pedimos teléfono para contactarnos.</li>
      </ul>

      <h2>3. Para qué usamos esos datos</h2>
      <ul>
        <li>Crear y administrar tu cuenta, y autenticarte.</li>
        <li>Poner en contacto a clientes con proveedores y gestionar solicitudes y reservas.</li>
        <li>Permitir al proveedor evaluar si puede prestar el servicio: para eso necesita ver la fecha, el lugar y los detalles de tu evento.</li>
        <li>Procesar el cobro de las reservas.</li>
        <li>Responder tus consultas.</li>
        <li>Prevenir fraude y abuso, y mantener la plataforma segura.</li>
      </ul>
      <p>
        <strong>No usamos tus datos para publicidad</strong> y{' '}
        <strong>no los vendemos ni los cedemos</strong> a terceros con fines
        comerciales.
      </p>

      <h2>4. Con quién se comparten</h2>

      <h3>Con el proveedor que contratás</h3>
      <p>
        Cuando enviás una solicitud, el proveedor recibe los datos necesarios para
        evaluarla y prestarte el servicio: tu nombre, tus datos de contacto, la
        fecha, la dirección del evento y tu mensaje. Sin eso no puede hacer su
        trabajo. Ese proveedor es responsable del uso que haga de esos datos.
      </p>

      <h3>Con proveedores de infraestructura</h3>
      <p>
        Trabajamos con los siguientes servicios, cada uno con una función
        concreta y acotada:
      </p>
      <ul>
        <li><strong>Vercel</strong> — alojamiento del sitio web.</li>
        <li><strong>Render</strong> — alojamiento del servidor de aplicación.</li>
        <li><strong>PostgreSQL gestionado</strong> — base de datos.</li>
        <li><strong>Cloudinary</strong> — almacenamiento de las imágenes que suben los proveedores.</li>
        <li><strong>Google (Places)</strong> — validación y normalización de direcciones de eventos.</li>
        <li><strong>Google Workspace</strong> — correo electrónico del dominio.</li>
        <li><strong>Procesador de pagos</strong> — cobro de las reservas. Los datos de tarjeta se ingresan directamente en el procesador; {BRAND} nunca los recibe ni los almacena.</li>
      </ul>

      <h3>Con autoridades</h3>
      <p>
        Cuando una norma o una orden judicial nos obligue.
      </p>

      <h2>5. Transferencias internacionales</h2>
      <p>
        Los servicios listados arriba operan servidores fuera de Uruguay, por lo
        que tus datos se almacenan y procesan en el exterior. Elegimos
        proveedores que ofrecen garantías adecuadas de seguridad y
        confidencialidad.
      </p>

      <h2>6. Cookies y tecnologías similares</h2>
      <p>
        <strong>{BRAND} no usa cookies publicitarias, ni analítica, ni píxeles de
        seguimiento de terceros.</strong> No hay herramientas de medición de
        audiencia instaladas en el sitio.
      </p>
      <p>
        Sí usamos el almacenamiento local de tu navegador para dos cosas
        estrictamente necesarias para que el sitio funcione:
      </p>
      <ul>
        <li>Mantener tu sesión abierta después de iniciar sesión.</li>
        <li>Guardar el borrador de «Mi evento» mientras lo armás, para que no lo pierdas al recargar.</li>
      </ul>
      <p>
        Esa información queda en tu propio navegador y se borra al cerrar sesión o
        al limpiar los datos del sitio. Como no hacemos seguimiento, no
        mostramos un banner de consentimiento de cookies.
      </p>

      <h2>7. Conservación</h2>
      <p>
        Conservamos los datos mientras tu cuenta esté activa y, después, durante
        el tiempo necesario para cumplir obligaciones legales, contables y
        tributarias, y para atender reclamos relacionados con reservas ya
        realizadas. Los registros de reservas y pagos se conservan por el plazo
        que la normativa exige.
      </p>
      <p>
        Cuando se elimina una cuenta o un servicio, se marca como eliminado y deja
        de estar accesible en la plataforma, sin que eso borre de inmediato los
        registros contables asociados a operaciones ya realizadas.
      </p>

      <h2>8. Seguridad</h2>
      <ul>
        <li>Todo el tráfico del sitio viaja cifrado por HTTPS.</li>
        <li>Las contraseñas se almacenan con hash, nunca en texto legible.</li>
        <li>El acceso a los datos está restringido por rol: un proveedor solo ve lo relativo a sus propios servicios y reservas.</li>
        <li>No almacenamos datos de tarjetas de crédito o débito.</li>
      </ul>
      <p>
        Ningún sistema es infalible: si detectamos un incidente que afecte tus
        datos, actuaremos conforme a la normativa aplicable.
      </p>

      <h2>9. Tus derechos</h2>
      <p>
        De acuerdo con la <strong>Ley N.º 18.331 de Protección de Datos
        Personales</strong> de Uruguay, podés solicitar en cualquier momento:
      </p>
      <ul>
        <li><strong>Acceso</strong> — saber qué datos tuyos tenemos.</li>
        <li><strong>Rectificación</strong> — corregir datos inexactos o incompletos.</li>
        <li><strong>Supresión</strong> — eliminar tus datos, con los límites que impongan las obligaciones legales indicadas en el punto 7.</li>
        <li><strong>Oposición</strong> — oponerte a un tratamiento determinado.</li>
      </ul>
      <p>
        Para ejercerlos escribinos a{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> o usá el{' '}
        <Link href="/contacto">formulario de contacto</Link>. También podés
        presentar un reclamo ante la Unidad Reguladora y de Control de Datos
        Personales (URCDP) de Uruguay.
      </p>

      <h2>10. Menores de edad</h2>
      <p>
        {BRAND} está dirigido a personas mayores de 18 años. No recogemos
        deliberadamente datos de menores de edad.
      </p>

      <h2>11. Cambios y versiones</h2>
      <p>
        Si actualizamos esta política, publicaremos la versión nueva en esta misma
        página con su fecha de vigencia.
      </p>

      <h2>12. Contacto</h2>
      <p>
        Por cualquier cuestión relativa a tus datos personales:{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalDocument>
  );
}
