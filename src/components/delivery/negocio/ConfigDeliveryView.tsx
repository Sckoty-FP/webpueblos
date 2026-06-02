"use client";

import { useState, useTransition } from "react";
import { guardarConfigDelivery, guardarHorariosDelivery, toggleDeliveryActivo } from "@/app/panel/delivery/actions";
import type { DeliveryConfigDB, DeliveryHorarioDB, ModoDelivery } from "@/types/delivery";
import type { MetodosPagoConfig } from "@/types/admin";
import { TruckIcon, MotoIcon, CheckIcon } from "@/components/delivery/DeliveryIcons";

const T = {
  blue: "#0070cc", divider: "#f3f3f3", ink: "#1f1f1f",
  body: "#3a3a3a", muted: "#6b6b6b", mist: "#f5f7fa",
  success: "#059669", warning: "#d97706", error: "#c81b3a",
};

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

interface Props {
  activo:           boolean;
  modo:             ModoDelivery | null;
  config:           DeliveryConfigDB | null;
  horarios:         DeliveryHorarioDB[];
  plataformaMethods: MetodosPagoConfig;
  comisionPropioPct: number;
}

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 17, fontWeight: 600, color: T.ink }}>{title}</div>
      <div style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>{desc}</div>
    </div>
  );
}

function FieldInput({
  label, value, suffix, onChange,
}: { label: string; value: string; suffix: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
        {label}
      </div>
      <div
        className="flex items-baseline gap-1.5 rounded-xl"
        style={{ padding: "10px 14px", background: T.mist, border: `1px solid ${T.divider}` }}
      >
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent outline-none w-full"
          style={{ fontSize: 18, color: T.ink, fontWeight: 600, fontFamily: "Barlow, sans-serif" }}
        />
        <span style={{ fontSize: 12, color: T.muted, flexShrink: 0 }}>{suffix}</span>
      </div>
    </div>
  );
}

