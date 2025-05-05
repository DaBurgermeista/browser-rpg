// js/systems/save.js
import { player, playerSkills } from "../core/player.js";
import { locations } from "../data/locations.js";
import { currentLocation, setLocation } from "../core/state.js";

const SAVE_KEY = "rpgSave";

export function saveGame() {
  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify({ 
      player, 
      playerSkills, 
      locations,
      currentLocation,
    }),
  );
}
export function loadGame() {
  const data = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
  if (data) {
    Object.assign(player, data.player);
    Object.assign(playerSkills, data.playerSkills);
    Object.entries(data.locations).forEach(([k, v]) =>
      Object.assign(locations[k], v),
    );
    if (data.currentLocation) setLocation(data.currentLocation);
  }
}

window.addEventListener("beforeunload", saveGame);
