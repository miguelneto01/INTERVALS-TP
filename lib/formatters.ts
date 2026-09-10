export function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m > 0 ? `${m}m` : ''}`.trim();
  if (m > 0) return `${m}m ${s > 0 ? `${s}s` : ''}`.trim();
  return `${s}s`;
}

export function formatRelativeDay(dateStr: string): { label: string; sub: string; isToday: boolean; isTomorrow: boolean } {
  if (!dateStr) return { label: '--', sub: '', isToday: false, isTomorrow: false };
  const day = dateStr.split('T')[0];
  const today = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().split('T')[0];

  const isToday = day === today;
  const isTomorrow = day === tomorrow;

  try {
    const [y, m, d] = day.split('-');
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' });
    const formattedDate = `${d}/${m}`;

    if (isToday) {
      return { label: 'Hoje', sub: formattedDate, isToday: true, isTomorrow: false };
    }
    if (isTomorrow) {
      return { label: 'Amanhã', sub: formattedDate, isToday: false, isTomorrow: true };
    }
    return { label: weekday.toUpperCase(), sub: formattedDate, isToday: false, isTomorrow: false };
  } catch {
    return { label: day, sub: '', isToday: false, isTomorrow: false };
  }
}

export function getSportBadge(type: string) {
  const t = (type || '').toLowerCase();
  if (t.includes('mountain') || t.includes('mtb') || t.includes('gravel')) {
    return { label: 'Mountain Bike', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
  }
  if (t.includes('ride') || t.includes('cycling') || t.includes('virtualride') || t.includes('bike')) {
    return { label: 'Ciclismo', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' };
  }
  if (t.includes('run') || t.includes('corrida')) {
    return { label: 'Corrida', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
  }
  if (t.includes('swim') || t.includes('nata')) {
    return { label: 'Natação', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' };
  }
  if (t.includes('weight') || t.includes('gym') || t.includes('muscul') || t.includes('strength')) {
    return { label: 'Força / Musculação', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' };
  }
  return { label: type || 'Treino', color: 'bg-gray-700/40 text-gray-300 border-gray-600/40' };
}
