const fightBtn = document.getElementById('fightBtn');
const status = document.getElementById('status');
const hpDisplay = document.getElementById('hp');
const goldDisplay = document.getElementById('gold');

let player = {
  hp: 100,
  maxHp: 100,
  gold: 0,
  regen: 0.2,
  regenBuffer: 0,
  alive: true
};

function updateUI() {
  hpDisplay.textContent = Math.floor(player.hp);
  goldDisplay.textContent = player.gold;

  // Check for death
  if (player.hp <= 0 && player.alive) {
    player.hp = 0;
    player.alive = false;
    status.textContent = "You are dead!";
    fightBtn.disabled = true;
  }
}

fightBtn.addEventListener('click', () => {
  if (!player.alive) return;

  let timeLeft = 5;
  status.textContent = `Fighting... (${timeLeft}s)`;
  fightBtn.disabled = true;

  const countdown = setInterval(() => {
    timeLeft--;
    if (timeLeft > 0) {
      status.textContent = `Fighting... (${timeLeft}s)`;
    } else {
      clearInterval(countdown);

      const damage = Math.floor(Math.random() * 10) + 1;
      player.hp -= damage;
      if (player.hp < 0) player.hp = 0;

      const reward = 10;
      player.gold += reward;

      if (player.hp > 0) {
        status.textContent = `Victory! You took ${damage} damage and earned ${reward} gold.`;
      }

      updateUI();
      if (player.alive) fightBtn.disabled = false;
    }
  }, 1000);
});

// Game tick - heals player over time
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
