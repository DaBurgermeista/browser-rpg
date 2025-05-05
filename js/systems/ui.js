// js/systems/ui.js

import { locations } from "../data/locations.js";
import { enemies } from "../data/enemies.js";
import { formatCurrency, getSpeedLabel, capitalize } from "./utils.js";
import {
  player,
  playerSkills,
  applyEquipmentBonuses,
  calculateAttackSpeed,
  getSkillLevel,
} from "../core/player.js";
import { currentLocation, setLocation } from "../core/state.js";
// wood-related helpers
import {
  treeTypes,
  toggleWoodcutting,
  stopWoodcutting,
} from "./woodcutting.js";
// Combat entry point
import { startCombat } from "./combat.js";

// ---------- DOM short-cuts -----------
const currencyDisplay = document.getElementById("currency");
const strDisplay = document.getElementById("statStr");
const dexDisplay = document.getElementById("statDex");
const apsLabel = document.getElementById("apsLabel");
const status = document.getElementById("status");
const tooltip = document.getElementById("tooltip");
const locationSelect = document.getElementById("locationSelect");

export function updateUI() {
  document.getElementById("level").textContent = player.level;
  document.getElementById("xp").textContent = player.xp;
  document.getElementById("xpToNext").textContent = player.xpToNext;
  const xpPct = Math.floor((player.xp / player.xpToNext) * 100);
  document.getElementById("compactXpText").textContent =
    `XP: ${player.xp} / ${player.xpToNext}`;

  const xpBar = document.getElementById("compactPlayerXpBar");
  if (xpBar) {
    xpBar.style.width = `${xpPct}%`;
  }
  document.getElementById("statCon").textContent =
    player.constitution.toFixed(3);
  player.attackSpeed = calculateAttackSpeed(player);

  const hpPct = Math.floor((player.hp / player.maxHp) * 100);
  document.getElementById("compactHpText").textContent =
    `HP: ${Math.floor(player.hp)} / ${player.maxHp}`;
  document.getElementById("compactPlayerHealthBar").style.width = `${hpPct}%`;
  const compactPct = Math.floor((player.hp / player.maxHp) * 100);
  const compactBar = document.getElementById("compactPlayerHealthBar");
  if (compactBar) {
    compactBar.style.width = `${compactPct}%`;
  }

  const hpDisplay = document.getElementById("hp");
  if (hpDisplay) {
    hpDisplay.textContent = Math.floor(player.hp);
  }

  currencyDisplay.textContent = formatCurrency(player.copper);
  strDisplay.textContent = player.strength.toFixed(3);
  dexDisplay.textContent = player.dexterity.toFixed(3);
  apsLabel.textContent = getSpeedLabel(player.attackSpeed);

  // Player bar
  const pct = Math.floor((player.hp / player.maxHp) * 100);
  const bar = document.getElementById("playerHealthBar");
  const hpText = document.getElementById("playerHpText");
  if (bar) bar.style.width = `${pct}%`;
  if (hpText) hpText.textContent = `${Math.floor(player.hp)} / ${player.maxHp}`;

  renderInventory();
  renderEquipmentTab();
}

export function log(message) {
  const entry = document.createElement("div");
  entry.textContent = message;
  status.appendChild(entry);
  status.scrollTop = status.scrollHeight;
}

export function getItemTooltip(item) {
  let tooltip = `<strong class="tooltip-title">${item.name}</strong><br>${item.description}<br>`;
  const bonuses = item.bonuses || {};

  if (bonuses.damageRange) {
    const [min, max] = bonuses.damageRange;
    const strBonus = Math.floor(player.strength / 2);
    tooltip += `<span class="bonus">Damage: ${min}-${max} + ${strBonus} STR bonus</span><br>`;
  }

  for (const [key, value] of Object.entries(bonuses)) {
    if (key !== "damageRange") {
      tooltip += `<span class="bonus">+${value} ${capitalize(key)}</span><br>`;
    }
  }
  tooltip += `<em class="tooltip-sub">Type: ${item.slot.toUpperCase()}</em><br>`;
  return tooltip;
}

export function showTooltip(text, x, y) {
  tooltip.innerHTML = text;
  tooltip.style.display = "block";
  // Positioning logic with overflow protection and above-cursor display
  requestAnimationFrame(() => {
    const tooltipRect = tooltip.getBoundingClientRect();
    let adjustedX = x + 10;
    let adjustedY = y - tooltipRect.height - 10;

    // Prevent overflow to the right
    if (adjustedX + tooltipRect.width > window.innerWidth) {
      adjustedX = window.innerWidth - tooltipRect.width - 10;
    }
    // Prevent overflow above
    if (adjustedY < 0) {
      adjustedY = y + 10; // fallback to below cursor
    }

    tooltip.style.left = adjustedX + "px";
    tooltip.style.top = adjustedY + "px";
  });
}

export function hideTooltip() {
  tooltip.style.display = "none";
}

