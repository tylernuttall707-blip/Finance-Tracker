function clampDay(d){
  return Math.max(1, Math.min(28, Number(d) || 1));
}
function nextMonthlyDateFrom(day, fromISO){
  const d = clampDay(day);
  let ref = fromISO ? new Date(fromISO) : new Date();
  if (fromISO && isNaN(ref.getTime())){
    throw new Error(`Invalid date string: ${fromISO}`);
  }
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const cand = new Date(y, m, d);
  const ref0 = new Date(ref.toDateString());
  const out = (cand >= ref0 ? cand : new Date(y, m + 1, d));
  return out.toISOString().slice(0, 10);
}
if (typeof module !== 'undefined'){
  module.exports = {clampDay, nextMonthlyDateFrom};
}
if (typeof window !== 'undefined'){
  window.clampDay = clampDay;
  window.nextMonthlyDateFrom = nextMonthlyDateFrom;
}
