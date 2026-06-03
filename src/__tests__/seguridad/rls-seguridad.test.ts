import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

/**
 * Invariantes de seguridad sobre las migraciones SQL (NO corre contra la base).
 *
 * Blindan los fixes de la revisión transversal (ver SEGURIDAD/) contra regresión:
 *   - SEC-010: el rol (`usuarios.tipo`) no debe poder auto-asignarse.
 *   - SEC-008: el Storage de partes/firmas no debe ser accesible cross-tenant.
 *
 * Si una migración futura reabre cualquiera de estos agujeros, este test falla.
 */

const MIGRATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../proyecto-pueblos/packages/database/migrations",
);

function sqlAcumulado(): string {
  const archivos = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  return archivos
    .map((f) => `-- FILE: ${f}\n${readFileSync(path.join(MIGRATIONS_DIR, f), "utf8")}`)
    .join("\n");
}

/** Cuerpo de la ÚLTIMA definición de una función plpgsql/sql (estado efectivo). */
function ultimaFuncion(sql: string, nombre: string): string | null {
  const re = new RegExp(
    `CREATE\\s+OR\\s+REPLACE\\s+FUNCTION\\s+(public\\.)?${nombre}\\b[\\s\\S]*?AS\\s+\\$\\$([\\s\\S]*?)\\$\\$`,
    "gi",
  );
  let m: RegExpExecArray | null;
  let ultimo: string | null = null;
  while ((m = re.exec(sql)) !== null) ultimo = m[2];
  return ultimo;
}

describe("SEC-010 — el rol usuarios.tipo no se puede auto-asignar", () => {
  const sql = sqlAcumulado();

  it("handle_new_user (vigente) restringe el tipo del alta a una lista blanca", () => {
    const cuerpo = ultimaFuncion(sql, "handle_new_user");
    expect(cuerpo, "no se encontró handle_new_user").not.toBeNull();
    // Debe filtrar a basico/prestador, no castear ciegamente el metadata.
    expect(
      cuerpo!,
      "handle_new_user no aplica lista blanca de tipo — ¿se reabrió SEC-010 vector (a)?",
    ).toMatch(/IN\s*\(\s*'basico'\s*,\s*'prestador'\s*\)/i);
  });

  it("existe un trigger que protege la columna tipo de updates no autorizados", () => {
    expect(
      sql,
      "falta el guard de la columna tipo — ¿se reabrió SEC-010 vector (b)?",
    ).toMatch(/guard_usuarios_tipo/i);
    expect(sql).toMatch(/BEFORE\s+UPDATE\s+ON\s+(public\.)?usuarios/i);
  });

  it("el guard solo deja cambiar tipo a super_admin (o service-role)", () => {
    const cuerpo = ultimaFuncion(sql, "guard_usuarios_tipo");
    expect(cuerpo, "no se encontró guard_usuarios_tipo").not.toBeNull();
    expect(cuerpo!).toMatch(/NEW\.tipo\s+IS\s+DISTINCT\s+FROM\s+OLD\.tipo/i);
    expect(cuerpo!).toMatch(/super_admin/i);
    expect(cuerpo!).toMatch(/RAISE\s+EXCEPTION/i);
  });
});

describe("SEC-008 — Storage de partes/firmas atado al dueño", () => {
  const sql = sqlAcumulado();

  it("se elimina la policy floja 'Propietario gestiona fotos partes'", () => {
    expect(
      sql,
      "no se hace DROP de la policy cross-tenant — ¿quedó la versión floja?",
    ).toMatch(/DROP\s+POLICY\s+IF\s+EXISTS\s+"Propietario gestiona fotos partes"/i);
  });

  it("las policies de partes-fotos/firmas-partes atan el acceso al prestador dueño", () => {
    // Debe existir al menos una policy sobre storage.objects para esos buckets
    // que delegue en auth_user_is_prestador_owner (no en auth.role()='authenticated').
    const tieneOwner =
      /firmas-partes[\s\S]*?auth_user_is_prestador_owner/i.test(sql) ||
      /auth_user_is_prestador_owner[\s\S]*?firmas-partes/i.test(sql);
    expect(
      tieneOwner,
      "el Storage de partes/firmas no se ata al dueño — ¿se reabrió SEC-008?",
    ).toBe(true);
  });
});

