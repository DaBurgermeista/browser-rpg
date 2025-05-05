// js/data/lootTables.js

import { items } from "./items.js";

export const lootTables = {
  goblinBasic: [
    { coins: [1, 5], weight: 6 },
    { item: "Pine Log", weight: 2 },
    { item: "Rusty Dagger", weight: 1 },
    { nothing: true, weight: 1 },
  ],
  wolfFur: [
    { item: "Pine Log", weight: 5 },
    { item: "Leather Vest", weight: 1 },
  ],
  slimeBasic: [
    { coins: [1, 3], weight: 5 },
    { item: "Pine Log", weight: 2 },
    { nothing: true, weight: 3 },
  ],
  banditCache: [
    { nothing: true, weight: 2 },
    { coins: [4, 10], weight: 6 },
    { item: "Oak Log", weight: 3 },
    { item: "Iron Sword", weight: 2 },
    { item: "Agile Band", weight: 1 },
  ],
  bossDragon: [
    { coins: [60, 100], weight: 4 },
    { item: "Ash Log", weight: 4 },
    { item: "Iron Sword", weight: 3 },
    { item: "Agile Band", weight: 2 },
  ],
};
