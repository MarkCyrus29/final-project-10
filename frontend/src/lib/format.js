export const formatPrice = (n) => `₱${Number(n ?? 0).toLocaleString('en-US')}`;

export const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const formatShortDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
};

export const formatDuration = (depIso, arrIso) => {
  if (!depIso || !arrIso) return '';
  const dep = new Date(depIso);
  const arr = new Date(arrIso);
  const diffMs = Math.max(0, arr - dep);
  const totalMins = Math.round(diffMs / (1000 * 60));
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0 && mins === 0) return `${hrs}h`;
  return `${mins}m`;
};

export const plural = (n, singular, pluralForm = singular + 's') =>
  `${n} ${n === 1 ? singular : pluralForm}`;
