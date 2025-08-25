/**
 * Clamp a day-of-month value to the safe range of 1–28.
 *
 * The maximum of 28 avoids dealing with months that have fewer than
 * 31 days (e.g. February). Non-numeric or out-of-range input is coerced
 * into the valid range.
 *
 * @param {number|string} d - Day of month to clamp. Falsy or
 *   non-numeric values default to `1`.
 * @returns {number} Integer between `1` and `28` inclusive.
 */
function clampDay(d){
  // Limit the day so later date calculations never exceed month lengths.
  return Math.max(1, Math.min(28, Number(d) || 1));
}

/**
 * Calculate the next occurrence of a given day-of-month.
 *
 * The provided `day` is clamped to the 1–28 range to prevent invalid
 * dates. If the day has not yet occurred in the reference month, the
 * resulting date falls within the same month. Otherwise, it rolls over
 * to the next month (and year, if necessary).
 *
 * @param {number|string} day - Desired day of the month. Clamped to 1–28.
 * @param {string} [fromISO] - Reference date in ISO format (`YYYY-MM-DD`)
 *   or any value accepted by the `Date` constructor. Defaults to today.
 * @returns {string} ISO date string in `YYYY-MM-DD` format representing
 *   the next occurrence of the clamped day.
 */
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
  // toISOString().slice(0, 10) returns a YYYY-MM-DD string.
  return out.toISOString().slice(0, 10);
}
if (typeof module !== 'undefined'){
  module.exports = {clampDay, nextMonthlyDateFrom};
}
if (typeof window !== 'undefined'){
  window.clampDay = clampDay;
  window.nextMonthlyDateFrom = nextMonthlyDateFrom;
}
