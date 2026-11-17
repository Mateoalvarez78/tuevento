// @vitest-environment jsdom
//
// Primer test de render de componente del frontend. `jsdom` y
// @testing-library/react ya eran devDependencies del proyecto pero estaban sin
// usar (vitest.config.js corre con environment: 'node'). Se habilita jsdom con
// el docblock de arriba, POR ARCHIVO, en lugar de cambiar la config compartida:
// así el resto de la suite sigue corriendo en Node, sin costo ni riesgo.
//
// Lo central que se prueba acá: el formulario muestra éxito ÚNICAMENTE después
// de que el backend confirmó la persistencia. Un formulario que dice "enviado"
// sin haber guardado nada es precisamente lo que no puede volver a pasar.
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Se mockea la capa de servicio, no `fetch`: es el límite real del componente.
const submitMock = vi.fn();
vi.mock('@/services/contactService', () => ({
  contactService: { submit: (...args) => submitMock(...args) },
  CONTACT_LIMITS: {
    nameMax: 120, emailMax: 255, subjectMax: 150, messageMin: 10, messageMax: 4000,
  },
}));

const ContactForm = (await import('@/components/contact/ContactForm')).default;

const VALID_MESSAGE = 'Quisiera cotizar un catering para 80 personas en Montevideo.';

function fields() {
  return {
    name: screen.getByLabelText(/^nombre/i),
    email: screen.getByLabelText(/correo electrónico/i),
    subject: screen.getByLabelText(/^asunto/i),
    message: screen.getByLabelText(/^mensaje/i),
    submit: screen.getByRole('button', { name: /enviar mensaje/i }),
  };
}

async function fillValid(user) {
  const f = fields();
  await user.type(f.name, 'Ana Pérez');
  await user.type(f.email, 'ana@example.com');
  await user.type(f.message, VALID_MESSAGE);
  return f;
}

beforeEach(() => {
  submitMock.mockReset();
  submitMock.mockResolvedValue({ id: 'msg-1', createdAt: '2026-09-26T12:00:00.000Z' });
});

afterEach(() => cleanup());

describe('render y accesibilidad', () => {
  test('renderiza los tres campos obligatorios y el asunto opcional', () => {
    render(<ContactForm />);
    const f = fields();
    expect(f.name).toBeDefined();
    expect(f.email).toBeDefined();
    expect(f.message).toBeDefined();
    expect(f.subject).toBeDefined();
  });

  test('NO pide teléfono', () => {
    render(<ContactForm />);
    expect(screen.queryByLabelText(/teléfono/i)).toBeNull();
  });

  test('cada campo tiene su label asociado por id (no solo placeholder)', () => {
    render(<ContactForm />);
    const f = fields();
    for (const el of [f.name, f.email, f.subject, f.message]) {
      expect(el.id).toBeTruthy();
      const label = document.querySelector(`label[for="${el.id}"]`);
      expect(label).not.toBeNull();
    }
  });

  test('el campo de correo es type=email y el mensaje es un textarea', () => {
    render(<ContactForm />);
    const f = fields();
    expect(f.email.getAttribute('type')).toBe('email');
    expect(f.message.tagName).toBe('TEXTAREA');
  });

  test('existe una región aria-live para anunciar el resultado', () => {
    render(<ContactForm />);
    expect(document.querySelector('[aria-live="polite"]')).not.toBeNull();
  });

  test('el honeypot está fuera del orden de tabulación y oculto para lectores', () => {
    render(<ContactForm />);
    const honeypot = document.querySelector('input[name="website"]');
    expect(honeypot).not.toBeNull();
    expect(honeypot.getAttribute('tabindex')).toBe('-1');
    const wrapper = honeypot.closest('[aria-hidden="true"]');
    expect(wrapper).not.toBeNull();
    // No se oculta con `display:none` a propósito (algunos bots ignoran esos
    // campos y no caerían en la trampa): se saca de pantalla con posición.
    // Se comparan TOKENS de clase, no una subcadena — `overflow-hidden`
    // contiene "hidden" y haría pasar por alto una clase `hidden` real.
    const tokens = wrapper.className.split(/\s+/);
    expect(tokens).not.toContain('hidden');
    expect(tokens).toContain('absolute');
  });

  test('enlaza a la Política de privacidad', () => {
    render(<ContactForm />);
    const link = screen.getByRole('link', { name: /política de privacidad/i });
    expect(link.getAttribute('href')).toBe('/privacidad');
  });

  test('el contador de caracteres del mensaje se actualiza al escribir', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    await user.type(fields().message, 'hola');
    expect(screen.getByText('4 / 4000')).toBeDefined();
  });
});

describe('validación en el cliente', () => {
  test('con todo vacío no llama al backend y marca los tres campos', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    await user.click(fields().submit);

    expect(submitMock).not.toHaveBeenCalled();
    expect(screen.getByText(/escribí tu nombre/i)).toBeDefined();
    expect(screen.getByText(/escribí tu correo/i)).toBeDefined();
    expect(screen.getByText(/contanos en qué te podemos ayudar/i)).toBeDefined();
  });

  test('un correo con forma inválida no llega al backend', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    const f = fields();
    await user.type(f.name, 'Ana');
    await user.type(f.email, 'no-es-un-correo');
    await user.type(f.message, VALID_MESSAGE);
    await user.click(f.submit);

    expect(submitMock).not.toHaveBeenCalled();
    expect(screen.getByText(/revisá el correo/i)).toBeDefined();
  });

  test('un mensaje demasiado corto no llega al backend', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    const f = fields();
    await user.type(f.name, 'Ana');
    await user.type(f.email, 'ana@example.com');
    await user.type(f.message, 'hola');
    await user.click(f.submit);

    expect(submitMock).not.toHaveBeenCalled();
    expect(screen.getByText(/al menos 10 caracteres/i)).toBeDefined();
  });

  test('el error de un campo se limpia al corregirlo', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    await user.click(fields().submit);
    expect(screen.getByText(/escribí tu nombre/i)).toBeDefined();

    await user.type(fields().name, 'Ana');
    expect(screen.queryByText(/escribí tu nombre/i)).toBeNull();
  });

  test('un campo inválido queda marcado con aria-invalid', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    await user.click(fields().submit);
    expect(fields().email.getAttribute('aria-invalid')).toBe('true');
  });
});

