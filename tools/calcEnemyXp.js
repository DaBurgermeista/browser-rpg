// tools/calcEnemyXp.js
import { enemies } from "../js/data/enemies.js";
import fs from "fs";

// tune coefficient here
const COEFF = 0.25;

enemies.forEach(e => {
  const avg = (e.minDamage + e.maxDamage) / 2;
  const diff = e.hp + avg * 5;
  e.xp = Math.round(diff * COEFF);
});

const file = "../js/data/enemies.js";
const output =
  "export const enemies = " +
  JSON.stringify(enemies, null, 2) +
  ";\n";

fs.writeFileSync(file, output);
console.log("✨  enemies.js updated with XP values");
