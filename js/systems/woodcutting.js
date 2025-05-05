// js/systems/woodcutting.js

import { player, addSkillXp, getSkillLevel } from "../core/player.js";
import { items } from "../data/items.js";
import { locations } from "../data/locations.js";
import { log, updateUI, renderLocationUI, unlockLocation } from "./ui.js";
import { currentLocation } from "../core/state.js";
import { capitalize } from "./utils.js";

// --- module-scoped state ---
let woodcuttingInterval = null;
let isChopping = false;
let currentTree = null;

// Tree types with required levels and log rewards
export const treeTypes = {
  pine: {
    name: "Pine",
    requiredLevel: 1,
    stages: [
      "You steady your axe against the pine bark.",
      "You make a clean cut into the soft wood.",
      "Sap leaks from the tree as you continue chopping.",
      "The tree begins to lean...",
      "A loud crack echoes through the woods.",
    ],
    xpPerStage: 5,
    rewardItem: "Pine Log",
  },
  oak: {
    name: "Oak",
    requiredLevel: 5,
    stages: [
      "You grip your axe tightly against the oak.",
      "You swing hard, but the oak resists.",
      "The tree shakes as you dig deeper.",
      "A loud crack echoes through the woods.",
      "The oak begins to splinter...",
    ],
    xpPerStage: 8,
    rewardItem: "Oak Log",
  },
  //TODO Add more trees later...
};

export function stopWoodcutting() {
  if (!isChopping) return;

  clearInterval(woodcuttingInterval);
  woodcuttingInterval = null;
  isChopping = false;
  // Store the key before clearing currentTree
  const treeKeyBeforeStop = currentTree?.key;
  currentTree = null;
  log("You stop chopping wood.");

  renderLocationUI();
  updateUI();
}

export function startNewTree() {
  const loc = locations[currentLocation];
  const availableTrees = loc.trees || [];

  const eligibleTrees = availableTrees.filter(
    (key) => getSkillLevel("woodcutting") >= treeTypes[key].requiredLevel,
  );

  if (eligibleTrees.length === 0) {
    log("You don't have the skill to chop any trees here.");
    stopWoodcutting();
    return;
  }

  const chosenKey =
    eligibleTrees[Math.floor(Math.random() * eligibleTrees.length)];
  const chosenTree = treeTypes[chosenKey];

  currentTree = {
    key: chosenKey,
    type: chosenTree,
    stage: 0,
    totalStages: chosenTree.stages.length,
  };
}

export function toggleWoodcutting(treeKey) {
  const btn = document.querySelector("#locationActions button.chop-button");

  if (isChopping) {
    stopWoodcutting();
    if (btn) btn.textContent = "Chop Wood";
    return;
  }

  // Prevent multiple intervals just in case
  stopWoodcutting();

  log("You grip your axe and face the tree...");
  isChopping = true;
  currentTree = {
    key: treeKey,
    type: treeTypes[treeKey],
    stage: 0,
    totalStages: treeTypes[treeKey].stages.length,
  };
  if (btn) btn.textContent = "Stop Chopping";

  woodcuttingInterval = setInterval(() => {
    if (!isChopping || !currentTree) {
      stopWoodcutting();
      return;
    }

    // Calculate failure chance based on player level vs required level
    const playerLevel = getSkillLevel("woodcutting");
    const requiredLevel = currentTree.type.requiredLevel;
    const levelDiff = Math.max(0, requiredLevel - playerLevel);
    let failChance = 0.25 - (playerLevel - requiredLevel) * 0.01;
    failChance = Math.max(0.05, Math.min(0.25, failChance)); // clamp between 5% and 25%

    if (Math.random() < failChance) {
      log("You swing and miss. The tree remains untouched.");
      return;
    }

    const stage = currentTree.stage++;
    addSkillXp("woodcutting", currentTree.type.xpPerStage);

    if (stage < currentTree.totalStages) {
      log(
        currentTree.type.stages[Math.min(stage, currentTree.totalStages - 1)],
      );
    } else {
      // Give log item reward instead of copper
      const rewardItemKey = currentTree.type.rewardItem;
      const rewardItem = items[rewardItemKey];
      if (rewardItem) {
        // Add or increment item in inventory
        const existing = player.inventory.find((i) => i.item === rewardItem);
        if (existing) {
          existing.quantity++;
        } else {
          player.inventory.push({ item: rewardItem, quantity: 1 });
        }
        log(
          `🪓 You collect 1 ${rewardItem.name} from the fallen ${currentTree.type.name} tree.`,
        );
      } else {
        log("The tree falls, but you find nothing worth keeping.");
      }
      currentTree = null;

      if (currentLocation === "woods" && !locations["clearing"].discovered) {
        if (Math.random() < 0.05) unlockLocation("clearing");
      }

      startNewTree();
    }

    updateUI();
  }, 2000);
}