describe("SEC-002b — presupuestos-pdf privado y atado al dueño", () => {
  const sql = sqlAcumulado();

  it("el bucket presupuestos-pdf se marca privado", () => {
    expect(
      sql,
      "presupuestos-pdf no se pasa a privado — ¿se reabrió SEC-002b?",
    ).toMatch(/UPDATE\s+storage\.buckets\s+SET\s+public\s*=\s*false\s+WHERE\s+id\s*=\s*'presupuestos-pdf'/i);
  });

  it("se elimina la policy SELECT sin condición 'PDF presupuesto público'", () => {
    expect(sql).toMatch(/DROP\s+POLICY\s+IF\s+EXISTS\s+"PDF presupuesto público"/i);
  });

  it("la lectura/escritura de presupuestos-pdf se ata al prestador dueño", () => {
    const tieneOwner =
      /presupuestos-pdf[\s\S]*?auth_user_is_prestador_owner/i.test(sql) &&
      /presupuestos-pdf[\s\S]*?auth_user_is_prestador_staff/i.test(sql);
    expect(
      tieneOwner,
      "presupuestos-pdf no queda atado a owner/staff — ¿se reabrió SEC-002b?",
    ).toBe(true);
  });
});

describe("Flujo público de presupuestos — vía RPC SECURITY DEFINER (no anon directo)", () => {
  const sql = sqlAcumulado();

  // El cliente sin cuenta opera por funciones acotadas al token, nunca tocando la
  // tabla `presupuestos` directo. Si alguien reemplaza esto por una policy anon
  // laxa (anon SELECT/UPDATE sobre la tabla), se expondrían presupuestos ajenos.
  const rpcs = [
    "presupuesto_por_token",
    "presupuesto_aceptar_por_token",
    "presupuesto_rechazar_por_token",
    "solicitar_presupuesto_publico",
  ];

  for (const fn of rpcs) {
    it(`la función ${fn} existe y es SECURITY DEFINER`, () => {
      const re = new RegExp(
        `CREATE\\s+OR\\s+REPLACE\\s+FUNCTION\\s+(public\\.)?${fn}\\b[\\s\\S]*?SECURITY\\s+DEFINER`,
        "i",
      );
      expect(
        sql,
        `falta ${fn} como SECURITY DEFINER — ¿se rompió el flujo público de presupuestos?`,
      ).toMatch(re);
    });
  }

  it("NO se abre el acceso anónimo directo a la tabla presupuestos", () => {
    // Señal de anti-patrón: una policy que deje al rol anon leer por token sin pasar
    // por la RPC (token_aceptacion IS NOT NULL como única condición de un SELECT).
    const policyAnonLaxa =
      /ON\s+presupuestos\s+FOR\s+SELECT[\s\S]*?token_aceptacion\s+IS\s+NOT\s+NULL/i.test(sql);
    expect(
      policyAnonLaxa,
      "hay una policy SELECT laxa por token en presupuestos — permitiría dumpear presupuestos ajenos",
    ).toBe(false);
  });
});

describe("Muro — reportes versionados + moderación protegida", () => {
  const sql = sqlAcumulado();

  it("muro_reportes está en migraciones (no solo creada a mano)", () => {
    expect(
      sql,
      "falta CREATE TABLE muro_reportes en migraciones — la infra del muro no se reconstruye desde el repo",
    ).toMatch(/CREATE\s+TABLE\s+(IF\s+NOT\s+EXISTS\s+)?muro_reportes/i);
  });

  it("handle_muro_reporte existe, es SECURITY DEFINER y oculta con >=2 reportes", () => {
    expect(sql).toMatch(
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+(public\.)?handle_muro_reporte\b[\s\S]*?SECURITY\s+DEFINER/i,
    );
    const cuerpo = ultimaFuncion(sql, "handle_muro_reporte") ?? "";
    expect(cuerpo).toMatch(/>=\s*2/);
    expect(cuerpo).toMatch(/aprobado/i);
  });

  it("existe el guard guard_muro_aprobado (el autor no reactiva su post oculto)", () => {
    expect(
      sql,
      "falta guard_muro_aprobado — el autor podría revertir el auto-ocultado (Punto 1 / patrón SEC-010)",
    ).toMatch(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+(public\.)?guard_muro_aprobado\b/i);
    expect(sql).toMatch(
      /CREATE\s+TRIGGER\s+trigger_guard_muro_aprobado\s+BEFORE\s+UPDATE\s+ON\s+muro_posts/i,
    );
  });

  it("el guard solo deja reactivar (false→true) a admins o al backend", () => {
    const cuerpo = ultimaFuncion(sql, "guard_muro_aprobado") ?? "";
    expect(cuerpo).toMatch(/super_admin/);
    expect(cuerpo).toMatch(/NEW\.aprobado\s*:=\s*FALSE/i);
  });
});
