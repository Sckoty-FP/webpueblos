import { defineConfig } from 'vitest/config';
import path             from 'path';

// Config separada para los tests de INTEGRACIÓN (corren contra Supabase real).
// No se mezclan con los unitarios: `pnpm test:unit` no los toca.
// Cargan web/.env.test.local si existe (credenciales de prueba, NO versionar).
export default defineConfig({
  test: {
    environment: 'node',
    globals:     true,
    include:     ['integration/**/*.test.ts'],
    env:         loadEnvTestLocal(),
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});

function loadEnvTestLocal(): Record<string, string> {
  try {
    const fs   = require('fs') as typeof import('fs');
    const file = path.resolve(__dirname, '.env.test.local');
    if (!fs.existsSync(file)) return {};
    const out: Record<string, string> = {};
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
    return out;
  } catch {
    return {};
  }
}
