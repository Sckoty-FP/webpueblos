import { redirect } from "next/navigation";
import { getPrestadorDelUsuario } from "@/lib/supabase/queries/panel";
import { getModules } from "@/lib/panel/modules";
import Link from "next/link";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-card border border-divisor p-6" style={{ boxShadow: "rgba(0,0,0,0.04) 0px 2px 8px" }}>
      <p className="font-barlow text-[12px] font-semibold text-text-muted uppercase tracking-widest mb-2">{label}</p>
      <p className="font-fraunces font-semibold text-[32px] text-text-body leading-none mb-1">{value}</p>
      {sub && <p className="font-barlow text-[13px] text-text-muted">{sub}</p>}
    </div>
  );
}

export default async function PanelPage() {
  const prestador = await getPrestadorDelUsuario();
  if (!prestador) redirect("/auth/login");

  const modules = getModules(prestador.servicios);
  const serviciosActivos = prestador.servicios.filter((s) => s.activo).length;

  return (
    <main className="flex-1 p-8 max-md:p-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-fraunces font-semibold text-[28px] text-text-body mb-1">
          Hola, {prestador.nombre.split(" ")[0]} 👋
        </h1>
        <p className="font-barlow text-[15px] text-text-muted">
          {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Alert si no tiene foto */}
      {!prestador.imagen_portada_url && (
        <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-card px-5 py-4">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.75" className="mt-0.5 shrink-0">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>
            <p className="font-barlow font-semibold text-[14px] text-amber-800">Tu perfil no tiene foto de portada</p>
            <p className="font-barlow text-[13px] text-amber-700">Los negocios con foto reciben 3x más visitas.</p>
          </div>
          <Link href="/panel/perfil" className="ml-auto font-barlow font-bold text-[13px] text-amber-700 no-underline hover:underline shrink-0">
            Agregar foto →
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8 max-sm:grid-cols-1 lg:grid-cols-4">
        <StatCard
          label="Rating"
          value={prestador.rating_promedio > 0 ? prestador.rating_promedio.toFixed(1) : "—"}
          sub={`${prestador.total_reviews} reseñas`}
        />
        <StatCard
          label="Servicios activos"
          value={serviciosActivos}
          sub={`${prestador.servicios.length} en total`}
        />
        {modules.reservas && (
          <StatCard
            label="Total reservas"
            value={prestador.total_reservas ?? 0}
            sub="histórico"
          />
        )}
        <StatCard
          label="Visualizaciones"
          value={prestador.total_visualizaciones ?? 0}
          sub="total"
        />
      </div>

      {/* Quick actions */}
      <h2 className="font-barlow font-semibold text-[16px] text-text-body mb-4">Accesos rápidos</h2>
      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1 lg:grid-cols-3">
        <Link
          href="/panel/perfil"
          className="no-underline bg-white rounded-card border border-divisor p-5 hover:border-primary/40 hover:shadow-md transition-all duration-200 group"
          style={{ boxShadow: "rgba(0,0,0,0.04) 0px 2px 8px" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" className="mb-3">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <p className="font-barlow font-semibold text-[15px] text-text-body mb-1">Editar perfil</p>
          <p className="font-barlow text-[13px] text-text-muted">Descripción, fotos, redes sociales</p>
        </Link>

        <Link
          href="/panel/servicios"
          className="no-underline bg-white rounded-card border border-divisor p-5 hover:border-primary/40 hover:shadow-md transition-all duration-200 group"
          style={{ boxShadow: "rgba(0,0,0,0.04) 0px 2px 8px" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" className="mb-3">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/>
          </svg>
          <p className="font-barlow font-semibold text-[15px] text-text-body mb-1">Gestionar servicios</p>
          <p className="font-barlow text-[13px] text-text-muted">Precios, descripción, disponibilidad</p>
        </Link>

        {modules.reservas && (
          <Link
            href="/panel/reservas"
            className="no-underline bg-white rounded-card border border-divisor p-5 hover:border-primary/40 hover:shadow-md transition-all duration-200 group"
            style={{ boxShadow: "rgba(0,0,0,0.04) 0px 2px 8px" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" className="mb-3">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <p className="font-barlow font-semibold text-[15px] text-text-body mb-1">Ver reservas</p>
            <p className="font-barlow text-[13px] text-text-muted">Confirmar, gestionar agenda</p>
          </Link>
        )}

        {modules.horarios && (
          <Link
            href="/panel/horarios"
            className="no-underline bg-white rounded-card border border-divisor p-5 hover:border-primary/40 hover:shadow-md transition-all duration-200 group"
            style={{ boxShadow: "rgba(0,0,0,0.04) 0px 2px 8px" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" className="mb-3">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <p className="font-barlow font-semibold text-[15px] text-text-body mb-1">Horarios</p>
            <p className="font-barlow text-[13px] text-text-muted">Días y horas de apertura</p>
          </Link>
        )}
      </div>
    </main>
  );
}
