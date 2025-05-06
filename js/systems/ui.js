// js/systems/ui.js
import { locations } from "../data/locations.js";
import { items } from "../data/items.js";
import { enemies } from "../data/enemies.js";
import {
  formatCurrency,
  getSpeedLabel,
  capitalize,
  itemLink,
} from "./utils.js";

import {
  player,
  playerSkills,
  applyEquipmentBonuses,
  calculateAttackSpeed,
  getSkillLevel,
} from "../core/player.js";

import { currentLocation, setLocation } from "../core/state.js";
import {
  treeTypes,
  toggleWoodcutting,
  stopWoodcutting,
} from "./woodcutting.js";
import { startCombat } from "./combat.js";

/* ───── DOM handles ───── */
const strDisplay = document.getElementById("statStr");
const dexDisplay = document.getElementById("statDex");
const apsLabel = document.getElementById("apsLabel");
const currencyDisplay = document.getElementById("currency");
const status = document.getElementById("status");
const tooltip = document.getElementById("tooltip");
const locationSelect = document.getElementById("locationSelect");
const locationList = document.getElementById("locationList");

/* ───── helper: biome → class ───── */
const biomeClass = {
  settlement: "room-town",
  forest: "room-woods",
  clearing: "room-clearing",
  river: "room-river",
  marsh: "room-marsh",
  cave: "room-cave",
  mine: "room-mine",
  hill: "room-hill",
  unknown: "room-unknown",
};

/* ═════════════════ UI CORE ═════════════════ */
export function updateUI() {
  document.getElementById("level").textContent = player.level;
  document.getElementById("xp").textContent = player.xp;
  document.getElementById("xpToNext").textContent = player.xpToNext;

  const xpPct = (player.xp / player.xpToNext) * 100;
  document.getElementById("compactPlayerXpBar").style.width = `${xpPct}%`;
  document.getElementById(
    "compactXpText"
  ).textContent = `XP: ${player.xp} / ${player.xpToNext}`;

  document.getElementById("statCon").textContent =
    player.constitution.toFixed(3);
  player.attackSpeed = calculateAttackSpeed(player);
  currencyDisplay.textContent = formatCurrency(player.copper);
  strDisplay.textContent = player.strength.toFixed(3);
  dexDisplay.textContent = player.dexterity.toFixed(3);
  apsLabel.textContent = getSpeedLabel(player.attackSpeed);

  const hpPct = (player.hp / player.maxHp) * 100;
  document.getElementById("compactPlayerHealthBar").style.width = `${hpPct}%`;
  document.getElementById("compactHpText").textContent = `HP: ${Math.floor(
    player.hp
  )} / ${player.maxHp}`;

  const mainBar = document.getElementById("playerHealthBar");
  if (mainBar) mainBar.style.width = `${hpPct}%`;
  const hpTxt = document.getElementById("playerHpText");
  if (hpTxt) hpTxt.textContent = `${Math.floor(player.hp)} / ${player.maxHp}`;
  renderInventory();
  renderEquipmentTab();
}
/* ───── log helper ───── */
export function log(msg) {
  const div = document.createElement("div");
  div.innerHTML = msg;
  status.appendChild(div);
  status.scrollTop = status.scrollHeight;
}
// ---------- Tooltip helpers ----------
export function getItemTooltip(item) {
  let out = `<strong class="tooltip-title">${item.name}</strong><br>${item.description}<br>`;
  const bonuses = item.bonuses || {};

  if (bonuses.damageRange) {
    const [min, max] = bonuses.damageRange;
    const strBonus = Math.floor(player.strength / 2);
    out += `<span class="bonus">Damage: ${min}-${max} + ${strBonus} STR bonus</span><br>`;
  }
  for (const [k, v] of Object.entries(bonuses)) {
    if (k !== "damageRange")
      out += `<span class="bonus">+${v} ${capitalize(k)}</span><br>`;
  }
  out += `<em class="tooltip-sub">Type: ${item.slot.toUpperCase()}</em><br>`;
  return out;
}

export function showTooltip(text, x, y) {
  tooltip.innerHTML = text;
  tooltip.style.display = "block";
  tooltip.removeAttribute("hidden");
  requestAnimationFrame(() => {
    const rect = tooltip.getBoundingClientRect();
    let tx = x + 10;
    let ty = y - rect.height - 10;
    if (tx + rect.width > window.innerWidth)
      tx = window.innerWidth - rect.width - 10;
    if (ty < 0) ty = y + 10;
    tooltip.style.left = `${tx}px`;
    tooltip.style.top = `${ty}px`;
  });
}
export function hideTooltip() {
  tooltip.setAttribute("hidden", "");
  setTimeout(() => {
    tooltip.style.display = "none";
  }, 150);
}

// ---------- Tooltip watchdog ----------
let lastTooltipTime = 0;
let lastMouse = { x: 0, y: 0 };

