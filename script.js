const fightBtn = document.getElementById('fightBtn');
const status = document.getElementById('status');
const hpDisplay = document.getElementById('hp');
const goldDisplay = document.getElementById('gold');

let player = {
  hp: 100,
  maxHp: 100,
  copper: 0,
  regen: 0.2,
  regenBuffer: 0,
  alive: true,
  dexterity: 5,
  attackSpeed: 2000, // milliseconds per attack, can be adjusted by equipment
};
function log(message) {
  const entry = document.createElement('div');
  entry.textContent = message;
  status.appendChild(entry);
  status.scrollTop = status.scrollHeight;
}

function formatCurrency(cp) {
  const gp = Math.floor(cp / 10000);
  const sp = Math.floor((cp % 10000) / 100);
  const copper = cp % 100;
  return `${gp} gp, ${sp} sp, ${copper} cp`;
}

function updateUI() {
  hpDisplay.textContent = Math.floor(player.hp);
  goldDisplay.textContent = formatCurrency(player.copper);

  if (player.hp <= 0 && player.alive) {
    player.hp = 0;
    player.alive = false;
    status.textContent = "You are dead!";
    fightBtn.disabled = true;
  }
}

fightBtn.addEventListener('click', () => {
  if (!player.alive) return;

  const enemy = JSON.parse(JSON.stringify(enemies[Math.floor(Math.random() * enemies.length)]));
  enemy.currentHp = enemy.hp;
  
  // Add visual divider between fights
  const header = document.createElement('div');
  header.textContent = `A wild ${enemy.name} appears!`;
  header.style.color = '#facc15'; // golden yellow
  header.style.marginTop = '1rem';
  header.style.borderTop = '1px solid #666';
  header.style.paddingTop = '0.5rem';
  header.style.fontWeight = 'bold';
  status.appendChild(header);
  status.scrollTop = status.scrollHeight;
  fightBtn.disabled = true;

  startCombat(enemy);
});

// Game tick (healing)
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

function startCombat(enemy) {
  let playerTimer = 0;
  let enemyTimer = 0;
  const interval = 100; // how often we check (ms)

  const combatLoop = setInterval(() => {
    if (!player.alive) {
      clearInterval(combatLoop);
      log(`You were slain by a ${enemy.name}.`);
      return;
    }

    // Player attacks
    playerTimer += interval;
    if (playerTimer >= player.attackSpeed) {
      playerTimer = 0;
      const damage = Math.floor(Math.random() * 10) + 5;
      enemy.currentHp -= damage;
      log(`You strike the ${enemy.name} for ${damage} damage! (${Math.max(0, enemy.currentHp)} HP left)`);
    }

    // Enemy attacks
    enemyTimer += interval;
    if (enemyTimer >= enemy.attackPerSec) {
      enemyTimer = 0;
      const damage = Math.floor(Math.random() * (enemy.maxDamage - enemy.minDamage + 1)) + enemy.minDamage;
      player.hp -= damage;
      if (player.hp < 0) player.hp = 0;
      log(` The ${enemy.name} hits you for ${damage} damage.`);
      updateUI();
    }

    // Check enemy death
    if (enemy.currentHp <= 0) {
      clearInterval(combatLoop);
      const reward = 10;
      player.copper += reward;

      log(`You defeated the ${enemy.name}! +${reward} cp.`);
      updateUI();
      fightBtn.disabled = false;
    }
  }, interval);
}
