// script.js

document.addEventListener("DOMContentLoaded", () => {
  const fightBtn = document.getElementById("fightBtn");
  const status = document.getElementById("status");
  const hpDisplay = document.getElementById("hp");
  const currencyDisplay = document.getElementById("currency");
  const apsLabel = document.getElementById("apsLabel");
  const strDisplay = document.getElementById("statStr");
  const dexDisplay = document.getElementById("statDex");
  const tooltip = document.getElementById("tooltip");
  const locationSelect = document.getElementById("locationSelect");

  let lastMouseX = 0;
  let lastMouseY = 0;

  document.addEventListener('mousemove', (e) => {
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  });
  
  window.tooltip = tooltip;

  window.player = {
    hp: 100,
    maxHp: 100,
    level: 1,
    xp: 0,
    xpToNext: 50,
    copper: 0,
    regen: 0.2,
    regenBuffer: 0,
    alive: true,
    strength: 5,
    dexterity: 5,
    constitution: 5,
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
      cloak: null,
    },
    inventory: [
      items["Rusty Dagger"],
      items["Tattered Cloak"],
      items["Lucky Coin"],
    ],
  };

  let currentLocation = "town";
  let woodcuttingInterval = null;
  let isChopping = false;
  
  function spawnFloatingText(text, x, y, color = '#4ade80') {
    // Fallback to center of the screen if mouse position is invalid
    if (x === 0 && y === 0) {
      const fallback = document.getElementById('locationActions');
      const rect = fallback.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }

    const wrapper = document.getElementById('gameWrapper');
    const span = document.createElement('span'); // Moved up

    span.textContent = text;

    // Initial position and styles
    Object.assign(span.style, {
      position: 'absolute',
      left: `${x}px`,
      top: `${y}px`,
      color: color,
      fontSize: '0.9rem',
      fontWeight: 'bold',
      opacity: '1',
      pointerEvents: 'none',
      zIndex: '9999',
      transform: 'translateY(0px)',
      transition: 'transform 1s ease-out, opacity 1s ease-out'
    });

    wrapper.appendChild(span); // Now properly appending the created span

    // Trigger animation
    requestAnimationFrame(() => {
      span.style.transform = 'translateY(-40px)';
      span.style.opacity = '0';
    });

    // Remove after animation
    setTimeout(() => {
      span.remove();
    }, 1000);
  }


 
  function toggleWoodcutting(button) {
    if (isChopping) {
      clearInterval(woodcuttingInterval);
      isChopping = false;
      log("You stop chopping wood.");
      button.textContent = "Chop Wood";
    } else {
      log("You begin chopping wood....");
      isChopping = true;
      button.textContent = "Stop Chopping";

      woodcuttingInterval = setInterval(() => {
        player.strength += 0.005;
        player.copper += 2;

        spawnFloatingText('+2 cp', lastMouseX, lastMouseY, '#facc15');
        spawnFloatingText('+0.005 STR', lastMouseX, lastMouseY - 20, '#4ade80');

        console.log(`Mouse at: ${lastMouseX}, ${lastMouseY}`);


        updateUI();
      }, 2000);
    }
  }


  function formatCurrency(cp) {
    const gp = Math.floor(cp / 10000);
    const sp = Math.floor((cp % 10000) / 100);
    const copper = cp % 100;
    const parts = [];
    if (gp) parts.push(`${gp} gp`);
    if (sp) parts.push(`${sp} sp`);
    if (copper || parts.length === 0) parts.push(`${copper} cp`);
    return parts.join(", ");
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
    document.getElementById("level").textContent = player.level;
    document.getElementById("xp").textContent = player.xp;
    document.getElementById("xpToNext").textContent = player.xpToNext;
    document.getElementById("statCon").textContent = player.constitution.toFixed(3);
    player.attackSpeed = calculateAttackSpeed(player);
    hpDisplay.textContent = Math.floor(player.hp);
    currencyDisplay.textContent = formatCurrency(player.copper);
    strDisplay.textContent = player.strength.toFixed(3);
    dexDisplay.textContent = player.dexterity.toFixed(3);
    apsLabel.textContent = getSpeedLabel(player.attackSpeed);

    // Player bar
    const pct = Math.floor((player.hp / player.maxHp) * 100);
    document.getElementById("playerHealthBar").style.width = `${pct}%`;
    document.getElementById("playerHpText").textContent =
      `${Math.floor(player.hp)} / ${player.maxHp}`;

    renderInventory();
  }

  function log(message) {
    const entry = document.createElement("div");
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
    tooltip.style.left = x + 10 + "px";
    tooltip.style.top = y + 10 + "px";
    tooltip.innerHTML = text;
    tooltip.style.display = "block";
  }

  function hideTooltip() {
    tooltip.style.display = "none";
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
  function updateEnemyHealthBar(enemy) {
    const pct = Math.floor((enemy.currentHp / enemy.hp) * 100);
    document.getElementById("enemyHealthBar").style.width = `${pct}%`;
    document.getElementById("enemyHpText").textContent =
      `${Math.max(0, enemy.currentHp)} / ${enemy.hp}`;
    document.getElementById("enemyHealthBarContainer").style.display = "block";
  }

  function renderInventory() {
    const inventoryDiv = document.getElementById("inventory");
    inventoryDiv.innerHTML = "";

    player.inventory.forEach((item, index) => {
      const btn = document.createElement("button");
      btn.textContent = `${item.slot.toUpperCase()}: ${item.name}`;
      btn.onmouseover = (e) =>
        showTooltip(getItemTooltip(item), e.pageX, e.pageY);
      btn.onmousemove = (e) =>
        showTooltip(getItemTooltip(item), e.pageX, e.pageY);
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

    const equippedSlots = [
      "weapon",
      "offhand",
      "armor",
      "helmet",
      "gloves",
      "boots",
      "accessory",
      "belt",
      "cloak",
    ];

    equippedSlots.forEach((slot) => {
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

  function checkLevelUp() {
    while (player.xp >= player.xpToNext) {
      player.xp -= player.xpToNext;
      player.level++;
      player.xpToNext = Math.floor(player.xpToNext * 1.5);
      
      const hpGain = 5 + Math.floor(player.constitution * 1.5);
      player.maxHp += hpGain;
      player.hp = player.maxHp;
      
      player.strength += 1;
      player.dexterity += 1;
      log(`✨ You leveled up to level ${player.level}! Stats increased.`);
      updateUI();
    }
  }

  function startCombat(enemy) {
    let playerTimer = 0;
    let enemyTimer = 0;
    const interval = 100;

    const header = document.createElement("div");
    header.textContent = `A ${enemy.name} appears!`;
    header.style.color = "#facc15";
    header.style.marginTop = "1rem";
    header.style.borderTop = "1px solid #666";
    header.style.paddingTop = "0.5rem";
    header.style.fontWeight = "bold";
    status.appendChild(header);
    status.scrollTop = status.scrollHeight;
    document.getElementById("enemyHealthBarContainer").style.display = "block";
    const enemyHealthPercent = Math.floor((enemy.currentHp / enemy.hp) * 100);
    document.getElementById("enemyHealthBar").style.width =
      `${enemyHealthPercent}%`;

    const combatLoop = setInterval(() => {
      if (!player.alive) {
        clearInterval(combatLoop);
        log(`You were slain by a ${enemy.name}.`);
        return;
      }

      playerTimer += interval;
      if (playerTimer >= player.attackSpeed) {
        playerTimer = 0;
        const damage = getPlayerDamage();
        enemy.currentHp -= damage;
        updateEnemyHealthBar(enemy);
        log(
          `You strike the ${enemy.name} for ${damage} damage! (${Math.max(0, enemy.currentHp)} HP left)`,
        );
      }

      enemyTimer += interval;
      if (enemyTimer >= enemy.attackPerSec) {
        enemyTimer = 0;
        const damage =
          Math.floor(Math.random() * (enemy.maxDamage - enemy.minDamage + 1)) +
          enemy.minDamage;
        player.hp -= damage;
        if (player.hp < 0) player.hp = 0;
        log(`The ${enemy.name} hits you for ${damage} damage.`);
        updateUI();
      }

      if (enemy.currentHp <= 0) {
        clearInterval(combatLoop);
        const reward = 10;
        player.copper += reward;
        player.xp += enemy.xp || 10; // Default XP reward if not specified
        document.getElementById("enemyHealthBarContainer").style.display =
          "none";
        log(
          `You defeated the ${enemy.name}! Looted ${formatCurrency(reward)}.`,
        );
        checkLevelUp();
        updateUI();
      }
    }, interval);
  }

  function renderLocationUI() {
    const locationInfo = document.getElementById("locationInfo");
    const locationActions = document.getElementById("locationActions");
    const loc = locations[currentLocation];
    if (!loc) return;

    locationInfo.innerHTML = `<h2>${loc.name}</h2><p>${loc.description}</p>`;
    locationActions.innerHTML = "";

    loc.actions.forEach((action) => {
      const btn = document.createElement("button");
      btn.textContent = capitalize(action);
      btn.onclick = (e) => handleLocationAction(action, e);
      locationActions.appendChild(btn);
    });

    locationSelect.value = currentLocation;
  }

  function handleLocationAction(action, event) {
    const loc = locations[currentLocation];

    if (action === "rest") {
      const restCost = 100;
      if (player.copper >= restCost) {
        player.copper -= restCost;
        player.hp = player.maxHp;
        player.regenBuffer = 0;
        log(`You rest and fully heal for ${formatCurrency(restCost)}.`);
        updateUI();
      } else {
        log("You don't have enough money to rest.");
      }
    } else if (action === "shop") {
      log("The shop is not implemented yet.");
    } else if (action === "fight" || action === "explore") {
      if (!loc.encounters || loc.encounters.length === 0) {
        log("Nothing to fight here.");
        return;
      }
      const enemyName =
        loc.encounters[Math.floor(Math.random() * loc.encounters.length)];
      const enemy = JSON.parse(
        JSON.stringify(enemies.find((e) => e.name === enemyName)),
      );
      enemy.currentHp = enemy.hp;
      startCombat(enemy);
    } else if (action === "chop wood") {
      const btn = Array.from(document.querySelectorAll("#locationActions button"))
        .find(b => b.textContent.toLowerCase().includes("chop"));
      if (btn) toggleWoodcutting(event);
    }
  }


  window.switchLocation = function (newLoc) {
    if (locations[newLoc]) {
      currentLocation = newLoc;
      log(`You travel to the ${locations[newLoc].name}.`);
      renderLocationUI();
    }
  };

  locationSelect.addEventListener("change", (e) => {
    switchLocation(e.target.value);
  });

  document.getElementById('statConWrapper').addEventListener('mouseover', (e) =>
    showTooltip('Constitution increases health gained on level-up.', e.pageX, e.pageY));
  document.getElementById('statConWrapper').addEventListener('mousemove', (e) =>
    showTooltip('Constitution increases health gained on level-up.', e.pageX, e.pageY));
  document.getElementById('statConWrapper').addEventListener('mouseleave', hideTooltip);

  applyEquipmentBonuses();
  updateUI();
  renderLocationUI();
  
  // Passive health regeneration every second
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
});
