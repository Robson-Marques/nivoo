/**
 * Formata uma data no padrão brasileiro (dd/mm/yyyy)
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/**
 * Formata data e hora no padrão brasileiro
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Retorna a diferença entre duas datas em dias
 */
export function daysBetween(date1: Date, date2: Date): number {
  const one_day = 1000 * 60 * 60 * 24;
  return Math.ceil((date2.getTime() - date1.getTime()) / one_day);
}
