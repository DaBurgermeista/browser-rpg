// locations.js

window.locations = {
  town: {
    name: "Town Square",
    description: "A peaceful village hub with shops and taverns.",
    actions: ["rest", "shop"],
  },
  woods: {
    name: "Whispering Woods",
    description: "Dense forest filled with wild creatures.",
    actions: ["explore", "fight", "chop wood"],
    encounters: ["Slime", "Wolf", "Bandit"],
  },
  dungeon: {
    name: "Forgotten Crypt",
    description: "A dangerous, dark place crawling with monsters.",
    actions: ["fight"],
    encounters: ["Skeleton", "Dark Mage"],
  },
};