describe('envío — el éxito depende del backend', () => {
  test('envía los datos recortados y con el honeypot vacío', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    const f = fields();
    await user.type(f.name, '  Ana Pérez  ');
    await user.type(f.email, '  ana@example.com ');
    await user.type(f.message, `  ${VALID_MESSAGE}  `);
    await user.click(f.submit);

    await waitFor(() => expect(submitMock).toHaveBeenCalledTimes(1));
    expect(submitMock).toHaveBeenCalledWith({
      name: 'Ana Pérez',
      email: 'ana@example.com',
      subject: '',
      message: VALID_MESSAGE,
      honeypot: '',
    });
  });

  test('muestra el éxito SOLO después de que la promesa resuelve', async () => {
    const user = userEvent.setup();
    // Promesa controlada: permite comprobar que NO hay éxito mientras está
    // pendiente — el punto central de este archivo.
    let resolveSubmit;
    submitMock.mockReturnValue(new Promise((r) => { resolveSubmit = r; }));

    render(<ContactForm />);
    await fillValid(user);
    await user.click(fields().submit);

    // En vuelo: sin mensaje de éxito todavía.
    await waitFor(() => expect(screen.getByRole('button', { name: /enviando/i })).toBeDefined());
    expect(screen.queryByText(/recibimos tu mensaje/i)).toBeNull();

    resolveSubmit({ id: 'msg-1', createdAt: '2026-09-26T12:00:00.000Z' });
    await waitFor(() => expect(screen.getByText(/recibimos tu mensaje/i)).toBeDefined());
  });

  test('deshabilita el botón mientras envía (evita doble envío)', async () => {
    const user = userEvent.setup();
    submitMock.mockReturnValue(new Promise(() => {})); // nunca resuelve
    render(<ContactForm />);
    await fillValid(user);
    await user.click(fields().submit);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /enviando/i }).disabled).toBe(true);
    });
    // Un segundo click no dispara otro envío.
    await user.click(screen.getByRole('button', { name: /enviando/i }));
    expect(submitMock).toHaveBeenCalledTimes(1);
  });

  test('tras el éxito el formulario se limpia y se puede enviar otro', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    await fillValid(user);
    await user.click(fields().submit);

    await waitFor(() => expect(screen.getByText(/recibimos tu mensaje/i)).toBeDefined());
    await user.click(screen.getByRole('button', { name: /enviar otro mensaje/i }));

    expect(fields().name.value).toBe('');
    expect(fields().message.value).toBe('');
  });
});

describe('errores del backend', () => {
  test('si el backend falla NO muestra éxito, y muestra el error', async () => {
    const user = userEvent.setup();
    submitMock.mockRejectedValue(
      Object.assign(new Error('Error del servidor'), { status: 500 })
    );

    render(<ContactForm />);
    await fillValid(user);
    await user.click(fields().submit);

    await waitFor(() => expect(screen.getByRole('alert')).toBeDefined());
    expect(screen.queryByText(/recibimos tu mensaje/i)).toBeNull();
    expect(screen.getByRole('alert').textContent).toMatch(/error del servidor/i);
  });

  test('un 429 muestra el mensaje del limiter tal cual', async () => {
    const user = userEvent.setup();
    const msg = 'Recibimos varios mensajes desde esta conexión. Esperá un rato antes de enviar otro, o escribinos por correo.';
    submitMock.mockRejectedValue(Object.assign(new Error(msg), { status: 429 }));

    render(<ContactForm />);
    await fillValid(user);
    await user.click(fields().submit);

    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Esperá un rato'));
  });

  test('un 400 con errores por campo los marca en el campo correspondiente', async () => {
    const user = userEvent.setup();
    submitMock.mockRejectedValue(
      Object.assign(new Error('Validation failed'), {
        status: 400,
        fieldErrors: [{ field: 'email', message: 'Ingresá un correo válido' }],
      })
    );

    render(<ContactForm />);
    await fillValid(user);
    await user.click(fields().submit);

    await waitFor(() => expect(screen.getByText('Ingresá un correo válido')).toBeDefined());
    expect(screen.queryByText(/recibimos tu mensaje/i)).toBeNull();
  });

  test('después de un error se puede reintentar y llegar al éxito', async () => {
    const user = userEvent.setup();
    submitMock.mockRejectedValueOnce(
      Object.assign(new Error('Error del servidor'), { status: 500 })
    );

    render(<ContactForm />);
    await fillValid(user);
    await user.click(fields().submit);
    await waitFor(() => expect(screen.getByRole('alert')).toBeDefined());

    await user.click(screen.getByRole('button', { name: /enviar mensaje/i }));
    await waitFor(() => expect(screen.getByText(/recibimos tu mensaje/i)).toBeDefined());
    expect(submitMock).toHaveBeenCalledTimes(2);
  });
});
