const fightBtn = document.getElementById('fightBtn');
const status = document.getElementById('status');

fightBtn.addEventListener('click', () => {
  status.textContent = "Fighting... (5s)";
  fightBtn.disabled = true;
  
  setTimeout(() => {
    status.textContent = "Victory! You earned 10 gold.";
    fightBtn.disabled = false;
  }, 5000);
});
