import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calcularPedido }                        from '@/lib/delivery/calcular';
import { haversine }                             from '@/lib/osrm/client';
import { PedidoMinimoError, FueraDeRadioError }  from '@/types/delivery';
import type {
  CalcPedidoInput,
  CalcPedidoResult,
  DeliveryConfigDB,
  OSRMRoute,
} from '@/types/delivery';
import type { CalcDeps }                         from '@/lib/delivery/calcular';

// ─── Coordenadas de referencia reales ────────────────────────────────────
// Pueblo piloto: Alcossebre (Castellón, España)

/** Pizzería Mario — centro de Alcossebre */
const PRESTADOR_POS = { lat: 40.2461, lon: 0.2723 };

/** Urbanización Las Fuentes — a ~2 km del centro */
const CLIENTE_LAS_FUENTES = { lat: 40.2637, lon: 0.2789 };

/** Dirección muy próxima al negocio — a ~120 m */
const CLIENTE_CERCANO = { lat: 40.2470, lon: 0.2730 };

// ─── Config de delivery base ──────────────────────────────────────────────
const CONFIG_BASE: DeliveryConfigDB = {
  prestador_id:                '00000000-0000-0000-0000-000000000001',
  tarifa_base:                 2.00,
  precio_km:                   0.50,
  radio_cobertura_km:          5.00,
  pedido_minimo:               10.00,
  tiempo_preparacion_base_min: 10,
  velocidad_media_kmh:         30,
  acepta_efectivo:             true,
  acepta_transferencia:        true,
  acepta_bizum:                false,
  bizum_numero:                null,
  acepta_tarjeta:              false,
  iban_negocio:                null,
  texto_transferencia:         null,
  pedidos_simultaneos_max:     5,
  notas_clientes:              null,
  created_at:                  '2026-01-01T00:00:00Z',
  updated_at:                  '2026-01-01T00:00:00Z',
};

// ─── Items del carrito ────────────────────────────────────────────────────
const ITEMS_BASE = [
  { plato_id: 'plato-margarita', cantidad: 2 },  // 9.50 × 2 = 19.00
  { plato_id: 'plato-refresco',  cantidad: 1 },  //  2.50 × 1 =  2.50
];
// subtotal = 21.50

const PLATOS_BASE = [
  { id: 'plato-margarita', precio: 9.50, tiempo_preparacion_min: 15 },
  { id: 'plato-refresco',  precio: 2.50, tiempo_preparacion_min:  5 },
];
// max(15, 5) + 10 base = 25 min de preparación

// ─── Input base ───────────────────────────────────────────────────────────
const INPUT_BASE: CalcPedidoInput = {
  prestador: { ...PRESTADOR_POS, id: CONFIG_BASE.prestador_id },
  cliente:   CLIENTE_LAS_FUENTES,
  items:     ITEMS_BASE,
};

// ─── Precios de plataforma (modo 'plataforma', definidos por el admin) ─────
const PLATAFORMA_PRICING = {
  tarifa_base:            2.00,
  precio_km:              0.30,
  porcentaje_restaurante: 0,
  pedido_minimo:          12.00,
  radio_cobertura_km:     8.00,
};

