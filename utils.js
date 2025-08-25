function clamp(n, min, max){
  return Math.max(min, Math.min(max, n));
}
function clampDay(d){
  return clamp(Number(d) || 1, 1, 28);
}
function nextMonthlyDateFrom(day, fromISO){
  const d = clampDay(day);
  const ref = fromISO ? new Date(fromISO) : new Date();
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const cand = new Date(y, m, d);
  const ref0 = new Date(ref.toDateString());
  const out = (cand >= ref0 ? cand : new Date(y, m + 1, d));
  return out.toISOString().slice(0, 10);
}
if (typeof module !== 'undefined'){
  module.exports = {clamp, clampDay, nextMonthlyDateFrom};
}
if (typeof window !== 'undefined'){
  window.clamp = clamp;
  window.clampDay = clampDay;
  window.nextMonthlyDateFrom = nextMonthlyDateFrom;
}
