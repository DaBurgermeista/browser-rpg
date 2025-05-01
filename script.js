const fightBtn = document.getElementById('fightBtn');
const status = document.getElementById('status');
const hpDisplay = document.getElementById('hp');
const currencyDisplay = document.getElementById('currency');

const items = {
  "Rusty Dagger": {
    slot: "weapon",
    bonuses: { attackSpeed: -300, dexterity: +1 }
  },
  "Tattered Cloak": {
    slot: "armor",
    bonuses: { regen: +0.1 }
  },
  "Lucky Coin": {
    slot: "accessory",
    bonuses: { dexterity: +2 }
  }
};

let player = {
  hp: 100,
  maxHp: 100,
  copper: 0,
  regen: 0.2,
  regenBuffer: 0,
  alive: true,
  dexterity: 5,
  baseAttackSpeed: 2000,
  attackSpeed: 2000,
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

function applyEquipmentBonuses() {
  player.attackSpeed = player.baseAttackSpeed;
  player.regen = 0.2;
  player.dexterity = 5;

  for (let slot in player.equipment) {
    const item = player.equipment[slot];
    if (item && item.bonuses) {
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
    const itemName = Object.keys(items).find(k => items[k] === item);
    btn.textContent = `${item.slot.toUpperCase()}: ${itemName}`;
    btn.onclick = () => {
      player.equipment[item.slot] = item;
      applyEquipmentBonuses();
      updateUI();
      renderInventory();
    };
    inventoryDiv.appendChild(btn);
  });

  document.getElementById('equippedWeapon').textContent = player.equipment.weapon
    ? Object.keys(items).find(k => items[k] === player.equipment.weapon)
    : "None";

  document.getElementById('equippedArmor').textContent = player.equipment.armor
    ? Object.keys(items).find(k => items[k] === player.equipment.armor)
    : "None";

  document.getElementById('equippedAccessory').textContent = player.equipment.accessory
    ? Object.keys(items).find(k => items[k] === player.equipment.accessory)
    : "None";
}

fightBtn.addEventListener('click', () => {
  if (!player.alive) return;

  const enemy = JSON.parse(JSON.stringify(enemies[Math.floor(Math.random() * enemies.length)]));
  enemy.currentHp = enemy.hp;

  // Battle header
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
      const damage = Math.floor(Math.random() * 10) + 5;
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

// Initial setup
applyEquipmentBonuses();
updateUI();
renderInventory();
