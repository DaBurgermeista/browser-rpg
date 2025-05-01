document.addEventListener("DOMContentLoaded", () => {
  const fightBtn = document.getElementById('fightBtn');
  const status = document.getElementById('status');
  const hpDisplay = document.getElementById('hp');
  const currencyDisplay = document.getElementById('currency');
  const tooltip = document.getElementById('tooltip');
  window.tooltip = tooltip; // So tooltip is accessible in global functions

  window.player = {
    hp: 100,
    maxHp: 100,
    copper: 0,
    regen: 0.2,
    regenBuffer: 0,
    alive: true,
    baseAttackSpeed: 2000,
    attackSpeed: 2000,
    baseStats: {
      strength: 5,
      dexterity: 5
    },
    stats: {
      strength: 5,
      dexterity: 5
    }
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

  function updateUI() {
  hpDisplay.textContent = Math.floor(player.hp);
  currencyDisplay.textContent = formatCurrency(player.copper);
  const aps = (1000 / player.attackSpeed).toFixed(2);
  document.getElementById('aps').textContent = aps;

  if (player.hp <= 0 && player.alive) {
    player.hp = 0;
    player.alive = false;
    log(`You are dead!`);
    fightBtn.disabled = true;
  }
}


  function log(message) {
    const entry = document.createElement('div');
    entry.textContent = message;
    status.appendChild(entry);
    status.scrollTop = status.scrollHeight;
  }

  function getItemTooltip(item) {
  if (!item || !item.bonuses) return '';
  const lines = [];

  for (let stat in item.bonuses) {
    const value = item.bonuses[stat];
    const sign = value >= 0 ? '+' : '';
    if (stat === 'attackSpeed') {
      const newSpeed = player.baseAttackSpeed + value;
      const aps = (1000 / newSpeed).toFixed(2);
      lines.push(`Attack Speed: ${aps} attacks/sec`);
    } else {
      lines.push(`${sign}${value} ${stat}`);
    }
  }

  return lines.join('\n');
}


  function showTooltip(text, x, y) {
    if (!window.tooltip) return;
    tooltip.style.left = x + 10 + 'px';
    tooltip.style.top = y + 10 + 'px';
    tooltip.innerText = text;
    tooltip.style.display = 'block';
  }

  function hideTooltip() {
    if (window.tooltip) {
      tooltip.style.display = 'none';
    }
  }

  function applyEquipmentBonuses() {
    player.stats = { ...player.baseStats }; // Reset to base
    player.attackSpeed = player.baseAttackSpeed;
    player.regen = 0.2;
  
    for (let slot in player.equipment) {
      const item = player.equipment[slot];
      if (item?.bonuses) {
        for (let stat in item.bonuses) {
          if (stat in player.stats) {
            player.stats[stat] += item.bonuses[stat];
          } else {
            player[stat] += item.bonuses[stat]; // For things like attackSpeed or regen
          }
        }
      }
    }

  // Dexterity affects attack speed
  const dex = player.stats.dexterity;
  player.attackSpeed = player.baseAttackSpeed - dex * 20;
  if (player.attackSpeed < 500) player.attackSpeed = 500;
}


  function renderInventory() {
    const inventoryDiv = document.getElementById('inventory');
    inventoryDiv.innerHTML = '';

    player.inventory.forEach((item) => {
      const btn = document.createElement('button');
      const itemName = item.name || "Unnamed Item";
      const tooltipText = getItemTooltip(item);

      btn.textContent = `${item.slot.toUpperCase()}: ${itemName}`;
      btn.onmouseover = (e) => showTooltip(tooltipText, e.pageX, e.pageY);
      btn.onmousemove = (e) => showTooltip(tooltipText, e.pageX, e.pageY);
      btn.onmouseleave = hideTooltip;

      btn.onclick = () => {
        player.equipment[item.slot] = item;
        player.inventory = player.inventory.filter(i => i !== item);
        applyEquipmentBonuses();
        updateUI();
        renderInventory();
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
      const tooltipText = getItemTooltip(item);

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
          renderInventory();
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
        const strBonus = Math.floor(player.stats.strength / 2);
        const damage = baseDamage + strBonus;
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

  // Fight button handler
  fightBtn.addEventListener('click', () => {
    if (!player.alive) return;
    const enemy = JSON.parse(JSON.stringify(enemies[Math.floor(Math.random() * enemies.length)]));
    enemy.currentHp = enemy.hp;

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
    startCombat(enemy);
  });

  // Run setup
  applyEquipmentBonuses();
  updateUI();
  renderInventory();
});
