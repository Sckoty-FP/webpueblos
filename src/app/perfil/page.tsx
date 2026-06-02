import type { Metadata } from "next";
import Nav from "@/components/layout/Nav";

export const dynamic = "force-dynamic";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import PerfilView from "@/components/sections/perfil/PerfilView";
import { requireUser } from "@/lib/auth/require-user";
import { getReservasDelUsuario } from "@/lib/supabase/queries/panel";
import { getPedidosDelUsuario } from "@/lib/supabase/queries/delivery-publico";
import {
  getInscripcionesUsuario,
  getPostsMuroPropios,
  getDireccionesUsuario,
} from "@/lib/supabase/queries/cuenta-usuario";

export const metadata: Metadata = {
  title: "Mi perfil",
  robots: { index: false, follow: false },
};

export default async function PerfilPage() {
  const user = await requireUser("/perfil");

  const [reservas, pedidos, inscripciones, postsMuro, direcciones] = await Promise.all([
    getReservasDelUsuario(),
    getPedidosDelUsuario(user.id),
    getInscripcionesUsuario(user.id),
    getPostsMuroPropios(user.id),
    getDireccionesUsuario(user.id),
  ]);

  return (
    <>
      <Nav />
      <main className="pt-14 min-h-screen bg-fog">
        <PerfilView
          userId={user.id}
          email={user.email ?? ""}
          nombre={user.user_metadata?.nombre ?? user.email?.split("@")[0] ?? "Usuario"}
          tipo={user.user_metadata?.tipo ?? "basico"}
          avatarUrl={user.user_metadata?.avatar_url ?? null}
          reservas={reservas}
          pedidos={pedidos}
          inscripciones={inscripciones}
          postsMuro={postsMuro}
          direcciones={direcciones}
        />
      </main>
      <Footer />
      <MobileBottomNav />
    </>
  );
}
