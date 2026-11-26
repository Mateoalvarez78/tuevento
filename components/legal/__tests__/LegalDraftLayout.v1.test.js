// @vitest-environment jsdom
// Documentos de clientes como versión 1.0 vigente: sin aviso de «sin valor
// contractual», con fecha de vigencia; las condiciones de proveedores siguen
// con el aviso de versión preliminar.
import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import PendingLegal from '@/components/legal/PendingLegal';
import LegalDraftLayout from '@/components/legal/LegalDraftLayout';
import { LEGAL_DOCS } from '@/lib/legalDocs';

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

afterEach(cleanup);

const SECTIONS = [{ id: 'a', title: 'A' }];

describe('LegalDraftLayout', () => {
  test('documento vigente: badge Vigente, fecha de vigencia y sin aviso preliminar', () => {
    render(<LegalDraftLayout doc={LEGAL_DOCS.terminos} space="cliente" sections={SECTIONS}><h2 id="a">A</h2></LegalDraftLayout>);
    expect(screen.getByText('Vigente')).toBeDefined();
    expect(screen.queryByText(/Versión preliminar en revisión legal/)).toBeNull();
    expect(document.body.textContent).not.toMatch(/no tiene valor contractual/);
    expect(document.body.textContent).toMatch(/Vigencia:\s*26 de noviembre de 2026/);
  });

  test('condiciones de proveedores: siguen con el aviso preliminar', () => {
    render(<LegalDraftLayout doc={LEGAL_DOCS.proveedores} space="proveedor" sections={SECTIONS}><h2 id="a">A</h2></LegalDraftLayout>);
    expect(screen.getByText(/Versión preliminar en revisión legal/)).toBeDefined();
  });
});

describe('PendingLegal en un documento vigente', () => {
  test('publica la cláusula sin el rótulo «En revisión legal»', () => {
    render(<PendingLegal inForce note="interna"><p>Cláusula firme</p></PendingLegal>);
    expect(screen.getByText('Cláusula firme')).toBeDefined();
    expect(screen.queryByText('En revisión legal')).toBeNull();
  });

  test('en un documento preliminar conserva el rótulo', () => {
    render(<PendingLegal note="interna"><p>Cláusula propuesta</p></PendingLegal>);
    expect(screen.getByText('En revisión legal')).toBeDefined();
  });
});
