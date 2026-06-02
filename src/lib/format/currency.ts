const FMT = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

export function formatCurrency(amount: number): string {
  return FMT.format(amount);
}

// "1.469,70" sin símbolo
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}
