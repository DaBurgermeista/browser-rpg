// js/systems/combat.js
import { player, checkLevelUp } from "../core/player.js";
import { enemies } from "../data/enemies.js";
import { log, updateUI, renderLocationUI } from "./ui.js";
import {
  formatCurrency,
  rarityColor,
  weightedRandom,
  itemLink,
} from "./utils.js";
import { stopWoodcutting } from "./woodcutting.js";
import { setLocation } from "../core/state.js";
import { lootTables } from "../data/lootTables.js";
import { items } from "../data/items.js";

const status = document.getElementById("status");

export function startCombat(enemy) {
  let playerTimer = 0;
  let enemyTimer = 0;
  const interval = 100;

  const header = document.createElement("div");
  header.textContent = `A ${enemy.name} appears!`;
  header.style.color = "#facc15";
  header.style.marginTop = "1rem";
  header.style.borderTop = "1px solid #666";
  header.style.paddingTop = "0.5rem";
  header.style.fontWeight = "bold";
  status.appendChild(header);
  status.scrollTop = status.scrollHeight;

  document.getElementById("enemyHealthBarContainer").style.display = "block";
  updateEnemyHealthBar(enemy);

  const combatLoop = setInterval(() => {
    if (player.hp <= 0) {
      player.alive = false;
      clearInterval(combatLoop);
      log("💀 You died! Respawning in town…");
      setTimeout(() => {
        Object.assign(player, {
          hp: player.maxHp,
          copper: Math.max(0, player.copper - 50),
        });
        stopWoodcutting();
        setLocation("town");
        player.alive = true;
        renderLocationUI();
        updateUI();
      }, 3000);
      return;
    }

    playerTimer += interval;
    if (playerTimer >= player.attackSpeed) {
      playerTimer = 0;
      const dmg = getPlayerDamage();
      enemy.currentHp -= dmg;
      updateEnemyHealthBar(enemy);
      log(
        `You strike the ${enemy.name} for ${dmg} damage! (${Math.max(
          0,
          enemy.currentHp,
        )} HP left)`,
      );
    }

    enemyTimer += interval;
    if (enemyTimer >= enemy.attackInterval) {
      enemyTimer = 0;
      const dmg =
        Math.floor(Math.random() * (enemy.maxDamage - enemy.minDamage + 1)) +
        enemy.minDamage;
      player.hp -= dmg;
      if (player.hp < 0) player.hp = 0;
      log(`The ${enemy.name} hits you for ${dmg} damage.`);
      updateUI();
    }

    if (enemy.currentHp <= 0) {
      clearInterval(combatLoop);
      const xpGain = enemy.xp ?? 10;
      player.xp += xpGain;
      document.getElementById("enemyHealthBarContainer").style.display = "none";
      log(`You defeated the ${enemy.name}! +${xpGain} XP`);

      if (enemy.loot && lootTables[enemy.loot]) {
        const drop = weightedRandom(lootTables[enemy.loot]);

        if (drop?.coins) {
          const [min, max] = drop.coins;
          const coins = Math.floor(Math.random() * (max - min + 1)) + min;
          player.copper += coins;
          log(`You found ${formatCurrency(coins)}!`);
        } else if (drop?.item) {
          const item = items[drop.item];
          if (item) {
            const color = rarityColor(item.rarity);
            const existing = player.inventory.find((i) => i.item === item);
            existing
              ? existing.quantity++
              : player.inventory.push({ item, quantity: 1 });
            log(`You found ${itemLink(drop.item, item)}!`);
          }
        } else {
          log("You found nothing of value.");
        }
      }
      checkLevelUp();
      updateUI();
    }
  }, interval);
}

export function getPlayerDamage() {
  const weapon = player.equipment.weapon;
  let dmg = Math.floor(Math.random() * 6) + 5;
  if (weapon?.bonuses?.damageRange) {
    const [min, max] = weapon.bonuses.damageRange;
    dmg = Math.floor(Math.random() * (max - min + 1)) + min;
  }
  dmg += Math.floor(player.strength / 2);
  return dmg;
}

export function updateEnemyHealthBar(enemy) {
  const pct = Math.floor((enemy.currentHp / enemy.hp) * 100);
  document.getElementById("enemyHealthBar").style.width = `${pct}%`;
  document.getElementById("enemyHpText").textContent =
    `${Math.max(0, enemy.currentHp)} / ${enemy.hp}`;
}