// Render equipment tab: show equipped items with inventory-item style and tooltips
export function renderEquipmentTab() {
  const equipmentDiv = document.getElementById("equipmentDisplay");
  if (!equipmentDiv) return;

  equipmentDiv.innerHTML = "";

  for (const slot of [
    "weapon",
    "offhand",
    "armor",
    "helmet",
    "gloves",
    "boots",
    "accessory",
    "belt",
    "cloak",
  ]) {
    const item = player.equipment[slot];
    const itemDiv = document.createElement("div");
    itemDiv.classList.add("inventory-item");

    if (item) {
      itemDiv.textContent = item.name;
      itemDiv.onmouseover = (e) =>
        showTooltip(getItemTooltip(item), e.clientX, e.clientY - 20);
      itemDiv.onmousemove = (e) =>
        showTooltip(getItemTooltip(item), e.clientX, e.clientY - 20);
      itemDiv.onmouseleave = hideTooltip;
      itemDiv.onclick = () => {
        // Unequip the item
        const equippedItem = player.equipment[slot];
        if (equippedItem) {
          const existing = player.inventory.find(
            (i) => i.item === equippedItem,
          );
          if (existing) {
            existing.quantity++;
          } else {
            player.inventory.push({ item: equippedItem, quantity: 1 });
          }
          player.equipment[slot] = null;
          applyEquipmentBonuses();
          updateUI();
        }
      };
    } else {
      itemDiv.textContent = `${capitalize(slot)}: None`;
      itemDiv.classList.add("empty-slot");
    }

    equipmentDiv.appendChild(itemDiv);
  }
}

export function renderInventory() {
  const inventoryDiv = document.getElementById("inventory");
  inventoryDiv.innerHTML = "";

  player.inventory.forEach(({ item, quantity }, index) => {
    const itemDiv = document.createElement("div");
    itemDiv.classList.add("inventory-item");
    itemDiv.textContent =
      quantity > 1 ? `${item.name} (x${quantity})` : item.name;
    itemDiv.onmouseover = (e) =>
      showTooltip(getItemTooltip(item), e.clientX, e.clientY - 20);
    itemDiv.onmousemove = (e) =>
      showTooltip(getItemTooltip(item), e.clientX, e.clientY - 20);
    itemDiv.onmouseleave = hideTooltip;

    itemDiv.onclick = () => {
      const slot = item.slot;
      if (!slot || !player.equipment.hasOwnProperty(slot)) {
        log(`${item.name} cannot be equipped.`);
        return;
      }

      if (player.equipment[slot] === item) {
        // Unequip the item
        const existing = player.inventory.find((i) => i.item === item);
        if (existing) {
          existing.quantity++;
        } else {
          player.inventory.push({ item: item, quantity: 1 });
        }
        player.equipment[slot] = null;
        applyEquipmentBonuses();
        updateUI();
        return;
      }

      if (player.equipment[slot]) {
        const equipped = player.equipment[slot];
        const found = player.inventory.find((i) => i.item === equipped);
        if (found) {
          found.quantity++;
        } else {
          player.inventory.push({ item: equipped, quantity: 1 });
        }
      }

      player.equipment[slot] = item;
      if (quantity > 1) {
        player.inventory[index].quantity--;
      } else {
        player.inventory.splice(index, 1);
      }
      applyEquipmentBonuses();
      updateUI();
    };

    inventoryDiv.appendChild(itemDiv);
  });
}

const locationList = document.getElementById("locationList");

export function renderLocationUI() {
  const locationInfo = document.getElementById("locationInfo");
  const locationActions = document.getElementById("locationActions");
  const loc = locations[currentLocation];
  if (!loc) return;

  locationInfo.innerHTML = `<h2>${loc.name}</h2><p>${loc.description}</p>`;
  locationActions.innerHTML = "";

  loc.actions.forEach((action) => {
    if (action === "chop wood") {
      const availableTrees = loc.trees || [];
      const eligibleTrees = availableTrees.filter(
        (key) => getSkillLevel("woodcutting") >= treeTypes[key].requiredLevel,
      );

      if (eligibleTrees.length === 0) {
        const msg = document.createElement("p");
        msg.textContent = "You don't have the skill to chop any trees here.";
        locationActions.appendChild(msg);
        return;
      }

      eligibleTrees.forEach((treeKey) => {
        const btn = document.createElement("button");
        btn.textContent = `Chop ${treeTypes[treeKey].name}`;
        btn.classList.add("chop-button");
        btn.onclick = () => toggleWoodcutting(treeKey);
        locationActions.appendChild(btn);
      });
    } else {
      const btn = document.createElement("button");
      btn.textContent = capitalize(action);
      btn.onclick = (e) => handleLocationAction(action, e);
      locationActions.appendChild(btn);
    }
  });

  locationSelect.value = currentLocation;
}

