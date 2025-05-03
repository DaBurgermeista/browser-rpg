// locations.js

window.locations = {
  town: {
    name: "Town",
    description: "A bustling little town with everything you need.",
    discovered: true,
    isHub: true,
    actions: ["rest", "shop"],
    connections: ["woods"]
  },
  woods: {
    name: "Woods",
    description: "A dense forest full of mystery and creatures.",
    discovered: true,
    isHub: false,
    actions: ["chop wood", "explore"],
    connections: ["town", "clearing"],
    trees: ["pine"],
    requiredLevel: 2
  },
  clearing: {
    name: "Forest Clearing",
    description: "A peaceful opening in the woods, something seems off...",
    discovered: false,
    isHub: false,
    actions: ["chop wood"],
    connections: ["woods"],
    trees: ["oak", "ash"],
    requiredDiscovery: "woods"
  }
};
