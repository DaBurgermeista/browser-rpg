// js/data/items.js

export const items = {
  "Rusty Dagger": {
    name: "Rusty Dagger",
    slot: "weapon",
    description: "A dull dagger that still gets the job done.",
    bonuses: {
      attackSpeed: -300,
      dexterity: +1,
      damageRange: [5, 10],
    },
    value: 5,
    rarity: "common"
  },
  "Tattered Cloak": {
    name: "Tattered Cloak",
    slot: "armor",
    description: "Barely held together, but offers some warmth.",
    bonuses: {
      regen: +0.1,
    },
  },
  "Lucky Coin": {
    name: "Lucky Coin",
    slot: "accessory",
    description: "An old coin said to bring fortune in combat.",
    bonuses: {
      dexterity: +2,
    },
  },
  // NEW ITEMS BELOW
  "Iron Sword": {
    name: "Iron Sword",
    slot: "weapon",
    description: "A dependable blade used by foot soldiers.",
    bonuses: {
      damageRange: [8, 14],
      strength: +1,
    },
  },
  "Leather Vest": {
    name: "Leather Vest",
    slot: "armor",
    description: "Offers modest protection without sacrificing movement.",
    bonuses: {
      regen: +0.15,
      strength: +1,
    },
  },
  "Agile Band": {
    name: "Agile Band",
    slot: "accessory",
    description: "A thin ring that hums with subtle energy.",
    bonuses: {
      dexterity: +3,
      attackSpeed: -200,
    },
  },
  "Pine Log": {
    name: "Pine Log",
    slot: "material",
    description: "A softwood log useful for crafting or selling.",
    value: 3
  },
  "Oak Log": {
    name: "Oak Log",
    slot: "material",
    description: "A sturdy log cut from an oak tree.",
    value: 6
  },
  "Ash Log": {
    name: "Ash Log",
    slot: "material",
    description: "A dense log with flexible grain, ideal for toolmaking.",
    value: 9
  }
};
