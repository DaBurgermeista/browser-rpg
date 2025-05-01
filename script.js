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
      armor: null,
      accessory: null
    },
    inventory: [
      items["Rusty Dagger"],
      items["Tattered Cloak"],
      items["Lucky Coin"]
    ]
  };

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
    return Math.max(400, result); // minimum delay
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
    if (!item) return "An unidentified item.";
  
    return `
      <strong class="tooltip-title">${item.name}</strong><br>
      ${item.tooltip}
    `;
  }

function getPlayerDamage() {
  let bonusDamage = 0;

  for (let slot in player.equipment) {
    const item = player.equipment[slot];
    if (item?.bonuses?.damage) {
      bonusDamage += item.bonuses.damage;
    }
  }

  bonusDamage += Math.floor(player.strength / 2);
  return player.baseDamage + bonusDamage;
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

    const equipped = {
      weapon: document.getElementById('unequipWeapon'),
      armor: document.getElementById('unequipArmor'),
      accessory: document.getElementById('unequipAccessory'),
    };

    for (let slot in equipped) {
      const item = player.equipment[slot];
      const name = item?.name || "None";
      const tooltipText = item ? getItemTooltip(item) : "";

      equipped[slot].textContent = name;
      equipped[slot].onmouseover = (e) => showTooltip(tooltipText, e.pageX, e.pageY);
      equipped[slot].onmousemove = (e) => showTooltip(tooltipText, e.pageX, e.pageY);
      equipped[slot].onmouseleave = hideTooltip;

      if (item) {
        equipped[slot].disabled = false;
        equipped[slot].onclick = () => {
          player.inventory.push(item);
          player.equipment[slot] = null;
          applyEquipmentBonuses();
          updateUI();
        };
      } else {
        equipped[slot].disabled = true;
        equipped[slot].onclick = null;
      }
    }
  }

  function startCombat(enemy) {
    let playerTimer = 0;
    let enemyTimer = 0;
    const interval = 100;

    const header = document.createElement('div');
    header.textContent = `A wild ${enemy.name} appears!`;
    header.style.color = '#facc15';
    header.style.marginTop = '1rem';
    header.style.borderTop = '1px solid #666';
    header.style.paddingTop = '0.5rem';
    header.style.fontWeight = 'bold';
    status.appendChild(header);
    status.scrollTop = status.scrollHeight;

    fightBtn.disabled = true;

    const combatLoop = setInterval(() => {
      if (!player.alive) {
        clearInterval(combatLoop);
        log(`You were slain by a ${enemy.name}.`);
        return;
      }

      playerTimer += interval;
      if (playerTimer >= player.attackSpeed) {
        playerTimer = 0;
        const baseDamage = Math.floor(Math.random() * 10) + 5;
        const strBonus = Math.floor(player.strength / 2);
        const dexBonus = Math.floor(player.dexterity / 4);
        const damage = getPlayerDamage();
        enemy.currentHp -= damage;
        log(`You strike the ${enemy.name} for ${damage} damage! (${Math.max(0, enemy.currentHp)} HP left)`);
      }

      enemyTimer += interval;
      if (enemyTimer >= enemy.attackPerSec) {
        enemyTimer = 0;
        const damage = Math.floor(Math.random() * (enemy.maxDamage - enemy.minDamage + 1)) + enemy.minDamage;
        player.hp -= damage;
        if (player.hp < 0) player.hp = 0;
        log(`The ${enemy.name} hits you for ${damage} damage.`);
        updateUI();
      }

      if (enemy.currentHp <= 0) {
        clearInterval(combatLoop);
        const reward = 10;
        player.copper += reward;
        log(`You defeated the ${enemy.name}! Looted ${formatCurrency(reward)}.`);
        updateUI();
        fightBtn.disabled = false;
      }
    }, interval);
  }

  // Healing tick
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

  // Fight button
  fightBtn.addEventListener('click', () => {
    if (!player.alive) return;
    const enemy = JSON.parse(JSON.stringify(enemies[Math.floor(Math.random() * enemies.length)]));
    enemy.currentHp = enemy.hp;
    startCombat(enemy);
  });

  // Stat tooltips
  document.getElementById('statStrWrapper').addEventListener('mouseover', (e) =>
    showTooltip('Strength increases your melee damage.', e.pageX, e.pageY));
  document.getElementById('statStrWrapper').addEventListener('mousemove', (e) =>
    showTooltip('Strength increases your melee damage.', e.pageX, e.pageY));
  document.getElementById('statStrWrapper').addEventListener('mouseleave', hideTooltip);

  document.getElementById('statDexWrapper').addEventListener('mouseover', (e) =>
    showTooltip('Dexterity increases attack speed and bonus precision.', e.pageX, e.pageY));
  document.getElementById('statDexWrapper').addEventListener('mousemove', (e) =>
    showTooltip('Dexterity increases attack speed and bonus precision.', e.pageX, e.pageY));
  document.getElementById('statDexWrapper').addEventListener('mouseleave', hideTooltip);

  // Initial load
  applyEquipmentBonuses();
  updateUI();
});
