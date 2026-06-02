import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

/**
 * Test de invariantes RLS sobre las migraciones SQL.
 *
 * NO corre contra la base de datos: lee los archivos de migración y verifica
 * propiedades estructurales que atrapan la clase de bug que apareció 4 veces
 * (bugs 6, 8, 11 + el latente de pedido_estados):
 *
 *   "alguien copió una lista de actores hardcodeada en la policy de una tabla
 *    hija del pedido, en vez de delegar en la función centralizada".
 *
 * La regla del proyecto (post-refactor 038) es: toda tabla relacionada con un
 * pedido expone su visibilidad vía `auth_can_read_pedido(...)`. Este test falla
 * si una futura migración vuelve a hardcodear actores en una tabla hija.
 */

const MIGRATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../proyecto-pueblos/packages/database/migrations",
);

/** Lee y concatena todas las migraciones .sql en orden de número de versión. */
function sqlAcumulado(): string {
  const archivos = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort(); // 001_, 002_, ... 038_ — orden lexicográfico == orden de aplicación
  return archivos
    .map((f) => `-- FILE: ${f}\n${readFileSync(path.join(MIGRATIONS_DIR, f), "utf8")}`)
    .join("\n");
}

/**
 * Devuelve, para una tabla, el cuerpo de la ÚLTIMA `CREATE POLICY ... FOR SELECT`
 * que la define (la más reciente == el estado efectivo tras los DROP/CREATE).
 * Corta en el `;` que cierra la sentencia (las policies no llevan `;` interno).
 */
function ultimaPolicySelect(sql: string, tabla: string): string | null {
  const re = new RegExp(
    `CREATE POLICY\\s+"[^"]+"\\s+ON\\s+${tabla}\\s+FOR\\s+SELECT\\b([\\s\\S]*?);`,
    "gi",
  );
  let m: RegExpExecArray | null;
  let ultimo: string | null = null;
  while ((m = re.exec(sql)) !== null) ultimo = m[1];
  return ultimo;
}

describe("Invariantes RLS — visibilidad centralizada del pedido", () => {
  const sql = sqlAcumulado();

  it("la función auth_can_read_pedido está definida en alguna migración", () => {
    expect(sql).toMatch(/CREATE\s+(OR\s+REPLACE\s+)?FUNCTION\s+(public\.)?auth_can_read_pedido/i);
  });

  // Las tablas hijas del pedido cuya visibilidad DEBE delegar en la función.
  const tablasHijas = ["pedido_items", "pedido_estados"];

  for (const tabla of tablasHijas) {
    it(`la última policy SELECT de ${tabla} usa auth_can_read_pedido`, () => {
      const cuerpo = ultimaPolicySelect(sql, tabla);
      expect(cuerpo, `no se encontró policy SELECT sobre ${tabla}`).not.toBeNull();
      expect(
        cuerpo!,
        `la policy SELECT vigente de ${tabla} no delega en auth_can_read_pedido — ` +
          `¿se volvió a hardcodear la lista de actores?`,
      ).toMatch(/auth_can_read_pedido\s*\(/);
    });

    it(`la última policy SELECT de ${tabla} NO hardcodea la lista de actores`, () => {
      const cuerpo = ultimaPolicySelect(sql, tabla)!;
      // Señal de hardcodeo: enumerar cliente_id + staff + tipo en la misma policy.
      const hardcodea =
        /cliente_id\s*=\s*auth\.uid\(\)/i.test(cuerpo) &&
        /auth_user_is_prestador_staff/i.test(cuerpo);
      expect(
        hardcodea,
        `${tabla} repite la lista de actores en su policy en lugar de usar el helper`,
      ).toBe(false);
    });
  }
});
