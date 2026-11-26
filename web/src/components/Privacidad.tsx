import type { ReactNode } from 'react'

interface Props {
  onBack: () => void
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-[13px] font-extrabold tracking-[0.08em] text-tinta uppercase">{titulo}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-tinta">{children}</div>
    </section>
  )
}

function Dato({ etiqueta, texto }: { etiqueta: string; texto: string }) {
  return (
    <li>
      <span className="font-semibold">{etiqueta}:</span> {texto}
    </li>
  )
}

/**
 * Full-screen privacy notice, embedding the canonical text of
 * docs/privacidad.md (update both together). Placeholders in
 * [CORCHETES] are completed by the bar before publishing.
 */
export function Privacidad({ onBack }: Props) {
  return (
    <div className="anim-panel-in fixed inset-0 z-50 overflow-y-auto bg-papel text-tinta">
      <header className="sticky top-0 z-10 border-b-2 border-dashed border-hair-fuerte bg-papel px-5 py-3.5">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div>
            <p className="text-base font-extrabold tracking-[0.06em] text-tinta uppercase">
              Privacidad y datos
            </p>
            <p className="mt-0.5 text-xs text-tinta-suave">Aviso de La Barra</p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="min-h-10 rounded-lg border-[1.5px] border-tinta px-4 text-xs font-semibold tracking-[0.05em] text-tinta uppercase"
          >
            Volver
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 pb-12">
        <p className="mt-4 text-xs leading-relaxed text-tinta-suave">
          Antes de publicar, completá los campos <span className="font-semibold">[CORCHETES]</span>{' '}
          con los datos del local. Este aviso es para el personal de la barra y para las personas
          cuyos datos se registran en la app (por ejemplo, clientes VIP).
        </p>

        <Seccion titulo="1. Responsable del tratamiento">
          <p>
            <span className="font-semibold">Responsable:</span> [NOMBRE DEL LOCAL] ([RAZÓN SOCIAL /
            CUIT]) · <span className="font-semibold">Contacto:</span> [EMAIL DE CONTACTO] ·{' '}
            <span className="font-semibold">Aplicación:</span> "La Barra", gestor interno de ventas
            y cortesías del turno de barra.
          </p>
          <p>
            El responsable decide qué datos se registran y quién accede; los proveedores técnicos
            que guardan esos datos se listan en la sección 6.
          </p>
        </Seccion>

        <Seccion titulo="2. Qué datos tratamos">
          <p>La app es interna: solo accede el personal autorizado con cuenta propia.</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <Dato
              etiqueta="Cuentas de personal"
              texto="email, nombre, rol y contraseña (guardada cifrada por el proveedor de autenticación); la carga el admin al crear la cuenta."
            />
            <Dato
              etiqueta="Turnos y ventas"
              texto="productos vendidos, montos, hora, asociados al usuario que abrió el turno."
            />
            <Dato
              etiqueta="Cortesías"
              texto="producto regalado y, si corresponde, cliente VIP destinatario."
            />
            <Dato etiqueta="Clientes VIP" texto="nombre (y solo los datos que el encargado cargue)." />
            <Dato
              etiqueta="Cuentas abiertas"
              texto="nombre libre escrito al abrir la cuenta."
            />
          </ul>
          <p>
            <span className="font-semibold">Minimización:</span> no cargar datos que no hagan falta
            (teléfonos, DNI, notas personales sobre clientes). Si un dato no es necesario para
            operar el turno y los reportes, no debería estar en el sistema.
          </p>
        </Seccion>

        <Seccion titulo="3. Para qué (finalidades)">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Operar la app: abrir y cerrar turnos, registrar ventas y cortesías, cuentas abiertas.</li>
            <li>Generar el reporte de cierre de turno (cantidades, recaudación y valor regalado).</li>
            <li>Administrar cuentas de usuario, productos y clientes VIP.</li>
            <li>Mantener el historial de turnos como registro interno de control.</li>
          </ul>
          <p>No usamos los datos para publicidad, no los vendemos ni los cedemos con fines comerciales.</p>
        </Seccion>

        <Seccion titulo="4. Quién accede">
          <p>El acceso está controlado en la base de datos (Row Level Security), no solo en la pantalla:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <span className="font-semibold">Bartender:</span> ve y registra lo de su propio turno; ve los clientes VIP para asignar cortesías.
            </li>
            <li>
              <span className="font-semibold">Encargado (manager):</span> todo lo anterior más productos, historial completo y clientes VIP.
            </li>
            <li>
              <span className="font-semibold">Admin:</span> además gestiona cuentas de usuario; no puede cambiar su propio rol.
            </li>
          </ul>
        </Seccion>

        <Seccion titulo="5. Base legal">
          <p>
            Datos del personal: relación laboral/contractual y organización interna del trabajo; los
            reportes de desempeño por turno se usan con fines de gestión, no de vigilancia. Datos de
            clientes VIP y cuentas: interés legítimo para prestar el servicio. (Referencias: Ley
            25.326 de Protección de los Datos Personales, Argentina; en la UE, el RGPD.)
          </p>
        </Seccion>

        <Seccion titulo="6. Proveedores que guardan los datos">
          <ul className="list-disc space-y-1.5 pl-5">
            <Dato
              etiqueta="Supabase"
              texto="base de datos, autenticación y funciones del servidor — [REGIÓN DEL PROYECTO]."
            />
            <Dato etiqueta="[VERCEL / NETLIFY]" texto="hosting del frontend (CDN global)." />
            <Dato etiqueta="GitHub" texto="código del proyecto, sin datos de clientes." />
          </ul>
          <p>
            Tratan los datos solo por instrucción del responsable y bajo sus acuerdos de tratamiento
            (DPA), aceptables desde sus paneles. Pueden implicar transferencias internacionales; los
            DPA incluyen las cláusulas contractuales correspondientes.
          </p>
        </Seccion>

        <Seccion titulo="7. Cookies y almacenamiento local">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Sin cookies propias ni de terceros; sin seguimiento publicitario ni analítica.</li>
            <li>
              La sesión se guarda en el <span className="font-semibold">almacenamiento local</span>{' '}
              del navegador: usá <span className="font-semibold">Cerrar sesión</span> en dispositivos
              compartidos y no instales extensiones desconocidas en el navegador de trabajo.
            </li>
            <li>
              Si en el futuro se agrega analítica u otro servicio con cookies, este aviso se
              actualizará y, donde la ley lo exija, se pedirá consentimiento antes.
            </li>
          </ul>
        </Seccion>

        <Seccion titulo="8. Cuánto tiempo se guardan">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <span className="font-semibold">Cuenta de personal:</span> mientras exista la relación
              laboral; al dejar el equipo, el admin da de baja la cuenta y el nombre puede
              conservarse [DEFINIR: anonimizado] en los turnos históricos.
            </li>
            <li>
              <span className="font-semibold">Turnos, ventas y cortesías:</span> registro interno de
              control [DEFINIR PLAZO, p. ej. 2 años].
            </li>
            <li>
              <span className="font-semibold">Backups:</span> según la política de retención de
              Supabase; se eliminan al vencer su ciclo.
            </li>
          </ul>
        </Seccion>

        <Seccion titulo="9. Tus derechos">
          <p>
            Podés pedir al responsable: <span className="font-semibold">acceso</span> a tus datos,{' '}
            <span className="font-semibold">rectificación</span> de datos inexactos,{' '}
            <span className="font-semibold">cancelación/supresión</span> cuando ya no sean
            necesarios y <span className="font-semibold">revocar el consentimiento</span> u oponerte
            al tratamiento cuando corresponda. Escribí a [EMAIL DE CONTACTO]. Sin respuesta, podés
            reclamar ante la autoridad de tu país (en Argentina: Agencia de Acceso a la Información
            Pública, AAIP).
          </p>
        </Seccion>

        <Seccion titulo="10. Incidentes de seguridad">
          <p>
            Si sospechás un acceso no autorizado, un dispositivo perdido o una filtración, avisá de
            inmediato al responsable [QUIÉN/CÓMO]. Se evaluará la notificación a la autoridad de
            control y a las personas afectadas dentro de los plazos legales (en el marco del RGPD:
            72 horas).
          </p>
        </Seccion>

        <Seccion titulo="11. Contraseñas y buenas prácticas">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Tu contraseña es personal: no la compartas ni la reutilices de otras cuentas.</li>
            <li>
              Cambiala cuando quieras desde <span className="font-semibold">Mi cuenta → Cambiar contraseña</span>{' '}
              (te pide la contraseña actual para confirmar que sos vos).
            </li>
            <li>Si el admin te asignó una contraseña inicial, cambiala en tu primer acceso.</li>
          </ul>
        </Seccion>

        <Seccion titulo="12. Cambios de este aviso">
          <p>
            Cualquier cambio se publica en esta misma pantalla y en el documento del proyecto, con
            fecha de actualización: [FECHA DE ÚLTIMA ACTUALIZACIÓN].
          </p>
        </Seccion>

        <p className="mt-8 border-t border-dashed border-hair pt-4 text-xs text-tinta-suave">
          Texto canónico del proyecto: <span className="font-mono">docs/privacidad.md</span> —
          actualizá ambas copias juntas.
        </p>
      </div>
    </div>
  )
}
