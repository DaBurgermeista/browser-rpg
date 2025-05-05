// js/core/state.js
let _currentLocation = "town";

export function getLocation() {
  return _currentLocation;
}
export function setLocation(loc) {
  _currentLocation = loc;
}

// (re‑export for existing code that still imports currentLocation directly)
export { _currentLocation as currentLocation };
