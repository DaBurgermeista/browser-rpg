const fightBtn = document.getElementById('fightBtn');
const status = document.getElementById('status');
const hpDisplay = document.getElementById('hp');
const goldDisplay = document.getElementById('gold');

let player = {
  hp: 100,
  gold: 0,
};

fightBtn.addEventListener('click', () => {
  let timeLeft = 5;
  status.textContent = `Fighting... (${timeLeft}s)`;
  fightBtn.disabled = true;

  const countdown = setInterval(() => {
    timeLeft--;
    if (timeLeft > 0) {
      status.textContent = `Fighting... (${timeLeft}s)`;
    } else {
      clearInterval(countdown);

      // Simulate taking damage
      const damage = Math.floor(Math.random() * 10) + 1;
      player.hp -= damage;

      // Reward gold
      const reward = 10;
      player.gold += reward;

      // Clamp HP at 0
      if (player.hp < 0) player.hp = 0;

      // Update UI
      status.textContent = `Victory! You took ${damage} damage and earned ${reward} gold.`;
      hpDisplay.textContent = player.hp;
      goldDisplay.textContent = player.gold;

      fightBtn.disabled = false;
    }
  }, 1000);
});

