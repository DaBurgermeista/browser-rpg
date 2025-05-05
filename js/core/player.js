// js/core/player.js

import { items } from "../data/items.js";
import { log, updateUI, renderSkillTab } from "../systems/ui.js";

export const player = {
  hp: 100,
  maxHp: 100,
  level: 1,
  xp: 0,
  xpToNext: 50,
  copper: 0,
  regen: 0.2,
  regenBuffer: 0,
  alive: true,
  strength: 5,
  dexterity: 5,
  constitution: 5,
  baseAttackSpeed: 2000,
  attackSpeed: 2000,
  baseDamage: 5,
  equipment: {
    weapon: null,
    offhand: null,
    armor: null,
    helmet: null,
    gloves: null,
    boots: null,
    accessory: null,
    belt: null,
    cloak: null,
  },
  inventory: [
    { item: items["Rusty Dagger"], quantity: 1 },
    { item: items["Tattered Cloak"], quantity: 1 },
    { item: items["Lucky Coin"], quantity: 1 },
  ],
};

export const playerSkills = {
  woodcutting: {
    xp: 0,
    totalXp: 0,
    level: 1,
    xpToNext: 83,
  },
};

export function checkLevelUp() {
  while (player.xp >= player.xpToNext) {
    player.xp -= player.xpToNext;
    player.level++;
    player.xpToNext = Math.floor(player.xpToNext * 1.5);

    const hpGain = 5 + Math.floor(player.constitution * 1.5);
    player.maxHp += hpGain;
    player.hp = player.maxHp;

    player.strength += 1;
    player.dexterity += 1;
    log(`✨ You leveled up to level ${player.level}! Stats increased.`);
    updateUI();
  }
}

export function xpToNextLevel(){
  return 10 + player.level * 5;
}

export function addSkillXp(skill, amount) {
  const skillObj = playerSkills[skill];
  skillObj.xp += amount;
  skillObj.totalXp += amount;

  // Determine current level before assigning
  const oldLevel = skillObj.level;
  const newLevel = getSkillLevel(skill);

  if (newLevel > oldLevel) {
    skillObj.level = newLevel;
    skillObj.xp = 0; // Reset XP for next level
    log(`🪓 Your ${skill} level is now ${newLevel}!`);
  }

  // Calculate XP required for next level (from current level to +1)
  let totalXp = 0;
  for (let i = 1; i < newLevel + 1; i++) {
    totalXp += Math.floor(i + 300 * Math.pow(2, i / 7));
  }

  skillObj.xpToNext = Math.floor(totalXp / 4 - skillObj.xp);
  renderSkillTab();
}

export function getSkillLevel(skill) {
  const xp = playerSkills[skill].totalXp;
  let level = 1;
  let totalXp = 0;

  for (let i = 1; i <= 99; i++) {
    totalXp += Math.floor(i + 300 * Math.pow(2, i / 7));
    const scaledXp = Math.floor(totalXp / 4);

    if (xp < scaledXp) return level;
    level = i + 1;
  }

  return level;
}

export function applyEquipmentBonuses() {
  player.strength = 5;
  player.dexterity = 5;
  player.regen = 0.2;

  for (let slot in player.equipment) {
    const item = player.equipment[slot];
    if (item?.bonuses) {
      for (let stat in item.bonuses) {
        player[stat] += item.bonuses[stat];
      }
    }
  }
}

export function calculateAttackSpeed(player) {
  const dexBonus = player.dexterity * 20;
  const itemBonus = player.equipment.weapon?.bonuses?.attackSpeed || 0;
  const result = player.baseAttackSpeed - dexBonus + itemBonus;
  return Math.max(400, result);
}