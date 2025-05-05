// js/systems/utils.js

// utils.js
export function rarityColor(raw) {
  if (!raw) return "#e5e5e5"; // undefined / null guard
  const r = String(raw).toLowerCase(); // normalise
  switch (r) {
    case "common":
      return "#e5e5e5"; // or whatever neutral colour you prefer
    case "uncommon":
      return "#22c55e"; // green
    case "rare":
      return "#60a5fa"; // blue
    case "epic":
      return "#c084fc"; // purple
    default:
      return "#e5e5e5"; // fallback
  }
}

export function itemLink(key, item) {
  return `<span class="item-link rarity-${item.rarity}" data-item="${key}">${item.name}</span>`;
}

export function weightedRandom(table) {
  const total = table.reduce((acc, entry) => acc + entry.weight, 0);
  let roll = Math.random() * total;

  for (const entry of table) {
    roll -= entry.weight;
    if (roll <= 0) return entry;
  }
  return null;
}

export function getSpeedLabel(ms) {
  if (ms > 2000) return "Very Slow";
  if (ms > 1600) return "Slow";
  if (ms > 1200) return "Average";
  if (ms > 800) return "Fast";
  return "Very Fast";
}

export function formatCurrency(cp) {
  const gp = Math.floor(cp / 10000);
  const sp = Math.floor((cp % 10000) / 100);
  const copper = cp % 100;
  const parts = [];
  if (gp) parts.push(`${gp} gp`);
  if (sp) parts.push(`${sp} sp`);
  if (copper || parts.length === 0) parts.push(`${copper} cp`);
  return parts.join(", ");
}

export function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