document.addEventListener("mousemove", (e) => {
  lastTooltipTime = performance.now();
  lastMouse.x = e.clientX;
  lastMouse.y = e.clientY;
});

setInterval(() => {
  if (tooltip.style.display === "none") return;

  // User still moving → keep tooltip
  if (performance.now() - lastTooltipTime < 400) return;

  // Use cached mouse coords
  const el = document.elementFromPoint(lastMouse.x, lastMouse.y);
  if (
    !el ||
    (!el.closest(".inventory-item") &&
      !el.closest(".item-link") &&
      !el.closest(".equipment-slot"))
  ) {
    hideTooltip();
  }
}, 300);

// Delegated hover on item links inside the log
status.addEventListener("mouseover", (e) => {
  const el = e.target.closest(".item-link");
  if (!el) return;
  const item = items[el.dataset.item];
  if (item) showTooltip(getItemTooltip(item), e.pageX, e.pageY - 20);
});
status.addEventListener("mousemove", (e) => {
  const el = e.target.closest(".item-link");
  if (el) {
    const item = items[el.dataset.item];
    if (item) showTooltip(getItemTooltip(item), e.pageX, e.pageY - 20);
  } else {
    hideTooltip();
  }
});

status.addEventListener("mouseleave", (e) => {
  if (e.target.closest(".item-link")) hideTooltip();
});
status.addEventListener("scroll", hideTooltip);

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
            (i) => i.item === equippedItem
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

export function renderLocationUI() {
  const locInfo = document.getElementById("locationInfo");
  const locActs = document.getElementById("locationActions");
  const loc = locations[currentLocation];
  if (!loc) return;

  locInfo.innerHTML = `<h2>${loc.name}</h2><p>${loc.description}</p>`;
  locActs.innerHTML = "";

  loc.actions.forEach((action) => {
    if (action === "chop wood") {
      const avail = loc.trees || [];
      const ok = avail.filter((k) => {
        const tree = treeTypes[k];
        return tree && getSkillLevel("woodcutting") >= tree.requiredLevel;
      });
      if (!ok.length) {
        locActs.appendChild(
          Object.assign(document.createElement("p"), {
            textContent: "You don't have the skill to chop any trees here.",
          })
        );
        return;
      }
      ok.forEach((k) => {
        const b = document.createElement("button");
        b.textContent = `Chop ${treeTypes[k].name}`;
        b.classList.add("chop-button");
        b.onclick = () => toggleWoodcutting(k);
        locActs.appendChild(b);
      });
    } else {
      const b = document.createElement("button");
      b.textContent = capitalize(action);
      b.onclick = (e) => handleLocationAction(action, e);
      locActs.appendChild(b);
    }
  });

  locationSelect.value = currentLocation;
  renderLocationList();
  renderAsciiMap();
}

/* ───────────────────────────── ascii‑map renderer ─────────────────────────── */
export function renderAsciiMap() {
  console.log("renderAsciiMap called");
  const size = 55; // wide enough for 5 rooms x 8 chars + margin
  const mid = Math.floor(size / 2);

  const grid = Array.from({ length: size }, () => " ".repeat(size).split(""));

  const put = (x, y, ch) => {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    grid[y][x] = ch;
  };

  const box = (gx, gy, label, cls) => {
    const txt = `[${label.padEnd(5).slice(0, 5)}]`,
      left = gx - 3;
    [...txt].forEach((ch, i) =>
      put(left + i, gy, `<span class="${cls}">${ch}</span>`)
    );
  };

  const here = locations[currentLocation];
  let roomsPlaced = 0;
  Object.entries(locations).forEach(([key, loc]) => {
    const dx = loc.x - here.x,
      dy = loc.y - here.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) return;

    const gx = mid + dx * 8;
    const gy = mid + dy * 2;
    const known = loc.discovered,
      curr = key === currentLocation;
    const label = curr ? "  @  " : known ? loc.name.slice(0, 5) : "?????";
    const biomeCls = biomeClass[loc.biome || "unknown"];
    const cls = `${known ? biomeCls : "room-unknown"}${
      curr ? " room-current" : ""
    }`;

    box(gx, gy, label, cls);
    if (loc.exits && known) {
      if (loc.exits.e) put(gx + 4, gy, "─");
      if (loc.exits.w) put(gx - 4, gy, "─");
      if (loc.exits.n) put(gx, gy - 1, "│");
      if (loc.exits.s) put(gx, gy + 1, "│");
    }
    roomsPlaced++;
    console.log(`Room: ${roomsPlaced}: ${loc.name}`);
  });

  document.getElementById("asciiMap").innerHTML = grid
    .map((r) => r.join(""))
    .join("<br>");

  /* click‑travel */
  document.querySelectorAll("#asciiMap span[class*='room-']").forEach((el) => {
    const t = el.textContent.trim();
    const key =
      t === "@"
        ? currentLocation
        : Object.keys(locations).find((k) => locations[k].name.startsWith(t));
    if (!key || key === currentLocation || !locations[key].discovered) return;
    el.style.cursor = "pointer";
    el.onclick = () => switchLocation(key);
  });
  centerAsciiMap();
  const mapEl = document.getElementById("asciiMap");
  mapEl.scrollLeft = (mapEl.scrollWidth - mapEl.clientWidth) / 2;
  mapEl.scrollTop = (mapEl.scrollHeight - mapEl.clientHeight) / 2;
}

