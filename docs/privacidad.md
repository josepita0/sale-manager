# Aviso de Privacidad y Protección de Datos — La Barra

> **Documento para publicar.** Antes de publicarlo, completá los campos entre
> `[CORCHETES]` con los datos del local (responsable, contacto y región del
> proyecto). Este aviso es para el personal de la barra y para las personas
> cuyos datos se registran en la app (por ejemplo, clientes VIP).
> **Copia embebida:** la app muestra este mismo texto en la pantalla
> "Privacidad y datos" (login y Mi cuenta) — actualizá ambas copias juntas.

## 1. Responsable del tratamiento

- **Responsable:** [NOMBRE DEL LOCAL] ([RAZÓN SOCIAL / CUIT])
- **Contacto:** [EMAIL DE CONTACTO]
- **Aplicación:** "La Barra", gestor interno de ventas y cortesías del turno de barra.

El responsable decide qué datos se registran y quién accede; los proveedores
técnicos que guardan esos datos se listan en la sección 6.

## 2. Qué datos tratamos

La app es **interna**: solo accede el personal autorizado con cuenta propia. Los
datos que registra son los mínimos para su función:

| Dato | Ejemplo | Origen |
| --- | --- | --- |
| **Cuentas de personal** | email, nombre, rol, contraseña (guardada cifrada por el proveedor de autenticación) | Lo carga el admin al crear la cuenta |
| **Turnos y ventas** | productos vendidos, montos, hora, asociados al usuario que abrió el turno | Registro automático del uso |
| **Cortesías** | producto regalado y, si corresponde, cliente VIP destinatario | Registro del bartender |
| **Clientes VIP** | nombre (y solo los datos que el encargado decida cargar) | Lo carga el encargado |
| **Cuentas abiertas** | nombre libre escrito al abrir la cuenta | Lo escribe el bartender |

**Regla de minimización:** no cargar en la app datos que no hagan falta
(telefonos, DNI, notas personales sobre clientes). Si un dato no es necesario
para operar el turno y los reportes, no debería estar en el sistema.

## 3. Para qué (finalidades)

1. Operar la app: abrir y cerrar turnos, registrar ventas y cortesías, manejar cuentas abiertas.
2. Generar el reporte de cierre de turno (cantidades, recaudación y valor regalado) para el encargado.
3. Administrar cuentas de usuario, productos y clientes VIP.
4. Mantener el historial de turnos como registro interno de control.

No usamos los datos para publicidad, no los vendemos y no los cedemos a
terceros con fines comerciales.

## 4. Quién accede

El acceso está controlado en la base de datos (Row Level Security), no solo en
la pantalla:

- **Bartender:** ve y registra lo de su propio turno; ve los clientes VIP para asignar cortesías.
- **Encargado (manager):** todo lo anterior más productos, historial completo de turnos y clientes VIP.
- **Admin:** además gestiona cuentas de usuario (alta, edición, reseteo de contraseña). No puede cambiar su propio rol.

## 5. Base legal

Los datos del personal se tratan por la **relación laboral/contractual** y para
la organización interna del trabajo; los reportes de desempeño por turno se
usan con fines de gestión, no de vigilancia. Los datos de clientes VIP y de
cuentas se tratan por **interés legítimo** del negocio para prestar el servicio.
*(Referencias: Ley 25.326 de Protección de los Datos Personales (Argentina);
si el local opera en la UE, el marco aplicable es el RGPD.)*

## 6. Proveedores que guardan los datos (encargados de tratamiento)

| Proveedor | Servicio | Dónde |
| --- | --- | --- |
| **Supabase** (Supabase Inc.) | Base de datos, autenticación y funciones del servidor | [REGIÓN DEL PROYECTO, p. ej. `eu-central-1` o `us-east-1`] |
| **[VERCEL / NETLIFY]** | Hosting del frontend | Global (CDN) |
| **GitHub** | Código del proyecto (sin datos de clientes) | Global |

Estos proveedores tratan los datos solo por instrucción del responsable y bajo
sus acuerdos de tratamiento de datos (DPA), aceptables desde sus paneles.
Pueden implicar **transferencias internacionales**; los DPA incluyen las
cláusulas contractuales correspondientes.

## 7. Cookies y almacenamiento local

- La app **no usa cookies propias ni de terceros** y **no hace seguimiento
  publicitario ni analítica**.
- Para mantener tu sesión iniciada, guarda el **token de sesión en el
  almacenamiento local (`localStorage`) del navegador** del dispositivo. Por eso:
  - usá **Cerrar sesión** al terminar en un dispositivo compartido, y
  - no instales ni ejecutes extensiones desconocidas en el navegador de trabajo.
- Si en el futuro se agregara analítica u otro servicio que use cookies, este
  aviso se actualizará y, donde la ley lo exija, se pedirá consentimiento antes.

## 8. Cuánto tiempo se guardan (conservación)

- **Cuenta de personal:** mientras exista la relación laboral. Cuando alguien
  deja el equipo, el admin da de baja su cuenta; el nombre puede conservarse
  [DEFINIR: anonimizado] en los turnos históricos para que los reportes sigan
  teniendo sentido.
- **Turnos, ventas y cortesías:** se conservan como registro interno de control
  [DEFINIR PLAZO, p. ej. 2 años].
- **Backups automáticos del proveedor:** según la política de retención de
  Supabase; se eliminan al vencer su ciclo.

## 9. Tus derechos

Como titular de los datos podés pedir al responsable:

- **Acceso** a qué datos tuyos hay registrados.
- **Rectificación** de datos inexactos (tu nombre, por ejemplo).
- **Cancelación/supresión** cuando ya no sean necesarios.
- **Revocar el consentimiento** y oponerte al tratamiento cuando corresponda.

Pedilos escribiendo a [EMAIL DE CONTACTO]. Si no obtenés respuesta, podés
reclamar ante la autoridad de protección de datos de tu país (en Argentina:
Agencia de Acceso a la Información Pública, AAIP).

## 10. Incidentes de seguridad

Si sos personal de la barra y sospechás un acceso no autorizado, un dispositivo
perdido o una filtración: **avisá de inmediato al responsable** [QUIÉN/CÓMO].
El responsable evaluará la notificación a la autoridad de control y a las
personas afectadas dentro de los plazos legales (en el marco del RGPD: 72
horas).

## 11. Contraseñas y buenas prácticas del personal

- Tu contraseña es personal: no la compartas ni la reutilices de otras cuentas.
- Podés cambiarla cuando quieras desde **Mi cuenta → Cambiar contraseña**
  (te pedirá la contraseña actual para confirmar que sos vos).
- Si el admin te asignó una contraseña inicial, cambiala en tu primer acceso.

## 12. Cambios de este aviso

Cualquier cambio se publica en esta misma página con fecha de actualización:
[FECHA DE ÚLTIMA ACTUALIZACIÓN].
