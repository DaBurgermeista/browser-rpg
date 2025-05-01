// script.js

document.addEventListener("DOMContentLoaded", () => {
  const fightBtn = document.getElementById('fightBtn');
  const status = document.getElementById('status');
  const hpDisplay = document.getElementById('hp');
  const currencyDisplay = document.getElementById('currency');
  const apsLabel = document.getElementById('apsLabel');
  const strDisplay = document.getElementById('statStr');
  const dexDisplay = document.getElementById('statDex');
  const tooltip = document.getElementById('tooltip');

  window.tooltip = tooltip;

  window.player = {
    hp: 100,
    maxHp: 100,
    copper: 0,
    regen: 0.2,
    regenBuffer: 0,
    alive: true,
    strength: 5,
    dexterity: 5,
    baseAttackSpeed: 2000,
    attackSpeed: 2000,
    baseDamage: 5,
    equipment: {
      weapon: null,
      offhand: null,
      armor: null,
      helmet: null,
      gloves: null,
      boots: null,
      accessory: null,
      belt: null,
      cloak: null
    },
    inventory: [
      items["Rusty Dagger"],
      items["Tattered Cloak"],
      items["Lucky Coin"]
    ]
  };

  let currentLocation = "town";

  function formatCurrency(cp) {
    const gp = Math.floor(cp / 10000);
    const sp = Math.floor((cp % 10000) / 100);
    const copper = cp % 100;
    const parts = [];
    if (gp) parts.push(`${gp} gp`);
    if (sp) parts.push(`${sp} sp`);
    if (copper || parts.length === 0) parts.push(`${copper} cp`);
    return parts.join(', ');
  }

  function calculateAttackSpeed(player) {
    const dexBonus = player.dexterity * 20;
    const itemBonus = player.equipment.weapon?.bonuses?.attackSpeed || 0;
    const result = player.baseAttackSpeed - dexBonus + itemBonus;
    return Math.max(400, result);
  }

  function getSpeedLabel(ms) {
    if (ms > 2000) return "Very Slow";
    if (ms > 1600) return "Slow";
    if (ms > 1200) return "Average";
    if (ms > 800) return "Fast";
    return "Very Fast";
  }

  function updateUI() {
    player.attackSpeed = calculateAttackSpeed(player);
    hpDisplay.textContent = Math.floor(player.hp);
    currencyDisplay.textContent = formatCurrency(player.copper);
    strDisplay.textContent = player.strength;
    dexDisplay.textContent = player.dexterity;
    apsLabel.textContent = getSpeedLabel(player.attackSpeed);
    renderInventory();
  }

  function log(message) {
    const entry = document.createElement('div');
    entry.textContent = message;
    status.appendChild(entry);
    status.scrollTop = status.scrollHeight;
  }

  function getItemTooltip(item) {
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

    return tooltip;
  }

  function getPlayerDamage() {
    const weapon = player.equipment.weapon;
    let damage = Math.floor(Math.random() * 6) + 5;
    if (weapon && weapon.bonuses.damageRange) {
      const [min, max] = weapon.bonuses.damageRange;
      damage = Math.floor(Math.random() * (max - min + 1)) + min;
    }
    damage += Math.floor(player.strength / 2);
    return damage;
  }

  function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  function showTooltip(text, x, y) {
    tooltip.style.left = x + 10 + 'px';
    tooltip.style.top = y + 10 + 'px';
    tooltip.innerHTML = text;
    tooltip.style.display = 'block';
  }

  function hideTooltip() {
    tooltip.style.display = 'none';
  }

  function applyEquipmentBonuses() {
    player.strength = 5;
    player.dexterity = 5;
    player.regen = 0.2;

    for (let slot in player.equipment) {
      const item = player.equipment[slot];
      if (item?.bonuses) {
        for (let stat in item.bonuses) {
          player[stat] += item.bonuses[stat];
        }
      }
    }
  }

  function renderInventory() {
    const inventoryDiv = document.getElementById('inventory');
    inventoryDiv.innerHTML = '';

    player.inventory.forEach((item, index) => {
      const btn = document.createElement('button');
      btn.textContent = `${item.slot.toUpperCase()}: ${item.name}`;
      btn.onmouseover = (e) => showTooltip(getItemTooltip(item), e.pageX, e.pageY);
      btn.onmousemove = (e) => showTooltip(getItemTooltip(item), e.pageX, e.pageY);
      btn.onmouseleave = hideTooltip;

      btn.onclick = () => {
        const slot = item.slot;
        if (player.equipment[slot]) {
          player.inventory.push(player.equipment[slot]);
        }
        player.equipment[slot] = item;
        player.inventory.splice(index, 1);
        applyEquipmentBonuses();
        updateUI();
      };

      inventoryDiv.appendChild(btn);
    });

    const equippedSlots = ["weapon", "offhand", "armor", "helmet", "gloves", "boots", "accessory", "belt", "cloak"];

    equippedSlots.forEach(slot => {
      const btn = document.getElementById(`unequip${capitalize(slot)}`);
      const item = player.equipment[slot];
      btn.textContent = item ? item.name : "None";

      const tooltipText = item ? getItemTooltip(item) : "";
      btn.onmouseover = (e) => showTooltip(tooltipText, e.pageX, e.pageY);
      btn.onmousemove = (e) => showTooltip(tooltipText, e.pageX, e.pageY);
      btn.onmouseleave = hideTooltip;

      if (item) {
        btn.disabled = false;
        btn.onclick = () => {
          player.inventory.push(item);
          player.equipment[slot] = null;
          applyEquipmentBonuses();
          updateUI();
        };
      } else {
        btn.disabled = true;
        btn.onclick = null;
      }
    });
  }
});
