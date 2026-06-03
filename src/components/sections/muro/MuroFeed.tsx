"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { uploadMuroImage } from "@/lib/supabase/storage";
import { crearPostMuro } from "@/app/[pueblo]/muro/actions";
import type { MuroPostDB, MuroComentarioDB } from "@/types";

/* ─── Helpers ────────────────────────────────────────────────────────────────── */
const GRADS = [
  "linear-gradient(160deg, #0c4a6e 0%, #0284c7 50%, #bae6fd 100%)",
  "linear-gradient(160deg, #78350f 0%, #d97706 50%, #fde68a 100%)",
  "linear-gradient(160deg, #0c4a6e 0%, #0e7490 50%, #67e8f9 100%)",
  "linear-gradient(160deg, #14532d 0%, #16a34a 50%, #bbf7d0 100%)",
  "linear-gradient(160deg, #4c1d95 0%, #c026d3 50%, #f0abfc 100%)",
  "linear-gradient(160deg, #1e3a5f 0%, #d53b00 70%, #fb923c 100%)",
];

function gradFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffffff;
  return GRADS[Math.abs(h) % GRADS.length];
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

function expiresIn(iso: string): string {
  const exp = new Date(iso).getTime() + 24 * 60 * 60 * 1000;
  const diff = exp - Date.now();
  if (diff <= 0) return "expirado";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m restantes`;
  return `${Math.floor(mins / 60)}h restantes`;
}

/* ─── Comments Section ───────────────────────────────────────────────────────── */
function CommentsSection({ postId, onNewComment }: { postId: string; onNewComment: () => void }) {
  const [comments, setComments] = useState<MuroComentarioDB[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  async function load() {
    if (loaded) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("muro_comentarios")
      .select("id, post_id, autor_id, contenido, created_at, autor:usuarios(nombre)")
      .eq("post_id", postId)
      .eq("aprobado", true)
      .order("created_at", { ascending: true })
      .limit(30);
    setComments((data ?? []) as unknown as MuroComentarioDB[]);
    setLoaded(true);
    setLoading(false);
  }

  // Load on mount
  if (!loaded && !loading) load();

  async function submit() {
    if (!text.trim() || posting) return;
    setPosting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setPosting(false); return; }

    const { data } = await supabase
      .from("muro_comentarios")
      .insert({ post_id: postId, autor_id: user.id, contenido: text.trim() })
      .select("id, post_id, autor_id, contenido, created_at, autor:usuarios(nombre)")
      .single();

    if (data) {
      setComments((prev) => [...prev, data as unknown as MuroComentarioDB]);
      setText("");
      onNewComment();
    }
    setPosting(false);
  }

  return (
    <div className="border-t border-divisor px-4 pt-3 pb-4">
      {loading && (
        <p className="font-barlow text-[12px] text-text-muted py-2">Cargando comentarios...</p>
      )}

      {loaded && comments.length === 0 && (
        <p className="font-barlow text-[12px] text-text-muted py-2">Sin comentarios todavía. ¡Sé el primero!</p>
      )}

      {comments.map((c) => (
        <div key={c.id} className="flex gap-2 mb-2.5">
          <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center font-barlow font-bold text-primary text-[10px] flex-shrink-0 mt-0.5">
            {(c.autor?.nombre ?? "V")[0].toUpperCase()}
          </div>
          <div>
            <span className="font-barlow font-semibold text-[12px] text-text-body mr-1.5">{c.autor?.nombre ?? "Vecino"}</span>
            <span className="font-barlow text-[12px] text-text-muted">{timeAgo(c.created_at)}</span>
            <p className="font-barlow text-[13px] text-text-body leading-snug mt-0.5">{c.contenido}</p>
          </div>
        </div>
      ))}

      <div className="flex gap-2 mt-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
          placeholder="Escribí un comentario..."
          className="flex-1 font-barlow text-[13px] border border-divisor rounded-pill px-3.5 py-2 outline-none focus:border-primary transition-colors placeholder:text-text-muted"
        />
        <button
          onClick={submit}
          disabled={!text.trim() || posting}
          className="font-barlow font-semibold text-[12px] text-white bg-primary rounded-pill px-4 py-2 cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          {posting ? "..." : "Enviar"}
        </button>
      </div>
    </div>
  );
}

/* ─── Report Modal ───────────────────────────────────────────────────────────── */
const MOTIVOS = ["Contenido inapropiado", "Spam", "Acoso", "Información falsa", "Otro"];

function ReportModal({ postId, onClose, onReported }: { postId: string; onClose: () => void; onReported: () => void }) {
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Necesitás iniciar sesión para reportar."); setLoading(false); return; }

    const { error: err } = await supabase
      .from("muro_reportes")
      .insert({ post_id: postId, usuario_id: user.id, motivo });

    if (err) {
      setError(err.code === "23505" ? "Ya reportaste este contenido anteriormente." : "No se pudo enviar el reporte. Intentá de nuevo.");
      setLoading(false);
      return;
    }
    onReported();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full max-w-sm rounded-card-lg p-6">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <p className="font-fraunces font-semibold text-[18px] text-text-body text-center mb-2">Reportar contenido</p>
        <p className="font-barlow text-[13px] text-text-muted text-center mb-4 leading-relaxed">
          Con 2 reportes se oculta automáticamente hasta que un admin lo revise.
        </p>

        <div className="flex flex-col gap-2.5 mb-5">
          {MOTIVOS.map((m) => (
            <label key={m} className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name="motivo" value={m} checked={motivo === m} onChange={() => setMotivo(m)} className="accent-red-600 w-4 h-4 cursor-pointer" />
              <span className="font-barlow text-[13px] text-text-body">{m}</span>
            </label>
          ))}
        </div>

        {error && <p className="font-barlow text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-card px-3 py-2 mb-3 text-center">{error}</p>}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 font-barlow font-semibold text-[14px] text-text-muted border border-divisor rounded-pill py-2.5 cursor-pointer hover:bg-fog transition-colors">
            Cancelar
          </button>
          <button onClick={confirm} disabled={loading} className="flex-1 font-barlow font-semibold text-[14px] text-white bg-red-600 rounded-pill py-2.5 cursor-pointer hover:bg-red-700 transition-colors disabled:opacity-40">
            {loading ? "Enviando..." : "Reportar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Post Card ──────────────────────────────────────────────────────────────── */
function PostCard({ post: initial, puebloSlug }: { post: MuroPostDB; puebloSlug: string }) {
  const [likes, setLikes] = useState(initial.total_likes);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(initial.total_comentarios);
  const [reported, setReported] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      Promise.all([
        supabase.from("muro_likes").select("post_id").eq("post_id", initial.id).eq("usuario_id", user.id).maybeSingle(),
        supabase.from("muro_reportes").select("post_id").eq("post_id", initial.id).eq("usuario_id", user.id).maybeSingle(),
      ]).then(([likeRes, reportRes]) => {
        if (likeRes.data) setLiked(true);
        if (reportRes.data) setReported(true);
      });
    });
  }, [initial.id]);

  const authorName = initial.autor?.nombre ?? "Vecino";
  const initials = authorName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const hasPhoto = initial.imagenes_urls?.length > 0;

  async function toggleLike() {
    if (likeLoading) return;
    setLikeLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLikeLoading(false); return; }

    if (liked) {
      await supabase.from("muro_likes").delete().match({ post_id: initial.id, usuario_id: user.id });
      setLiked(false);
      setLikes((n) => Math.max(0, n - 1));
    } else {
      await supabase.from("muro_likes").insert({ post_id: initial.id, usuario_id: user.id });
      setLiked(true);
      setLikes((n) => n + 1);
    }
    setLikeLoading(false);
  }

  async function handleShare() {
    const url = `${window.location.origin}/${puebloSlug}/muro#${initial.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Momento en el muro`, text: initial.contenido.slice(0, 80), url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // user cancelled share — ignore
    }
  }

  return (
    <div id={initial.id} className="bg-white rounded-card-lg overflow-hidden border border-divisor" style={{ boxShadow: "rgba(0,0,0,0.05) 0px 2px 10px" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center font-barlow font-bold text-white text-[13px] flex-shrink-0">
            {initials}
          </div>
          <div>
            <p className="font-barlow font-semibold text-[14px] text-text-body leading-none">{authorName}</p>
            <p className="font-barlow text-[11px] text-text-muted mt-0.5">{timeAgo(initial.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-fog px-2.5 py-1 rounded-pill">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span className="font-barlow text-[11px] text-text-muted">{expiresIn(initial.created_at)}</span>
          </div>
          {!reported && (
            <button
              onClick={() => setShowReportModal(true)}
              className="w-7 h-7 flex items-center justify-center rounded-full text-text-muted hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer border-none bg-transparent"
              title="Reportar"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
              </svg>
            </button>
          )}
          {reported && (
            <span className="font-barlow text-[11px] text-red-400 bg-red-50 px-2 py-0.5 rounded-pill">Reportado</span>
          )}
        </div>
      </div>

      {/* Photo or gradient */}
      {hasPhoto ? (
        <div className="relative mx-3 rounded-card overflow-hidden" style={{ height: 220 }}>
          <Image src={initial.imagenes_urls[0]} alt="" fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" />
        </div>
      ) : (
        <div className="relative mx-3 rounded-card overflow-hidden" style={{ height: 220 }}>
          <div className="w-full h-full" style={{ background: gradFor(initial.id) }} />
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
              backgroundSize: "200px",
            }}
          />
        </div>
      )}

      {/* Caption */}
      {initial.contenido.trim() && (
        <p className="font-barlow text-[14px] text-text-body px-4 pt-3 pb-2 leading-relaxed">{initial.contenido}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 px-4 pb-3">
        <button
          onClick={toggleLike}
          className="flex items-center gap-1.5 font-barlow font-medium text-[13px] px-3 py-1.5 rounded-pill border transition-all duration-150 cursor-pointer"
          style={{
            background: liked ? "#fff0ee" : "#fff",
            borderColor: liked ? "#d53b00" : "#e5e7eb",
            color: liked ? "#d53b00" : "#6b6b6b",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          {likes}
        </button>

        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 font-barlow font-medium text-[13px] px-3 py-1.5 rounded-pill border transition-all duration-150 cursor-pointer"
          style={{
            background: showComments ? "#f0f4ff" : "#fff",
            borderColor: showComments ? "#0070cc" : "#e5e7eb",
            color: showComments ? "#0070cc" : "#6b6b6b",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {commentCount}
        </button>

        <button
          onClick={handleShare}
          className="ml-auto flex items-center gap-1.5 font-barlow font-medium text-[13px] px-3 py-1.5 rounded-pill border border-divisor bg-white cursor-pointer hover:border-primary hover:text-primary transition-colors"
          style={{ color: copied ? "#059669" : "#6b6b6b", borderColor: copied ? "#059669" : undefined }}
        >
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              Copiado
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Compartir
            </>
          )}
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <CommentsSection
          postId={initial.id}
          onNewComment={() => setCommentCount((n) => n + 1)}
        />
      )}

      {showReportModal && (
        <ReportModal
          postId={initial.id}
          onClose={() => setShowReportModal(false)}
          onReported={() => setReported(true)}
        />
      )}
    </div>
  );
}

/* ─── Upload Modal ───────────────────────────────────────────────────────────── */
function UploadModal({
  isOpen,
  onClose,
  puebloId,
  onPosted,
}: {
  isOpen: boolean;
  onClose: () => void;
  puebloId: number;
  onPosted: (post: MuroPostDB) => void;
}) {
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [posted, setPosted] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function removePhoto() {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handlePost() {
    if (!text.trim() && !photo) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Necesitás iniciar sesión para publicar.");
      setLoading(false);
      return;
    }

    // La foto se sube desde el cliente (el bucket `muro` permite INSERT a
    // authenticated). La CREACIÓN del post va por el server action crearPostMuro,
    // que aplica rate-limit + validación Zod. No insertamos directo en la tabla.
    let imageUrl: string | null = null;
    if (photo) {
      imageUrl = await uploadMuroImage(user.id, photo);
      if (!imageUrl) {
        setError("No se pudo subir la foto. Intentá de nuevo.");
        setLoading(false);
        return;
      }
    }

    const fd = new FormData();
    fd.set("pueblo_id", String(puebloId));
    fd.set("tipo", "general");
    fd.set("contenido", text.trim());
    if (imageUrl) fd.set("imagen_url", imageUrl);

    const res = await crearPostMuro(fd);
    if (!res.ok) {
      setError(res.error);
      setLoading(false);
      return;
    }

    setPosted(true);
    onPosted(res.post);
    setTimeout(() => { setPosted(false); setText(""); removePhoto(); setLoading(false); onClose(); }, 1800);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-[24px] sm:rounded-card-lg overflow-hidden" style={{ maxHeight: "90dvh" }}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-divisor">
          <p className="font-barlow font-semibold text-[16px] text-text-body">Nuevo momento</p>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-fog text-text-muted hover:bg-divisor transition-colors cursor-pointer border-none">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto" style={{ maxHeight: "calc(90dvh - 70px)" }}>
          {posted ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#dcfce7" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <p className="font-fraunces font-semibold text-[20px] text-text-body">¡Publicado!</p>
              <p className="font-barlow text-[13px] text-text-muted mt-1">Tu momento ya está en el muro</p>
            </div>
          ) : (
            <>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" className="hidden" onChange={handleFileChange} />

              {photoPreview ? (
                <div className="relative mb-3 rounded-card overflow-hidden" style={{ height: 200 }}>
                  <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                  <button onClick={removePhoto} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center cursor-pointer border-none">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full mb-3 border-2 border-dashed border-divisor rounded-card flex flex-col items-center justify-center gap-2 py-6 cursor-pointer hover:border-primary hover:bg-fog/50 transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <span className="font-barlow text-[13px] text-text-muted">Agregar foto <span className="text-text-muted/60">(opcional)</span></span>
                </button>
              )}

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Contá qué está pasando..."
                rows={3}
                className="w-full font-barlow text-[14px] text-text-body border border-divisor rounded-card px-4 py-3 resize-none outline-none focus:border-primary transition-colors placeholder:text-text-muted mb-3"
              />

              <p className="font-barlow text-[12px] text-text-muted mb-4 flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Tu post estará visible durante 24 horas
              </p>

              {error && (
                <p className="font-barlow text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-card px-4 py-2 mb-3">{error}</p>
              )}

              <button
                onClick={handlePost}
                disabled={(!text.trim() && !photo) || loading}
                className="w-full font-barlow font-bold text-[15px] text-white bg-primary rounded-pill py-3.5 cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    {photo ? "Subiendo foto..." : "Publicando..."}
                  </>
                ) : "Publicar"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── MuroFeed ───────────────────────────────────────────────────────────────── */
export default function MuroFeed({
  initialPosts,
  puebloId,
  puebloNombre,
  puebloSlug,
}: {
  initialPosts: MuroPostDB[];
  puebloId: number;
  puebloNombre: string;
  puebloSlug: string;
}) {
  const [posts, setPosts] = useState<MuroPostDB[]>(initialPosts);
  const [modalOpen, setModalOpen] = useState(false);

  const handlePosted = useCallback((newPost: MuroPostDB) => {
    setPosts((prev) => [newPost, ...prev]);
  }, []);

  return (
    <>
      {/* Header */}
      <div className="relative bg-surface-dark px-4 py-12 sm:py-16 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.08]"
          style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #B8956A 0%, transparent 60%)" }}
        />
        <div className="container-app relative">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
            <span className="font-fraunces text-xs font-medium uppercase tracking-[0.18em] text-accent-warm">
              Muro 24h · en vivo
            </span>
          </div>
          <h1 className="display-section text-white mb-3 max-w-xl">
            Hoy en {puebloNombre}.
          </h1>
          <p className="font-barlow text-white/70 text-base max-w-lg leading-relaxed">
            Lo que está pasando ahora mismo. Mañana ya no estará. Avisos, recomendaciones, pequeñas cosas del pueblo.
          </p>
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-xl mx-auto px-4 py-6">
        <div className="mb-5">
          <button
            onClick={() => setModalOpen(true)}
            className="w-full bg-white rounded-card-lg border border-divisor px-4 py-3.5 flex items-center gap-3 cursor-pointer hover:border-primary transition-colors group"
            style={{ boxShadow: "rgba(0,0,0,0.04) 0px 2px 8px" }}
          >
            <div className="w-9 h-9 rounded-full bg-fog flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="1.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </div>
            <span className="font-barlow text-[14px] text-text-muted group-hover:text-text-body transition-colors">
              Compartí un momento de {puebloNombre}...
            </span>
            <div className="ml-auto bg-primary rounded-pill px-3 py-1.5 flex-shrink-0">
              <span className="font-barlow font-bold text-[12px] text-white">+ Publicar</span>
            </div>
          </button>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-fog flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p className="font-barlow font-semibold text-[17px] text-text-body mb-2">Sin momentos todavía</p>
            <p className="font-barlow text-text-muted text-[14px]">¡Sé el primero en compartir algo hoy!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((p) => <PostCard key={p.id} post={p} puebloSlug={puebloSlug} />)}
          </div>
        )}

        {posts.length > 0 && (
          <div className="text-center pt-8 pb-2">
            <p className="font-barlow text-[13px] text-text-muted">Mostrando los {posts.length} momentos activos</p>
            <p className="font-barlow text-[12px] text-text-muted mt-1">Los posts expiran automáticamente a las 24 horas</p>
          </div>
        )}
      </div>

      <UploadModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        puebloId={puebloId}
        onPosted={handlePosted}
      />
    </>
  );
}
