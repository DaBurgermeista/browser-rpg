// js/systems/utils.js

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

export const rand = (arr) => arr[Math.floor(Math.random() * arr.length)]