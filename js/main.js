// js/main.js
import { loadGame } from "./systems/save.js";
import {
  updateUI,
  renderLocationUI,
  renderLocationList,
  renderLocationDropdown,
  renderSkillTab,
} from "./systems/ui.js";
import { applyEquipmentBonuses, player } from "./core/player.js";
import { currentLocation } from "./core/state.js";

document.addEventListener("DOMContentLoaded", () => {
  // Grab DOM elements used across modules
  const status = document.getElementById("status");
  const hpDisplay = document.getElementById("hp");
  const currencyDisplay = document.getElementById("currency");
  const apsLabel = document.getElementById("apsLabel");
  const strDisplay = document.getElementById("statStr");
  const dexDisplay = document.getElementById("statDex");
  const tooltip = document.getElementById("tooltip");
  const locationSelect = document.getElementById("locationSelect");

  // expose tooltip for ui.js
  window.tooltip = tooltip;

  // mouse position helpers (tooltip positioning)
  let lastMouseX = 0;
  let lastMouseY = 0;
  document.addEventListener("mousemove", (e) => {
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  });

  // ----- Init saved state -----
  loadGame();
  applyEquipmentBonuses();
  updateUI();
  renderLocationUI();
  renderLocationList();
  renderLocationDropdown();
  renderSkillTab();

  // ----- Passive health regeneration -----
  setInterval(() => {
    if (player.alive && player.hp < player.maxHp) {
      player.regenBuffer += player.regen;
      if (player.regenBuffer >= 1) {
        const healed = Math.floor(player.regenBuffer);
        player.hp += healed;
        player.regenBuffer -= healed;
        if (player.hp > player.maxHp) player.hp = player.maxHp;
        updateUI();
      }
    }
  }, 1000);
});
