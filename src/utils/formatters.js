const MONTHS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

/**
 * Format a Date object into DD-MMM-YYYY (e.g., 26-NOV-2026)
 */
export function formatDateDDMMMYYYY(dateObj = new Date()) {
  const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
  if (Number.isNaN(d.getTime())) {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, '0')}-${MONTHS[now.getMonth()]}-${now.getFullYear()}`;
  }
  const day = String(d.getDate()).padStart(2, '0');
  const mon = MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${mon}-${year}`;
}

/**
 * Format a numeric value using Indian Numbering System (e.g., 90,000 or 11,250)
 */
export function formatINR(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  return Math.round(num).toLocaleString('en-IN');
}

/**
 * Calculate 8-gram (1 Pavan) change from 1-gram change
 */
export function calculatePavanChange(change1g) {
  const num = Math.abs(Number(change1g) || 0);
  return Math.round(num * 8);
}

/**
 * Generate exact Malayalam status text from 1g change and trend.
 * UP:        "സ്വർണ്ണ വില പവന് ₹{pavan_change} രൂപ കൂടി"
 * DOWN:      "സ്വർണ്ണ വില പവന് ₹{pavan_change} രൂപ കുറഞ്ഞു"
 * UNCHANGED: "ഇന്ന് സ്വർണ്ണ വിലയിൽ മാറ്റമില്ല"
 */
export function buildMalayalamStatusText(change1g, trend) {
  const pavanChange = calculatePavanChange(change1g);
  const formatted = formatINR(pavanChange);

  if (trend === 'UP' && pavanChange > 0) {
    return `സ്വർണ്ണ വില പവന് ₹${formatted} രൂപ കൂടി`;
  }
  if (trend === 'DOWN' && pavanChange > 0) {
    return `സ്വർണ്ണ വില പവന് ₹${formatted} രൂപ കുറഞ്ഞു`;
  }
  return 'ഇന്ന് സ്വർണ്ണ വിലയിൽ മാറ്റമില്ല';
}

/**
 * Deterministic daily index picker based on date string so "Auto-Pick Random Ornament"
 * selects a fresh ornament each day consistently across refreshes.
 */
export function pickDailyOrnament(ornaments, dateStr, salt = 0) {
  if (!Array.isArray(ornaments) || ornaments.length === 0) return null;
  const seedStr = `${dateStr || formatDateDDMMMYYYY()}-${salt}`;
  let hash = 2166136261;
  for (let i = 0; i < seedStr.length; i += 1) {
    hash ^= seedStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const idx = Math.abs(hash) % ornaments.length;
  return ornaments[idx];
}

/**
 * Sanitize filename segment from date string
 */
export function sanitizeDateForFilename(dateStr) {
  return String(dateStr || formatDateDDMMMYYYY())
    .trim()
    .replace(/[^a-zA-Z0-9-]+/g, '-');
}
