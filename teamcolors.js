// Team colors: TEAM_COLORS[abbr] = [primary, secondary].
// The primary is the color that dominates the team's logo and fills the team's block;
// the secondary letters the block on the matchup page. teamColors() derives readable
// versions of both for the dark page and for print.
const TEAM_COLORS = {
  ARI: ["#97233F", "#000000"], ATL: ["#A71930", "#000000"], BAL: ["#241773", "#9E7C0C"], BUF: ["#00338D", "#C60C30"],
  CAR: ["#0085CA", "#101820"], CHI: ["#C83803", "#0B162A"], CIN: ["#FB4F14", "#000000"], CLE: ["#FF3C00", "#311D00"],
  DAL: ["#003594", "#869397"], DEN: ["#FB4F14", "#002244"], DET: ["#0076B6", "#B0B7BC"], GB: ["#203731", "#FFB612"],
  HOU: ["#A71930", "#03202F"], IND: ["#002C5F", "#FFFFFF"], JAX: ["#006778", "#D7A22A"], KC: ["#E31837", "#FFB81C"],
  LV: ["#A5ACAF", "#000000"], LAC: ["#0080C6", "#FFC20E"], LA: ["#003594", "#FFA300"], LAR: ["#003594", "#FFA300"],
  MIA: ["#008E97", "#FC4C02"], MIN: ["#4F2683", "#FFC62F"], NE: ["#C60C30", "#002244"], NO: ["#D3BC8D", "#101820"],
  NYG: ["#0B2265", "#A71930"], NYJ: ["#125740", "#FFFFFF"], PHI: ["#004C54", "#A5ACAF"], PIT: ["#FFB612", "#101820"],
  SF: ["#AA0000", "#B3995D"], SEA: ["#69BE28", "#002244"], TB: ["#D50A0A", "#34302B"], TEN: ["#4B92DB", "#0C2340"],
  WAS: ["#5A1414", "#FFB612"],
};
const TC_FALLBACK = ["#3A3F47", "#F2F1EE"];   // a team the table doesn't know
const TC_PANEL = "#1b1d21", TC_PAPER = "#ffffff", TC_DARK = "#111214";

function tcRgb(hex) {
  const h = hex.replace("#", "");
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
}
function tcLum(hex) {
  const [r, g, b] = tcRgb(hex).map(c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function tcContrast(a, b) {
  const x = tcLum(a), y = tcLum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
function tcHsl(hex) {
  const [r, g, b] = tcRgb(hex), max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  if (!d) return [0, 0, l];
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}
function tcHex(h, s, l) {
  const f = (p, q, t) => {
    t = (t + 1) % 1;
    return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const rgb = s ? [f(p, q, h + 1 / 3), f(p, q, h), f(p, q, h - 1 / 3)] : [l, l, l];
  return "#" + rgb.map(v => Math.round(v * 255).toString(16).padStart(2, "0")).join("");
}
// The same hue, made lighter (dir 1), darker (dir -1) or whichever is closer (dir 0)
// until it reads against bg.
function tcReadable(hex, bg, floor, dir) {
  if (tcContrast(hex, bg) >= floor) return hex;
  const [h, s, l] = tcHsl(hex);
  for (let step = 1; step <= 100; step++) {
    for (const d of dir ? [dir] : [1, -1]) {
      const x = l + (d * step) / 100;
      if (x < 0 || x > 1) continue;
      const c = tcHex(h, s, x);
      if (tcContrast(c, bg) >= floor) return c;
    }
  }
  return tcContrast("#ffffff", bg) >= tcContrast(TC_DARK, bg) ? "#ffffff" : TC_DARK;
}

const TC_CACHE = {};
// bg: the block's fill. on: black or white lettering on it. on2: the secondary color as
// lettering on it. ink: the team color as text, bars and dials on the dark page.
// inkp: the same for print.
function teamColors(key) {
  if (TC_CACHE[key]) return TC_CACHE[key];
  const [bg, sec] = TEAM_COLORS[key] || TC_FALLBACK;
  const on = tcContrast("#ffffff", bg) >= tcContrast(TC_DARK, bg) ? "#ffffff" : TC_DARK;
  const on2 = sec ? tcReadable(sec, bg, 4.5, 0) : on;
  // a black or gray primary with a colorful secondary: the secondary carries the team on the page
  const base = tcHsl(bg)[1] < 0.15 && sec && tcHsl(sec)[1] > 0.3 ? sec : bg;
  return (TC_CACHE[key] = {
    bg, on, on2,
    ink: tcReadable(base, TC_PANEL, 4.6, 1),
    inkp: tcReadable(base, TC_PAPER, 4.5, -1),
  });
}
// Inline custom properties for an element that shows one team.
function teamVars(key) {
  const c = teamColors(key);
  return `--tc:${c.bg};--tc-on:${c.on};--tc-on2:${c.on2};--tc-ink:${c.ink};--tc-inkp:${c.inkp}`;
}
// The team's block: its abbreviation on its color. two = letter it in the secondary color.
function slabHtml(abbr, key, two) {
  const a = String(abbr || "");
  return `<span class="slab${two ? " two" : ""}${a.length > 4 ? " long" : ""}" style="${teamVars(key)}">${a.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</span>`;
}