/* ───────────────────── drag‑scroll for the ascii map ─────────────────────── */
{
  const ascii = document.getElementById("asciiMap");
  let down = false,
    sx,
    sy,
    sl,
    st;
  ascii.addEventListener("mousedown", (e) => {
    down = true;
    ascii.classList.add("grabbing");
    sx = e.pageX;
    sy = e.pageY;
    sl = ascii.scrollLeft;
    st = ascii.scrollTop;
  });
  ["mouseup", "mouseleave"].forEach((evt) =>
    ascii.addEventListener(evt, () => {
      down = false;
      ascii.classList.remove("grabbing");
    })
  );
  ascii.addEventListener("mousemove", (e) => {
    if (!down) return;
    ascii.scrollLeft = sl - (e.pageX - sx);
    ascii.scrollTop = st - (e.pageY - sy);
  });
}

function centerAsciiMap() {
  const ascii = document.getElementById("asciiMap");

  requestAnimationFrame(() => {
    ascii.scrollLeft = (ascii.scrollWidth - ascii.clientWidth) / 2;
    ascii.scrollTop = (ascii.scrollHeight - ascii.clientHeight) / 2;
  });
}
/* ───────────────────────── switchLocation with auto‑discover ─────────────── */
function switchLocation(key) {
  const loc = locations[key];
  if (!loc) return;
  stopWoodcutting();

  const req = loc.requiredLevel || 1;
  if (player.level < req && !loc.discovered) {
    log(`You need to be level ${req} to venture there.`);
    return;
  }

  setLocation(key);
  if (!loc.discovered) unlockLocation(key);
  renderLocationUI();
  renderLocationList();
}
window.switchLocation = switchLocation; // dev helper

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
      li.onclick = () =>
        log("You haven't discovered how to get to this location.");
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
    renderAsciiMap();
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
      JSON.stringify(enemies.find((e) => e.name === enemyName))
    );
    enemy.currentHp = enemy.hp;
    startCombat(enemy);
  } else if (action === "chop wood") {
    const btn = Array.from(
      document.querySelectorAll("#locationActions button")
    ).find((b) => b.textContent.toLowerCase().includes("chop"));
    if (btn) toggleWoodcutting(event);
  }
}

if (locationSelect) {
  locationSelect.addEventListener("change", (e) =>
    switchLocation(e.target.value)
  );
}

// ui.js (or main.js) — run once after the DOM exists
const ascii = document.getElementById("asciiMap");
let isDown = false,
  startX,
  startY,
  scrollL,
  scrollT;

ascii.addEventListener("mousedown", (e) => {
  isDown = true;
  ascii.classList.add("grabbing");
  startX = e.pageX;
  startY = e.pageY;
  scrollL = ascii.scrollLeft;
  scrollT = ascii.scrollTop;
});

["mouseleave", "mouseup"].forEach((evt) =>
  ascii.addEventListener(evt, () => {
    isDown = false;
    ascii.classList.remove("grabbing");
  })
);

ascii.addEventListener("mousemove", (e) => {
  if (!isDown) return;
  e.preventDefault();
  const dx = e.pageX - startX;
  const dy = e.pageY - startY;
  ascii.scrollLeft = scrollL - dx;
  ascii.scrollTop = scrollT - dy;
});

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
      e.pageY
    )
  );
  conWrapper.addEventListener("mousemove", (e) =>
    showTooltip(
      "Constitution increases health gained on level-up.",
      e.pageX,
      e.pageY
    )
  );
  conWrapper.addEventListener("mouseleave", hideTooltip);
}
if (strWrapper) {
  strWrapper.addEventListener("mouseover", (e) =>
    showTooltip("Strength increases damage.", e.pageX, e.pageY)
  );
  strWrapper.addEventListener("mousemove", (e) =>
    showTooltip("Strength increases damage.", e.pageX, e.pageY)
  );
  strWrapper.addEventListener("mouseleave", hideTooltip);
}
if (dexWrapper) {
  dexWrapper.addEventListener("mouseover", (e) =>
    showTooltip("Dexterity increases attack speed.", e.pageX, e.pageY)
  );
  dexWrapper.addEventListener("mousemove", (e) =>
    showTooltip("Dexterity increases attack speed.", e.pageX, e.pageY)
  );
}
// ---------- Global UI changes should hide tooltip ----------
document
  .querySelectorAll(".tab-button")
  .forEach((btn) => btn.addEventListener("click", hideTooltip));

document.addEventListener("wheel", hideTooltip, { passive: true });
document.addEventListener("mousedown", hideTooltip);
