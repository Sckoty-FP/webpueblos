import { notFound } from "next/navigation";
import { getPuebloBySlug } from "@/lib/supabase/queries/pueblos";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

interface Props {
  children: React.ReactNode;
  params: Promise<{ pueblo: string }>;
}

export default async function PuebloLayout({ children, params }: Props) {
  const { pueblo: slugParam } = await params;
  const pueblo = await getPuebloBySlug(slugParam);
  if (!pueblo) notFound();

  return (
    <>
      <Nav variant="pueblo" />
      <main className="pt-14 pb-16 md:pb-0">
        {children}
      </main>
      <Footer variant="pueblo" />
      <MobileBottomNav variant="pueblo" />
    </>
  );
}