export function renderLocationList() {
  if (!locationList) return;
  locationList.innerHTML = "";

  const loc = locations[currentLocation];
  if (!loc || !loc.connections) return;

  loc.connections.forEach((key) => {
    const target = locations[key];
    const li = document.createElement("li");

    if (target.discovered) {
      li.textContent = target.name;
      li.style.cursor = "pointer";
      li.onclick = () => {
        setLocation(key);
        log(`You travel to the ${target.name}.`);
        renderLocationUI();
        renderLocationList();
      };
    } else {
      li.textContent = "???";
      li.style.color = "#888";
    }

    locationList.appendChild(li);
  });
}

export function renderLocationDropdown() {
  locationSelect.innerHTML = "";
  Object.entries(locations).forEach(([key, loc]) => {
    if (loc.discovered && loc.isHub) {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = loc.name;
      locationSelect.appendChild(option);
    }
  });
  locationSelect.value = currentLocation;
}
// Render skills tab
export function renderSkillTab() {
  const container = document.getElementById("skillsList");
  if (!container) return;

  container.innerHTML = "";

  Object.entries(playerSkills).forEach(([key, skill]) => {
    const row = document.createElement("div");
    const progress = skill.xpToNext
      ? ` (${skill.xp} / ${skill.xp + skill.xpToNext} XP)`
      : ` (${skill.xp} XP)`; // fallback if xpToNext not defined
    row.textContent = `${capitalize(key)}: Level ${skill.level}${progress}`;
    container.appendChild(row);
  });
}

export function unlockLocation(key) {
  const loc = locations[key];
  if (loc && !loc.discovered) {
    loc.discovered = true;
    log(`You discovered ${loc.name}!`);
    renderLocationDropdown();
    renderLocationList();
  }
}

export function handleLocationAction(action, event) {
  const loc = locations[currentLocation];

  // Only stop woodcutting for actions other than chopping
  if (action !== "chop wood") {
    stopWoodcutting();
  }

  if (action === "rest") {
    const restCost = 100;
    if (player.copper >= restCost) {
      player.copper -= restCost;
      player.hp = player.maxHp;
      player.regenBuffer = 0;
      log(`You rest and fully heal for ${formatCurrency(restCost)}.`);
      updateUI();
    } else {
      log("You don't have enough money to rest.");
    }
  } else if (action === "shop") {
    log("The shop is not implemented yet.");
  } else if (action === "fight" || action === "explore") {
    if (!loc.encounters || loc.encounters.length === 0) {
      log("Nothing to fight here.");
      return;
    }
    const enemyName =
      loc.encounters[Math.floor(Math.random() * loc.encounters.length)];
    const enemy = JSON.parse(
      JSON.stringify(enemies.find((e) => e.name === enemyName)),
    );
    enemy.currentHp = enemy.hp;
    startCombat(enemy);
  } else if (action === "chop wood") {
    const btn = Array.from(
      document.querySelectorAll("#locationActions button"),
    ).find((b) => b.textContent.toLowerCase().includes("chop"));
    if (btn) toggleWoodcutting(event);
  }
}

function switchLocation(newLoc) {
  if (locations[newLoc]) {
    stopWoodcutting();
    setLocation(newLoc);
    log(`You travel to the ${locations[newLoc].name}.`);
    renderLocationUI();
    renderLocationList();
  }
}

if (locationSelect) {
  locationSelect.addEventListener("change", (e) =>
    switchLocation(e.target.value),
  );
}

// Tab switching logic
document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => {
    const targetTab = button.dataset.tab;

    // Remove active class from all buttons
    document
      .querySelectorAll(".tab-button")
      .forEach((btn) => btn.classList.remove("active"));

    // Hide all tab contents
    document
      .querySelectorAll(".tab-content")
      .forEach((tab) => tab.classList.add("hidden"));

    // Activate clicked button and show relevant tab
    button.classList.add("active");
    document.getElementById(targetTab).classList.remove("hidden");
  });
});

// Tooltip binding (only once)
const conWrapper = document.getElementById("statConWrapper");
const strWrapper = document.getElementById("statStrWrapper");
const dexWrapper = document.getElementById("statDexWrapper");
if (conWrapper) {
  conWrapper.addEventListener("mouseover", (e) =>
    showTooltip(
      "Constitution increases health gained on level-up.",
      e.pageX,
      e.pageY,
    ),
  );
  conWrapper.addEventListener("mousemove", (e) =>
    showTooltip(
      "Constitution increases health gained on level-up.",
      e.pageX,
      e.pageY,
    ),
  );
  conWrapper.addEventListener("mouseleave", hideTooltip);
}
if (strWrapper) {
  strWrapper.addEventListener("mouseover", (e) =>
    showTooltip("Strength increases damage.", e.pageX, e.pageY),
  );
  strWrapper.addEventListener("mousemove", (e) =>
    showTooltip("Strength increases damage.", e.pageX, e.pageY),
  );
  strWrapper.addEventListener("mouseleave", hideTooltip);
}
if (dexWrapper) {
  dexWrapper.addEventListener("mouseover", (e) =>
    showTooltip("Dexterity increases attack speed.", e.pageX, e.pageY),
  );
  dexWrapper.addEventListener("mousemove", (e) =>
    showTooltip("Dexterity increases attack speed.", e.pageX, e.pageY),
  );
}
