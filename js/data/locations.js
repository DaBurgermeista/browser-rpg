// js/data/locations.js
// ──────────────────────────────────────────────────────────
// 💡 future‑ready fields you might add per location:
//
//   biome: "forest" | "plains" | "marsh" | …
//   vendors: ["blacksmith", "alchemist"]
//   quests:  ["lost_ring", "bandit_camp"]
//   resources: { fish: true, ore: ["iron","copper"] }
//   ambient:  ["birds_chirping.mp3", "river_loop.ogg"]
//

export const locations = {
  /*──────── Hub ────────*/
  town: {
    name: "Town",
    description: "A bustling little town with everything you need.",
    x: 0,
    y: 0,
    exits: { e: "woods", s: "river", n: "hill" },
    discovered: true,
    isHub: true,
    actions: ["rest", "shop"],
    connections: ["woods", "river", "hill"],
    biome: "settlement",
  },

  /*──────── Forest band ────────*/
  woods: {
    name: "Woods",
    description: "A dense forest full of mystery and creatures.",
    x: 1,
    y: 0,
    exits: { w: "town", e: "clearing" },
    discovered: true,
    actions: ["chop wood", "explore"],
    connections: ["town", "clearing"],
    trees: ["pine"],
    encounters: ["Goblin", "Slime"],
    biome: "forest",
  },
  clearing: {
    name: "Forest Clearing",
    description: "A peaceful opening in the woods—something seems off…",
    x: 2,
    y: 0,
    exits: { w: "woods", s: "mine" },
    discovered: false,
    actions: ["chop wood"],
    connections: ["woods", "mine"],
    trees: ["oak", "ash"],
    encounters: ["Bandit"],
    biome: "forest",
  },

  /*──────── River band ────────*/
  river: {
    name: "Riverside Trail",
    description: "A gentle path along a sparkling river.",
    x: 0,
    y: 1,
    exits: { n: "town", s: "marsh", e: "cave" },
    discovered: true,
    actions: ["explore", "fish"],
    connections: ["town", "marsh", "cave"],
    encounters: ["Slime", "Wolf"],
    requiredLevel: 2,
    biome: "river",
  },
  marsh: {
    name: "Foggy Marsh",
    description: "Thick mist and buzzing insects fill the air.",
    x: 0,
    y: 2,
    exits: { n: "river" },
    discovered: false,
    actions: ["explore"],
    connections: ["river"],
    encounters: ["Slime", "Skeleton"],
    requiredLevel: 3,
    biome: "swamp",
  },
  cave: {
    name: "Mossy Cave",
    description: "Cool damp air wafts from the dark entrance.",
    x: 1,
    y: 1,
    exits: { w: "river", e: "mine" },
    discovered: false,
    actions: ["explore", "fight"],
    connections: ["river", "mine"],
    encounters: ["Goblin", "Skeleton"],
    requiredLevel: 3,
    biome: "cave",
  },
  mine: {
    name: "Abandoned Mine",
    description: "Old tracks and shattered carts litter the tunnels.",
    x: 2,
    y: 1,
    exits: { w: "cave", n: "clearing" },
    discovered: false,
    actions: ["explore", "fight"],
    connections: ["cave", "clearing"],
    encounters: ["Goblin", "Bandit"],
    requiredLevel: 4,
    biome: "underground",
  },

  /*──────── Hill / highland ────────*/
  hill: {
    name: "Windy Hilltop",
    description: "A sweeping view of the lands below.",
    x: 1,
    y: -1,
    exits: { s: "town", e: "outpost" },
    discovered: false,
    actions: ["explore"],
    connections: ["town", "outpost"],
    encounters: ["Wolf"],
    requiredLevel: 2,
    biome: "highland",
  },

  /*──────── Extra sample POIs ────────*/
  /* ★ A tiny guard post to introduce an NPC vendor or quest hub */
  outpost: {
    name: "Frontier Outpost",
    description: "A wooden palisade and a single watch‑tower.",
    x: 2,
    y: -1,
    exits: { w: "hill" },
    discovered: false,
    actions: ["rest", "shop", "explore"],
    connections: ["hill"],
    encounters: ["Bandit"],
    requiredLevel: 3,
    biome: "highland",
  },

  /* ★ A boss arena you might unlock after a quest */
  grove: {
    name: "Ancient Grove",
    description: "Silent stones circle an ancient oak radiating power.",
    x: 3,
    y: 0,
    exits: { w: "clearing" },
    discovered: false,
    actions: ["explore", "fight"],
    connections: ["clearing"],
    encounters: ["Dark Mage", "Ent"],
    requiredLevel: 5,
    biome: "forest",
    requiredDiscovery: "clearing",
  },
};
