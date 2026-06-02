// Stub vacío para los tests: en producción `server-only` impide importar un
// módulo server desde el cliente. En Vitest (Node, sin condición react-server)
// ese guard no aplica y el paquete real no resuelve, así que lo neutralizamos.
export {};