// ─── Helper: construir deps mockeados ─────────────────────────────────────
function makeDeps(overrides: {
  osrmResult?:       OSRMRoute | null | 'throw';
  config?:           DeliveryConfigDB;
  platos?:           { id: string; precio: number; tiempo_preparacion_min: number | null }[];
  zonaFija?:         number | null;
  plataformaPricing?: typeof PLATAFORMA_PRICING;
} = {}): CalcDeps {
  const fetchOSRM = vi.fn().mockImplementation(() => {
    if (overrides.osrmResult === 'throw') return Promise.reject(new Error('OSRM down'));
    return Promise.resolve(
      overrides.osrmResult !== undefined
        ? overrides.osrmResult
        : { distance_km: 2.100, duration_min: 4.2 },
    );
  });

  return {
    fetchOSRM,
    getDeliveryConfig: vi.fn().mockResolvedValue(overrides.config ?? CONFIG_BASE),
    getPlatos:         vi.fn().mockResolvedValue(overrides.platos  ?? PLATOS_BASE),
    getZonaContiene:   vi.fn().mockResolvedValue(
      overrides.zonaFija != null ? { tarifa_fija: overrides.zonaFija } : null,
    ),
    getPlataformaPricing: vi.fn().mockResolvedValue(overrides.plataformaPricing ?? PLATAFORMA_PRICING),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('calcularPedido — escenarios nominales', () => {
  // ── Caso 1: ruta OSRM exitosa ──────────────────────────────────────────
  it('calcula correctamente con ruta OSRM: Alcossebre centro → Las Fuentes', async () => {
    // OSRM reporta 2.1 km / 4.2 min por carretera
    const deps = makeDeps({ osrmResult: { distance_km: 2.1, duration_min: 4.2 } });
    const res  = await calcularPedido(INPUT_BASE, deps);

    // Subtotal: (9.50 × 2) + (2.50 × 1) = 21.50
    expect(res.subtotal).toBe(21.50);

    // Distancia: la de OSRM, redondeada a 3 decimales
    expect(res.distancia_km).toBeCloseTo(2.1, 2);

    // Trayecto: ceil(4.2) = 5 min
    expect(res.trayecto_min).toBe(5);

    // Preparación: max(15, 5) + 10 base = 25 min
    expect(res.preparacion_min).toBe(25);

    // ETA: 25 + 5 = 30 min
    expect(res.eta_minutos).toBe(30);

    // coste_envio = 2.00 + 2.1 × 0.50 = 3.05
    expect(res.coste_envio).toBeCloseTo(3.05, 2);

    // total = 21.50 + 3.05 = 24.55
    expect(res.total).toBeCloseTo(24.55, 2);

    // Flags
    expect(res.osrm_usado).toBe(true);
    expect(res.zona_aplicada).toBe(false);
  });

  // ── Caso 2: OSRM retorna null → haversine fallback ────────────────────
  it('usa haversine cuando OSRM retorna null', async () => {
    const deps = makeDeps({ osrmResult: null });
    const res  = await calcularPedido(INPUT_BASE, deps);

    // haversine(PRESTADOR_POS, CLIENTE_LAS_FUENTES) ≈ 2.03 km
    const distHav = haversine(PRESTADOR_POS, CLIENTE_LAS_FUENTES);
    expect(res.distancia_km).toBeCloseTo(distHav, 2);

    // trayecto = ceil((dist / 30) × 60)
    const trayectoEsperado = Math.ceil((distHav / CONFIG_BASE.velocidad_media_kmh) * 60);
    expect(res.trayecto_min).toBe(trayectoEsperado);

    expect(res.osrm_usado).toBe(false);
  });

  // ── Caso 3: OSRM lanza excepción → haversine fallback ─────────────────
  it('usa haversine cuando OSRM lanza excepción (red caída)', async () => {
    const deps = makeDeps({ osrmResult: 'throw' });
    const res  = await calcularPedido(INPUT_BASE, deps);

    expect(res.osrm_usado).toBe(false);
    // Distancia válida aunque no provenga de OSRM
    expect(res.distancia_km).toBeGreaterThan(1.5);
    expect(res.distancia_km).toBeLessThan(3.0);
  });

  // ── Caso 4: zona con tarifa_fija sobreescribe cálculo km ──────────────
  it('aplica tarifa_fija de zona especial ignorando el cálculo base+km', async () => {
    const deps = makeDeps({ zonaFija: 4.00 });
    const res  = await calcularPedido(INPUT_BASE, deps);

    expect(res.coste_envio).toBe(4.00);
    expect(res.zona_aplicada).toBe(true);

    // El total refleja la tarifa fija
    expect(res.total).toBeCloseTo(21.50 + 4.00, 2);
  });

  // ── Caso 5: cliente muy cercano ───────────────────────────────────────
  it('calcula coste mínimo para cliente a ~120 m del negocio', async () => {
    const inputCercano: CalcPedidoInput = {
      ...INPUT_BASE,
      cliente: CLIENTE_CERCANO,
    };
    // OSRM reporta 0.12 km / 0.5 min
    const deps = makeDeps({ osrmResult: { distance_km: 0.12, duration_min: 0.5 } });
    const res  = await calcularPedido(inputCercano, deps);

    // coste_envio = 2.00 + 0.12 × 0.50 = 2.06
    expect(res.coste_envio).toBeCloseTo(2.06, 2);

    // trayecto = ceil(0.5) = 1 min
    expect(res.trayecto_min).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════

describe('calcularPedido — modo plataforma (precios del admin)', () => {
  // ── Caso A: en modo plataforma el envío usa los precios globales del admin ──
  it('usa tarifa_base y precio_km de plataforma_config, ignorando el delivery_config del restaurante', async () => {
    // El restaurante tiene precio_km 0.50; la plataforma 0.30.
    const deps = makeDeps({ osrmResult: { distance_km: 2.1, duration_min: 4.2 } });
    const res  = await calcularPedido({ ...INPUT_BASE, modo: 'plataforma' }, deps);

    // coste_envio = 2.00 (plataforma) + 2.1 × 0.30 (plataforma) = 2.63
    expect(res.coste_envio).toBeCloseTo(2.63, 2);
    expect(res.total).toBeCloseTo(21.50 + 2.63, 2);
  });

  // ── Caso B: el pedido_minimo en modo plataforma también es el del admin ──
  it('aplica el pedido_minimo de la plataforma, no el del restaurante', async () => {
    // Restaurante min 10 (subtotal 21.50 lo pasaría), pero plataforma exige 25.
    const deps = makeDeps({ plataformaPricing: { ...PLATAFORMA_PRICING, pedido_minimo: 25.00 } });

    await expect(calcularPedido({ ...INPUT_BASE, modo: 'plataforma' }, deps))
      .rejects.toMatchObject({ name: 'PedidoMinimoError', minimo: 25.00, subtotal: 21.50 });
  });

  // ── Caso C: el radio de cobertura en modo plataforma es el del admin ──
  it('aplica el radio de cobertura de la plataforma', async () => {
    // Restaurante radio 5 (2.1 km entraría), pero plataforma lo limita a 1 km.
    const deps = makeDeps({ plataformaPricing: { ...PLATAFORMA_PRICING, radio_cobertura_km: 1.0 } });

    await expect(calcularPedido({ ...INPUT_BASE, modo: 'plataforma' }, deps))
      .rejects.toMatchObject({ name: 'FueraDeRadioError', radio: 1.0 });
  });

  // ── Caso D: modo propio NO toca los precios de plataforma ──
  it('en modo propio usa el delivery_config del restaurante (no llama a plataforma)', async () => {
    const deps = makeDeps({ osrmResult: { distance_km: 2.1, duration_min: 4.2 } });
    const res  = await calcularPedido({ ...INPUT_BASE, modo: 'propio' }, deps);

    // coste_envio = 2.00 + 2.1 × 0.50 (restaurante) = 3.05
    expect(res.coste_envio).toBeCloseTo(3.05, 2);
    expect(deps.getPlataformaPricing).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════

describe('calcularPedido — errores de dominio', () => {
  // ── Caso 6: subtotal < pedido_minimo ──────────────────────────────────
  it('lanza PedidoMinimoError cuando el subtotal no alcanza el mínimo', async () => {
    const configEstricta = { ...CONFIG_BASE, pedido_minimo: 50.00 };
    const deps           = makeDeps({ config: configEstricta });

    await expect(calcularPedido(INPUT_BASE, deps)).rejects.toThrow(PedidoMinimoError);
    await expect(calcularPedido(INPUT_BASE, deps)).rejects.toMatchObject({
      name:     'PedidoMinimoError',
      minimo:   50.00,
      subtotal: 21.50,
    });
  });

  // ── Caso 7: dirección fuera del radio ─────────────────────────────────
  it('lanza FueraDeRadioError cuando la distancia supera el radio de cobertura', async () => {
    const configRadioCorto = { ...CONFIG_BASE, radio_cobertura_km: 1.0 };
    // OSRM reporta 2.1 km → supera el radio de 1 km
    const deps             = makeDeps({ config: configRadioCorto });

    await expect(calcularPedido(INPUT_BASE, deps)).rejects.toThrow(FueraDeRadioError);
    await expect(calcularPedido(INPUT_BASE, deps)).rejects.toMatchObject({
      name:    'FueraDeRadioError',
      radio:   1.0,
    });
  });

  // ── Caso 8: radio superado con haversine también ──────────────────────
  it('lanza FueraDeRadioError aunque OSRM esté caído (haversine supera el radio)', async () => {
    const configRadioCorto = { ...CONFIG_BASE, radio_cobertura_km: 0.5 };
    const deps             = makeDeps({ config: configRadioCorto, osrmResult: null });

    await expect(calcularPedido(INPUT_BASE, deps)).rejects.toThrow(FueraDeRadioError);
  });
});

// ═══════════════════════════════════════════════════════════════════════════

describe('calcularPedido — casos de preparación', () => {
  // ── Caso 9: todos los platos sin tiempo_preparacion_min ───────────────
  it('usa 15 min de fallback por plato cuando tiempo_preparacion_min es null', async () => {
    const platosNullTime = [
      { id: 'plato-margarita', precio: 9.50, tiempo_preparacion_min: null },
      { id: 'plato-refresco',  precio: 2.50, tiempo_preparacion_min: null },
    ];
    const deps = makeDeps({ platos: platosNullTime });
    const res  = await calcularPedido(INPUT_BASE, deps);

    // max(15, 15) + 10 base = 25
    expect(res.preparacion_min).toBe(25);
  });

  // ── Caso 10: plato con tiempo largo domina el max ─────────────────────
  it('usa el tiempo de preparación más largo del pedido como base', async () => {
    const platosConTiempoLargo = [
      { id: 'plato-margarita', precio: 9.50, tiempo_preparacion_min: 45 },  // pizza al horno largo
      { id: 'plato-refresco',  precio: 2.50, tiempo_preparacion_min:  0 },
    ];
    const deps = makeDeps({ platos: platosConTiempoLargo });
    const res  = await calcularPedido(INPUT_BASE, deps);

    // max(45, 0) + 10 base = 55
    expect(res.preparacion_min).toBe(55);
  });
});

// ═══════════════════════════════════════════════════════════════════════════

describe('haversine — precisión geográfica', () => {
  it('calcula ~2 km entre centro de Alcossebre y Urb. Las Fuentes', () => {
    const dist = haversine(PRESTADOR_POS, CLIENTE_LAS_FUENTES);
    // Distancia real ~2.0-2.2 km en línea recta
    expect(dist).toBeGreaterThan(1.8);
    expect(dist).toBeLessThan(2.5);
  });

  it('calcula ~0 km entre puntos idénticos', () => {
    const dist = haversine(PRESTADOR_POS, PRESTADOR_POS);
    expect(dist).toBeCloseTo(0, 4);
  });

  it('es simétrica: A→B = B→A', () => {
    const ab = haversine(PRESTADOR_POS, CLIENTE_LAS_FUENTES);
    const ba = haversine(CLIENTE_LAS_FUENTES, PRESTADOR_POS);
    expect(ab).toBeCloseTo(ba, 6);
  });
});