export default function ConfigDeliveryView({ activo: activoInicial, modo: modoInicial, config, horarios: horariosIniciales, plataformaMethods, comisionPropioPct }: Props) {
  const [activo, setActivo] = useState(activoInicial);
  // Plataforma es el modo por defecto: el restaurante solo opta por activar el propio.
  const [modo, setModo] = useState<ModoDelivery>(modoInicial ?? "plataforma");
  const esPropio = modo === "propio";
  const [tarifaBase, setTarifaBase] = useState(String(config?.tarifa_base ?? 2));
  const [precioKm, setPrecioKm] = useState(String(config?.precio_km ?? 0.5));
  const [pedidoMinimo, setPedidoMinimo] = useState(String(config?.pedido_minimo ?? 10));
  const [radioCobertura, setRadioCobertura] = useState(String(config?.radio_cobertura_km ?? 5));
  const [bufferMin, setBufferMin] = useState(String(config?.tiempo_preparacion_base_min ?? 10));
  const [velocidad, setVelocidad] = useState(String(config?.velocidad_media_kmh ?? 30));
  const [maxSimultaneos, setMaxSimultaneos] = useState(String(config?.pedidos_simultaneos_max ?? 5));
  const [editandoDia,         setEditandoDia]         = useState<number | null>(null);
  const [editApertura,        setEditApertura]        = useState("09:00");
  const [editCierre,          setEditCierre]          = useState("22:00");
  const [aceptaEfectivo,      setAceptaEfectivo]      = useState(config?.acepta_efectivo ?? true);
  const [aceptaBizum,         setAceptaBizum]         = useState(config?.acepta_bizum ?? false);
  const [bizumNumero,         setBizumNumero]         = useState(config?.bizum_numero ?? "");
  const [aceptaTarjeta,       setAceptaTarjeta]       = useState(config?.acepta_tarjeta ?? false);
  const [horarios, setHorarios] = useState<DeliveryHorarioDB[]>(horariosIniciales);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const ejemploKm = 2.5;
  const ejemploEnvio = parseFloat(tarifaBase) + ejemploKm * parseFloat(precioKm);

  const handleToggleActivo = () => {
    const nuevoActivo = !activo;
    setActivo(nuevoActivo);
    startTransition(async () => {
      await toggleDeliveryActivo(nuevoActivo, modo);
    });
  };

  const handleGuardar = () => {
    startTransition(async () => {
      // Guarda delivery_modo en prestadores además de la config
      await toggleDeliveryActivo(activo, modo);
      await guardarConfigDelivery({
        tarifa_base:                 parseFloat(tarifaBase),
        precio_km:                   parseFloat(precioKm),
        pedido_minimo:               parseFloat(pedidoMinimo),
        radio_cobertura_km:          parseFloat(radioCobertura),
        tiempo_preparacion_base_min: parseInt(bufferMin),
        velocidad_media_kmh:         parseInt(velocidad),
        pedidos_simultaneos_max:     parseInt(maxSimultaneos),
        acepta_efectivo:             aceptaEfectivo,
        acepta_bizum:                aceptaBizum,
        bizum_numero:                bizumNumero || null,
        acepta_tarjeta:              aceptaTarjeta,
      });
      await guardarHorariosDelivery(
        horarios
          .filter((h) => h.hora_apertura && h.hora_cierre)
          .map((h) => ({ dia_semana: h.dia_semana, hora_apertura: h.hora_apertura, hora_cierre: h.hora_cierre })),
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  };

  return (
    <div className="h-full overflow-y-auto" style={{ padding: "28px 36px" }}>
      <div style={{ maxWidth: 880 }}>

        {/* Activación */}
        <div style={{ marginBottom: 30 }}>
          <SectionHeader title="Activación" desc="Activa o desactiva tu servicio de delivery" />
          <div
            className="flex items-center gap-4 rounded-2xl"
            style={{ background: "#fff", border: `1px solid ${T.divider}`, padding: "18px 22px" }}
          >
            <div
              className="flex items-center justify-center rounded-xl flex-shrink-0"
              style={{ width: 46, height: 46, background: `${T.success}15`, color: T.success }}
            >
              <TruckIcon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div style={{ fontSize: 15, fontWeight: 600, color: T.ink }}>Delivery activo</div>
              <div style={{ fontSize: 13, color: T.muted, marginTop: 3 }}>
                Tu negocio aparece en la sección de delivery del pueblo
              </div>
            </div>
            <button
              onClick={handleToggleActivo}
              disabled={isPending}
              className="relative flex-shrink-0"
              style={{
                width: 50, height: 28, borderRadius: 999,
                background: activo ? T.success : T.muted,
                border: "none", cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              <div
                className="absolute"
                style={{
                  top: 3,
                  [activo ? "right" : "left"]: 3,
                  width: 22, height: 22,
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.2s, right 0.2s",
                }}
              />
            </button>
          </div>

          <div style={{ marginTop: 14 }}>
            <div
              className="rounded-2xl"
              style={{ background: "#fff", border: `1px solid ${T.divider}`, padding: "18px 22px" }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="flex items-center justify-center rounded-xl flex-shrink-0"
                  style={{ width: 46, height: 46, background: esPropio ? `${T.blue}12` : T.mist, color: esPropio ? T.blue : T.muted }}
                >
                  <MotoIcon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div style={{ fontSize: 15, fontWeight: 600, color: T.ink }}>Usar mi propio personal de reparto</div>
                  <div style={{ fontSize: 13, color: T.muted, marginTop: 3 }}>
                    Por defecto el reparto lo gestiona PUEBLO. Activá esto solo si repartís con tu propio equipo.
                  </div>
                </div>
                <button
                  onClick={() => setModo(esPropio ? "plataforma" : "propio")}
                  disabled={isPending}
                  className="relative flex-shrink-0"
                  style={{ width: 50, height: 28, borderRadius: 999, background: esPropio ? T.blue : T.muted, border: "none", cursor: "pointer", transition: "background 0.2s" }}
                >
                  <div
                    className="absolute"
                    style={{ top: 3, [esPropio ? "right" : "left"]: 3, width: 22, height: 22, borderRadius: "50%", background: "#fff", transition: "left 0.2s, right 0.2s" }}
                  />
                </button>
              </div>

              {!esPropio ? (
                <div
                  className="flex items-start gap-2.5 rounded-xl mt-4"
                  style={{ padding: "12px 16px", background: `${T.success}0c`, border: `1px solid ${T.success}25` }}
                >
                  <TruckIcon className="w-4 h-4 flex-shrink-0" style={{ color: T.success, marginTop: 2 }} />
                  <div style={{ fontSize: 13, color: T.body, lineHeight: 1.5 }}>
                    <strong style={{ color: T.ink }}>Reparto PUEBLO activado.</strong> Nosotros ponemos los repartidores y las tarifas de envío. No tenés que configurar tarifas ni comisiones.
                  </div>
                </div>
              ) : (
                <div
                  className="flex items-start gap-2.5 rounded-xl mt-4"
                  style={{ padding: "12px 16px", background: `${T.warning}0c`, border: `1px solid ${T.warning}25` }}
                >
                  <CheckIcon className="w-4 h-4 flex-shrink-0" style={{ color: T.warning, marginTop: 2 }} />
                  <div style={{ fontSize: 13, color: T.body, lineHeight: 1.5 }}>
                    Repartís con tu propio equipo. PUEBLO aplica una <strong style={{ color: T.ink }}>comisión del {comisionPropioPct}%</strong> sobre el subtotal de cada pedido (definida por la plataforma).
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tarifas — solo en modo propio (en plataforma las define el admin) */}
        {esPropio && (
        <div style={{ marginBottom: 30 }}>
          <SectionHeader title="Tarifas al cliente" desc="Lo que cobras al cliente por el envío" />
          <div className="rounded-2xl grid grid-cols-4 gap-4" style={{ background: "#fff", border: `1px solid ${T.divider}`, padding: "18px 22px" }}>
            <FieldInput label="Tarifa base" value={tarifaBase} suffix="€" onChange={setTarifaBase} />
            <FieldInput label="Por kilómetro" value={precioKm} suffix="€/km" onChange={setPrecioKm} />
            <FieldInput label="Pedido mínimo" value={pedidoMinimo} suffix="€" onChange={setPedidoMinimo} />
            <FieldInput label="Radio cobertura" value={radioCobertura} suffix="km" onChange={setRadioCobertura} />
          </div>
          <div
            className="mt-3 rounded-xl"
            style={{ padding: "14px 18px", background: `${T.blue}06`, border: `1px solid ${T.blue}20` }}
          >
            <div style={{ fontSize: 11, color: T.blue, letterSpacing: 1.5, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>
              Ejemplo
            </div>
            <div style={{ fontSize: 13, color: T.body, lineHeight: 1.6 }}>
              Un pedido a <strong>{ejemploKm} km</strong> tendrá un envío de{" "}
              <strong style={{ color: T.ink }}>
                {tarifaBase} + {ejemploKm} × {precioKm} = {isNaN(ejemploEnvio) ? "?" : ejemploEnvio.toFixed(2)} €
              </strong>
            </div>
          </div>
        </div>
        )}

        {/* Tiempo */}
        <div style={{ marginBottom: 30 }}>
          <SectionHeader title="Tiempo de preparación" desc="Define cuánto tarda tu cocina en tener un pedido listo" />
          <div className="rounded-2xl grid grid-cols-3 gap-4" style={{ background: "#fff", border: `1px solid ${T.divider}`, padding: "18px 22px" }}>
            <FieldInput label="Buffer base" value={bufferMin} suffix="min" onChange={setBufferMin} />
            <FieldInput label="Velocidad media reparto" value={velocidad} suffix="km/h" onChange={setVelocidad} />
            <FieldInput label="Pedidos simultáneos máx." value={maxSimultaneos} suffix="pedidos" onChange={setMaxSimultaneos} />
          </div>
        </div>

        {/* Pagos */}
        <div style={{ marginBottom: 30 }}>
          <SectionHeader title="Métodos de pago" desc="Qué métodos aceptas para los pedidos" />
          <div className="flex flex-col gap-2.5">

            {/* Efectivo — siempre disponible si la plataforma lo tiene activo */}
            {plataformaMethods.efectivo && (
              <div
                className="flex items-center gap-3.5 rounded-xl"
                style={{ background: "#fff", border: `1px solid ${T.divider}`, padding: "14px 18px" }}
              >
                <div className="flex items-center justify-center rounded-xl flex-shrink-0"
                     style={{ width: 42, height: 42, background: aceptaEfectivo ? `${T.blue}12` : T.mist, fontSize: 20 }}>
                  💵
                </div>
                <div className="flex-1">
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>Efectivo</div>
                  <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>El repartidor cobra al entregar y confirma la recepción</div>
                </div>
                <button onClick={() => setAceptaEfectivo(!aceptaEfectivo)}
                        className="relative flex-shrink-0"
                        style={{ width: 46, height: 26, borderRadius: 999, background: aceptaEfectivo ? T.success : T.divider, border: "none", cursor: "pointer" }}>
                  <div className="absolute"
                       style={{ top: 3, [aceptaEfectivo ? "right" : "left"]: 3, width: 20, height: 20, borderRadius: "50%", background: "#fff" }} />
                </button>
              </div>
            )}

            {/* Bizum */}
            {plataformaMethods.bizum && (
              <div className="rounded-xl" style={{ background: "#fff", border: `1px solid ${T.divider}` }}>
                <div className="flex items-center gap-3.5" style={{ padding: "14px 18px" }}>
                  <div className="flex items-center justify-center rounded-xl flex-shrink-0"
                       style={{ width: 42, height: 42, background: aceptaBizum ? `${T.blue}12` : T.mist, fontSize: 20 }}>
                    📱
                  </div>
                  <div className="flex-1">
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>Bizum</div>
                    <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>El cliente paga a tu número de Bizum directamente</div>
                  </div>
                  <button onClick={() => setAceptaBizum(!aceptaBizum)}
                          className="relative flex-shrink-0"
                          style={{ width: 46, height: 26, borderRadius: 999, background: aceptaBizum ? T.success : T.divider, border: "none", cursor: "pointer" }}>
                    <div className="absolute"
                         style={{ top: 3, [aceptaBizum ? "right" : "left"]: 3, width: 20, height: 20, borderRadius: "50%", background: "#fff" }} />
                  </button>
                </div>
                {aceptaBizum && (
                  <div style={{ padding: "0 18px 14px", borderTop: `1px solid ${T.divider}`, paddingTop: 12 }}>
                    <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
                      Número de Bizum (teléfono del negocio)
                    </div>
                    <input
                      type="tel"
                      value={bizumNumero}
                      onChange={(e) => setBizumNumero(e.target.value)}
                      placeholder="+34 600 000 000"
                      className="w-full rounded-xl outline-none"
                      style={{ padding: "10px 14px", background: T.mist, border: `1px solid ${T.divider}`, fontSize: 14, color: T.ink, fontFamily: "Barlow, sans-serif" }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Tarjeta — coming soon */}
            <div className="flex items-center gap-3.5 rounded-xl"
                 style={{ background: "#fff", border: `1px solid ${T.divider}`, padding: "14px 18px", opacity: 0.5 }}>
              <div className="flex items-center justify-center rounded-xl flex-shrink-0"
                   style={{ width: 42, height: 42, background: T.mist, fontSize: 20 }}>
                💳
              </div>
              <div className="flex-1">
                <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>
                  Tarjeta / Pasarela de pago
                  <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, letterSpacing: 1, color: T.muted, textTransform: "uppercase" }}>
                    Próximamente
                  </span>
                </div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Pago online antes del envío</div>
              </div>
              <div className="relative flex-shrink-0"
                   style={{ width: 46, height: 26, borderRadius: 999, background: T.divider }}>
                <div className="absolute" style={{ top: 3, left: 3, width: 20, height: 20, borderRadius: "50%", background: "#fff" }} />
              </div>
            </div>

          </div>
        </div>

        {/* Horario */}
        <div style={{ marginBottom: 30 }}>
          <SectionHeader title="Horario de delivery" desc="Independiente del horario del local" />
          <div className="rounded-2xl" style={{ background: "#fff", border: `1px solid ${T.divider}`, padding: "18px 22px" }}>
            {DIAS.map((dia, i) => {
              const diaSemana = (i + 1) % 7;
              const horario   = horarios.find((h) => h.dia_semana === diaSemana);
              const editando  = editandoDia === diaSemana;

              function abrirEdicion() {
                setEditandoDia(diaSemana);
                setEditApertura(horario?.hora_apertura?.slice(0, 5) ?? "09:00");
                setEditCierre(horario?.hora_cierre?.slice(0, 5) ?? "22:00");
              }

              function guardarDia() {
                setHorarios((prev) => {
                  const sin = prev.filter((h) => h.dia_semana !== diaSemana);
                  return [...sin, {
                    id:           `local-${diaSemana}`,
                    prestador_id: "",
                    dia_semana:   diaSemana,
                    hora_apertura: editApertura + ":00",
                    hora_cierre:   editCierre + ":00",
                  }];
                });
                setEditandoDia(null);
              }

              function cerrarDia() {
                setHorarios((prev) => prev.filter((h) => h.dia_semana !== diaSemana));
                setEditandoDia(null);
              }

              return (
                <div
                  key={dia}
                  style={{ padding: "10px 0", borderBottom: i < 6 ? `1px solid ${T.divider}` : "none" }}
                >
                  {/* Fila principal */}
                  <div className="flex items-center gap-3.5">
                    <div style={{ width: 48, fontSize: 13, fontWeight: 600, color: T.ink }}>{dia}</div>
                    <div className="flex-1" style={{ fontSize: 13, color: horario ? T.body : T.muted }}>
                      {horario ? `${horario.hora_apertura.slice(0, 5)} – ${horario.hora_cierre.slice(0, 5)}` : "Cerrado"}
                    </div>
                    <button
                      onClick={editando ? () => setEditandoDia(null) : abrirEdicion}
                      style={{ background: "none", border: "none", color: editando ? T.muted : T.blue, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Barlow, sans-serif" }}
                    >
                      {editando ? "Cancelar" : "Editar"}
                    </button>
                  </div>

                  {/* Panel de edición inline */}
                  {editando && (
                    <div
                      className="flex items-center gap-2 flex-wrap"
                      style={{ marginTop: 10, padding: "12px 14px", background: T.mist, borderRadius: 12 }}
                    >
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>Apertura</span>
                        <input
                          type="time"
                          value={editApertura}
                          onChange={(e) => setEditApertura(e.target.value)}
                          style={{
                            padding: "6px 10px", borderRadius: 8, border: `1px solid ${T.divider}`,
                            fontSize: 14, color: T.ink, fontFamily: "Barlow, sans-serif",
                            background: "#fff", outline: "none",
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>Cierre</span>
                        <input
                          type="time"
                          value={editCierre}
                          onChange={(e) => setEditCierre(e.target.value)}
                          style={{
                            padding: "6px 10px", borderRadius: 8, border: `1px solid ${T.divider}`,
                            fontSize: 14, color: T.ink, fontFamily: "Barlow, sans-serif",
                            background: "#fff", outline: "none",
                          }}
                        />
                      </div>
                      <div className="flex gap-2 ml-auto">
                        <button
                          onClick={cerrarDia}
                          style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${T.divider}`, background: "#fff", color: T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Barlow, sans-serif" }}
                        >
                          Cerrado
                        </button>
                        <button
                          onClick={guardarDia}
                          style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: T.blue, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Barlow, sans-serif" }}
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-2.5" style={{ marginTop: 24 }}>
          {saved && (
            <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl" style={{ background: `${T.success}12`, color: T.success, fontSize: 13, fontWeight: 600 }}>
              <CheckIcon className="w-4 h-4" /> Guardado
            </div>
          )}
          <button
            onClick={handleGuardar}
            disabled={isPending}
            style={{ padding: "12px 28px", background: "#000", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Barlow, sans-serif", opacity: isPending ? 0.6 : 1 }}
          >
            {isPending ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
