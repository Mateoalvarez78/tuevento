// mapPackages (detalle público del servicio, providerService.js) — cubre la
// simplificación real de esta fase: `perPerson` pasa de inferirse por regex
// sobre `price_unit` a leerse directo de `pricing_model` (autoritativo desde
// el backend, ver pricing-schema.js), con el regex como red de seguridad
// solo para una fila sin el campo seteado (no debería ocurrir tras la
// migración 021). No existía cobertura previa de mapPackages en este repo.
import { describe, test, expect } from 'vitest';
import { mapServiceToProvider } from '../providerService';

function serviceWithPackages(packages) {
  return { id: 'svc-1', title: 'Servicio', packages, extras: [] };
}

describe('mapServiceToProvider > mapPackages — pricing_model autoritativo', () => {
  test('pricing_model=per_person: perPerson=true, sin importar price_unit', () => {
    const [pkg] = mapServiceToProvider(serviceWithPackages([
      { id: 'p1', name: 'Menú', adult_price: '300', pricing_model: 'per_person', price_unit: 'algo raro' },
    ])).packages;
    expect(pkg.perPerson).toBe(true);
    expect(pkg.pricingModel).toBe('per_person');
  });

  test('pricing_model=fixed_package: perPerson=false, aunque child_price esté seteado (ya no dispara el regex viejo)', () => {
    const [pkg] = mapServiceToProvider(serviceWithPackages([
      { id: 'p1', name: 'Paquete', adult_price: '10000', child_price: '5000', pricing_model: 'fixed_package' },
    ])).packages;
    expect(pkg.perPerson).toBe(false);
  });

  test('pricing_model=per_unit: isPerUnit=true, expone unitPrice/unitLabel/minUnits/maxUnits', () => {
    const [pkg] = mapServiceToProvider(serviceWithPackages([
      {
        id: 'p1', name: 'Castillo', pricing_model: 'per_unit', unit_price: '8000',
        unit_label_singular: 'castillo', unit_label_plural: 'castillos', min_units: 1, max_units: 3,
      },
    ])).packages;
    expect(pkg.isPerUnit).toBe(true);
    expect(pkg.isCustomQuote).toBe(false);
    expect(pkg.unitPrice).toBe(8000);
    expect(pkg.unitLabelSingular).toBe('castillo');
    expect(pkg.minUnits).toBe(1);
    expect(pkg.maxUnits).toBe(3);
    expect(pkg.perPerson).toBe(false);
  });

  test('per_unit con unit_step/capacity_weight_per_unit: los expone tal cual (opt-in, nunca derivados)', () => {
    const [pkg] = mapServiceToProvider(serviceWithPackages([
      {
        id: 'p1', name: 'Cupcakes', pricing_model: 'per_unit', unit_price: '120',
        unit_label_singular: 'cupcake', unit_label_plural: 'cupcakes',
        min_units: 12, max_units: 240, unit_step: 12, capacity_weight_per_unit: 0,
      },
    ])).packages;
    expect(pkg.unitStep).toBe(12);
    // 0 es un peso REAL (cupcakes no ocupan capacidad del proveedor) —
    // nunca debe colapsar a null por ser falsy.
    expect(pkg.capacityWeightPerUnit).toBe(0);
  });

  test('sin unit_step/capacity_weight_per_unit: null, nunca 1 ni 0 inventados', () => {
    const [pkg] = mapServiceToProvider(serviceWithPackages([
      { id: 'p1', name: 'Castillo', pricing_model: 'per_unit', unit_price: '8000' },
    ])).packages;
    expect(pkg.unitStep).toBeNull();
    expect(pkg.capacityWeightPerUnit).toBeNull();
  });

  test('pricing_model=per_hour: isPerHour=true, expone hourlyPrice y defaultBillableHours', () => {
    const [pkg] = mapServiceToProvider(serviceWithPackages([
      {
        id: 'p1', name: 'DJ', pricing_model: 'per_hour',
        hourly_price: '3000', default_billable_hours: '4',
      },
    ])).packages;
    expect(pkg.isPerHour).toBe(true);
    expect(pkg.hourlyPrice).toBe(3000);
    expect(pkg.defaultBillableHours).toBe(4);
    expect(pkg.perPerson).toBe(false);
    // per_hour no tiene duración incluida: la duración se contrata.
    expect(pkg.isDurationPackage).toBe(false);
  });

  test('pricing_model=custom_quote: isCustomQuote=true', () => {
    const [pkg] = mapServiceToProvider(serviceWithPackages([
      { id: 'p1', name: 'A medida', pricing_model: 'custom_quote' },
    ])).packages;
    expect(pkg.isCustomQuote).toBe(true);
    expect(pkg.isPerUnit).toBe(false);
  });

  test('sin pricing_model (fila legacy hipotética): cae al regex/child_price como antes, nunca revienta', () => {
    const [pkg] = mapServiceToProvider(serviceWithPackages([
      { id: 'p1', name: 'Menú viejo', adult_price: '300', price_unit: 'por persona' },
    ])).packages;
    expect(pkg.pricingModel).toBeNull();
    expect(pkg.perPerson).toBe(true); // vía el regex, no vía pricing_model
  });

  test('sin packages: nunca revienta, devuelve []', () => {
    expect(mapServiceToProvider(serviceWithPackages(undefined)).packages).toEqual([]);
    expect(mapServiceToProvider(serviceWithPackages(null)).packages).toEqual([]);
  });
});

describe('mapServiceToProvider — guestUsageMode/capacityBasis (BookingWizard decide si pide invitados)', () => {
  test('mapea category_guest_usage_mode/category_capacity_basis de la fila real', () => {
    const provider = mapServiceToProvider({
      id: 'svc-1', title: 'Cobertura fotográfica', packages: [], extras: [],
      category_guest_usage_mode: 'unused', category_capacity_basis: 'total_guests',
    });
    expect(provider.guestUsageMode).toBe('unused');
  });

  test('sin la columna en la fila (fallback seguro): price/total_guests, nunca revienta', () => {
    const provider = mapServiceToProvider({ id: 'svc-1', title: 'X', packages: [], extras: [] });
    expect(provider.guestUsageMode).toBe('price');
    expect(provider.capacityBasis).toBe('total_guests');
  });
});
