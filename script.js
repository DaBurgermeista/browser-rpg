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

  // Woodcutting logic Variables
  let currentTree = null;
  const treeStages = [
    "You steady your axe.",
    "You swing and chip the bark.",
    "You dig deeper into the trunk.",
    "The tree creaks under pressure.",
    "Sap trickles from the wound.",
    "It’s almost ready to fall...",
  ];

  document.addEventListener("mousemove", (e) => {
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
      { item: items["Rusty Dagger"], quantity: 1 },
      { item: items["Tattered Cloak"], quantity: 1 },
      { item: items["Lucky Coin"], quantity: 1 },
    ],
  };

  window.playerSkills = {
    woodcutting: {
      xp: 0,
      totalXp: 0,
      level: 1,
      xpToNext: 83,
    },
  };

  // Tree types with required levels and log rewards
  const treeTypes = {
    pine: {
      name: "Pine",
      requiredLevel: 1,
      stages: [
        "You steady your axe against the pine bark.",
        "You make a clean cut into the soft wood.",
        "Sap leaks from the tree as you continue chopping.",
        "The tree begins to lean...",
        "A loud crack echoes through the woods.",
      ],
      xpPerStage: 5,
      rewardItem: "Pine Log",
    },
    oak: {
      name: "Oak",
      requiredLevel: 5,
      stages: [
        "You grip your axe tightly against the oak.",
        "You swing hard, but the oak resists.",
        "The tree shakes as you dig deeper.",
        "A loud crack echoes through the woods.",
        "The oak begins to splinter...",
      ],
      xpPerStage: 8,
      rewardItem: "Oak Log",
    },
    //TODO Add more trees later...
  };

  let currentLocation = "town";
  let woodcuttingInterval = null;
  let isChopping = false;

  function getSkillLevel(skill) {
    const xp = playerSkills[skill].totalXp;
    let level = 1;
    let totalXp = 0;

    for (let i = 1; i <= 99; i++) {
      totalXp += Math.floor(i + 300 * Math.pow(2, i / 7));
      const scaledXp = Math.floor(totalXp / 4);

      if (xp < scaledXp) return level;
      level = i + 1;
    }

    return level;
  }

  function addSkillXp(skill, amount) {
    const skillObj = playerSkills[skill];
    skillObj.xp += amount;
    skillObj.totalXp += amount;

    // Determine current level before assigning
    const oldLevel = skillObj.level;
    const newLevel = getSkillLevel(skill);

    if (newLevel > oldLevel) {
      skillObj.level = newLevel;
      skillObj.xp = 0; // Reset XP for next level
      log(`🪓 Your ${skill} level is now ${newLevel}!`);
    }

    // Calculate XP required for next level (from current level to +1)
    let totalXp = 0;
    for (let i = 1; i < newLevel + 1; i++) {
      totalXp += Math.floor(i + 300 * Math.pow(2, i / 7));
    }

    skillObj.xpToNext = Math.floor(totalXp / 4 - skillObj.xp);
    renderSkillTab();
  }

  // Render skills tab
  function renderSkillTab() {
    const container = document.getElementById("skillsList");
    if (!container) return;

    container.innerHTML = "";

    Object.entries(playerSkills).forEach(([key, skill]) => {
      const row = document.createElement("div");
      const progress = skill.xpToNext
        ? ` (${skill.xp} / ${skill.xp + skill.xpToNext} XP)`
        : ` (${skill.xp} XP)`; // fallback if xpToNext not defined
      row.textContent = `${capitalize(key)}: Level ${skill.level}${progress}`;
      container.appendChild(row);
    });
  }

  /*
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
  */

  function stopWoodcutting() {
    if (!isChopping) return;

    clearInterval(woodcuttingInterval);
    woodcuttingInterval = null;
    isChopping = false;
    // Store the key before clearing currentTree
    const treeKeyBeforeStop = currentTree?.key;
    currentTree = null;
    log("You stop chopping wood.");

    renderLocationUI();
    updateUI();
  }

  function startNewTree() {
    const loc = locations[currentLocation];
    const availableTrees = loc.trees || [];

    const eligibleTrees = availableTrees.filter(
      (key) => getSkillLevel("woodcutting") >= treeTypes[key].requiredLevel,
    );

    if (eligibleTrees.length === 0) {
      log("You don't have the skill to chop any trees here.");
      stopWoodcutting();
      return;
    }

    const chosenKey =
      eligibleTrees[Math.floor(Math.random() * eligibleTrees.length)];
    const chosenTree = treeTypes[chosenKey];

    currentTree = {
      key: chosenKey,
      type: chosenTree,
      stage: 0,
      totalStages: chosenTree.stages.length,
    };
  }

  function toggleWoodcutting(treeKey) {
    const btn = document.querySelector("#locationActions button.chop-button");

    if (isChopping) {
      stopWoodcutting();
      if (btn) btn.textContent = "Chop Wood";
      return;
    }

    // Prevent multiple intervals just in case
    stopWoodcutting();

    log("You grip your axe and face the tree...");
    isChopping = true;
    currentTree = {
      key: treeKey,
      type: treeTypes[treeKey],
      stage: 0,
      totalStages: treeTypes[treeKey].stages.length,
    };
    if (btn) btn.textContent = "Stop Chopping";

    woodcuttingInterval = setInterval(() => {
      if (!isChopping || !currentTree) {
        stopWoodcutting();
        return;
      }

      // Calculate failure chance based on player level vs required level
      const playerLevel = getSkillLevel("woodcutting");
      const requiredLevel = currentTree.type.requiredLevel;
      const levelDiff = Math.max(0, requiredLevel - playerLevel);
      let failChance = 0.25 - (playerLevel - requiredLevel) * 0.01;
      failChance = Math.max(0.05, Math.min(0.25, failChance)); // clamp between 5% and 25%

      if (Math.random() < failChance) {
        log("You swing and miss. The tree remains untouched.");
        return;
      }

      const stage = currentTree.stage++;
      addSkillXp("woodcutting", currentTree.type.xpPerStage);

      if (stage < currentTree.totalStages) {
        log(
          currentTree.type.stages[Math.min(stage, currentTree.totalStages - 1)],
        );
      } else {
        // Give log item reward instead of copper
        const rewardItemKey = currentTree.type.rewardItem;
        const rewardItem = items[rewardItemKey];
        if (rewardItem) {
          // Add or increment item in inventory
          const existing = player.inventory.find((i) => i.item === rewardItem);
          if (existing) {
            existing.quantity++;
          } else {
            player.inventory.push({ item: rewardItem, quantity: 1 });
          }
          log(
            `🪓 You collect 1 ${rewardItem.name} from the fallen ${currentTree.type.name} tree.`,
          );
        } else {
          log("The tree falls, but you find nothing worth keeping.");
        }
        currentTree = null;

        if (currentLocation === "woods" && !locations["clearing"].discovered) {
          if (Math.random() < 0.05) unlockLocation("clearing");
        }

        startNewTree();
      }

      updateUI();
    }, 2000);
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
    const xpPct = Math.floor((player.xp / player.xpToNext) * 100);
    document.getElementById("compactXpText").textContent =
      `XP: ${player.xp} / ${player.xpToNext}`;

    const xpBar = document.getElementById("compactPlayerXpBar");
    if (xpBar) {
      xpBar.style.width = `${xpPct}%`;
    }
    document.getElementById("statCon").textContent =
      player.constitution.toFixed(3);
    player.attackSpeed = calculateAttackSpeed(player);

    const hpPct = Math.floor((player.hp / player.maxHp) * 100);
    document.getElementById("compactHpText").textContent =
      `HP: ${Math.floor(player.hp)} / ${player.maxHp}`;
    document.getElementById("compactPlayerHealthBar").style.width = `${hpPct}%`;
    const compactPct = Math.floor((player.hp / player.maxHp) * 100);
    const compactBar = document.getElementById("compactPlayerHealthBar");
    if (compactBar) {
      compactBar.style.width = `${compactPct}%`;
    }

    const hpDisplay = document.getElementById("hp");
    if (hpDisplay) {
      hpDisplay.textContent = Math.floor(player.hp);
    }

    currencyDisplay.textContent = formatCurrency(player.copper);
    strDisplay.textContent = player.strength.toFixed(3);
    dexDisplay.textContent = player.dexterity.toFixed(3);
    apsLabel.textContent = getSpeedLabel(player.attackSpeed);

    // Player bar
    const pct = Math.floor((player.hp / player.maxHp) * 100);
    const bar = document.getElementById("playerHealthBar");
    const hpText = document.getElementById("playerHpText");
    if (bar) bar.style.width = `${pct}%`;
    if (hpText)
      hpText.textContent = `${Math.floor(player.hp)} / ${player.maxHp}`;

    renderInventory();
    renderEquipmentTab();
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
    tooltip += `<em class="tooltip-sub">Type: ${item.slot.toUpperCase()}</em><br>`;
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
    tooltip.innerHTML = text;
    tooltip.style.display = "block";
    // Positioning logic with overflow protection and above-cursor display
    requestAnimationFrame(() => {
      const tooltipRect = tooltip.getBoundingClientRect();
      let adjustedX = x + 10;
      let adjustedY = y - tooltipRect.height - 10;

      // Prevent overflow to the right
      if (adjustedX + tooltipRect.width > window.innerWidth) {
        adjustedX = window.innerWidth - tooltipRect.width - 10;
      }
      // Prevent overflow above
      if (adjustedY < 0) {
        adjustedY = y + 10; // fallback to below cursor
      }

      tooltip.style.left = adjustedX + "px";
      tooltip.style.top = adjustedY + "px";
    });
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

  // Render equipment tab: show equipped items with inventory-item style and tooltips
  function renderEquipmentTab() {
    const equipmentDiv = document.getElementById("equipmentDisplay");
    if (!equipmentDiv) return;

    equipmentDiv.innerHTML = "";

    for (const slot of [
      "weapon",
      "offhand",
      "armor",
      "helmet",
      "gloves",
      "boots",
      "accessory",
      "belt",
      "cloak",
    ]) {
      const item = player.equipment[slot];
      const itemDiv = document.createElement("div");
      itemDiv.classList.add("inventory-item");

      if (item) {
        itemDiv.textContent = item.name;
        itemDiv.onmouseover = (e) =>
          showTooltip(getItemTooltip(item), e.clientX, e.clientY - 20);
        itemDiv.onmousemove = (e) =>
          showTooltip(getItemTooltip(item), e.clientX, e.clientY - 20);
        itemDiv.onmouseleave = hideTooltip;
        itemDiv.onclick = () => {
          // Unequip the item
          const equippedItem = player.equipment[slot];
          if (equippedItem) {
            const existing = player.inventory.find(
              (i) => i.item === equippedItem,
            );
            if (existing) {
              existing.quantity++;
            } else {
              player.inventory.push({ item: equippedItem, quantity: 1 });
            }
            player.equipment[slot] = null;
            applyEquipmentBonuses();
            updateUI();
          }
        };
      } else {
        itemDiv.textContent = `${capitalize(slot)}: None`;
        itemDiv.classList.add("empty-slot");
      }

      equipmentDiv.appendChild(itemDiv);
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

    player.inventory.forEach(({ item, quantity }, index) => {
      const itemDiv = document.createElement("div");
      itemDiv.classList.add("inventory-item");
      itemDiv.textContent =
        quantity > 1 ? `${item.name} (x${quantity})` : item.name;
      itemDiv.onmouseover = (e) =>
        showTooltip(getItemTooltip(item), e.clientX, e.clientY - 20);
      itemDiv.onmousemove = (e) =>
        showTooltip(getItemTooltip(item), e.clientX, e.clientY - 20);
      itemDiv.onmouseleave = hideTooltip;

      itemDiv.onclick = () => {
        const slot = item.slot;
        if (!slot || !player.equipment.hasOwnProperty(slot)) {
          log(`${item.name} cannot be equipped.`);
          return;
        }

        if (player.equipment[slot] === item) {
          // Unequip the item
          const existing = player.inventory.find((i) => i.item === item);
          if (existing) {
            existing.quantity++;
          } else {
            player.inventory.push({ item: item, quantity: 1 });
          }
          player.equipment[slot] = null;
          applyEquipmentBonuses();
          updateUI();
          return;
        }

        if (player.equipment[slot]) {
          const equipped = player.equipment[slot];
          const found = player.inventory.find((i) => i.item === equipped);
          if (found) {
            found.quantity++;
          } else {
            player.inventory.push({ item: equipped, quantity: 1 });
          }
        }

        player.equipment[slot] = item;
        if (quantity > 1) {
          player.inventory[index].quantity--;
        } else {
          player.inventory.splice(index, 1);
        }
        applyEquipmentBonuses();
        updateUI();
      };

      inventoryDiv.appendChild(itemDiv);
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
      if (player.hp <= 0) {
        player.alive = false;
        clearInterval(combatLoop);
        log("💀 You died! Respawning in town…");
        setTimeout(() => {
          Object.assign(player, {
            hp: player.maxHp,
            copper: Math.max(0, player.copper - 50),
          });
          stopWoodcutting();
          currentLocation = "town";
          player.alive = true;
          renderLocationUI();
          updateUI();
        }, 3000);
        return;
      } // TODO: Clear enemy health bar

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
      if (action === "chop wood") {
        const availableTrees = loc.trees || [];
        const eligibleTrees = availableTrees.filter(
          (key) => getSkillLevel("woodcutting") >= treeTypes[key].requiredLevel,
        );

        if (eligibleTrees.length === 0) {
          const msg = document.createElement("p");
          msg.textContent = "You don't have the skill to chop any trees here.";
          locationActions.appendChild(msg);
          return;
        }

        eligibleTrees.forEach((treeKey) => {
          const btn = document.createElement("button");
          btn.textContent = `Chop ${treeTypes[treeKey].name}`;
          btn.classList.add("chop-button");
          btn.onclick = () => toggleWoodcutting(treeKey);
          locationActions.appendChild(btn);
        });
      } else {
        const btn = document.createElement("button");
        btn.textContent = capitalize(action);
        btn.onclick = (e) => handleLocationAction(action, e);
        locationActions.appendChild(btn);
      }
    });

    locationSelect.value = currentLocation;
  }

  const locationList = document.getElementById("locationList");

  function renderLocationList() {
    if (!locationList) return;
    locationList.innerHTML = "";

    const loc = locations[currentLocation];
    if (!loc || !loc.connections) return;

    loc.connections.forEach((key) => {
      const target = locations[key];
      const li = document.createElement("li");

      if (target.discovered) {
        li.textContent = target.name;
        li.style.cursor = "pointer";
        li.onclick = () => {
          currentLocation = key;
          log(`You travel to the ${target.name}.`);
          renderLocationUI();
          renderLocationList();
        };
      } else {
        li.textContent = "???";
        li.style.color = "#888";
      }

      locationList.appendChild(li);
    });
  }

  function renderLocationDropdown() {
    locationSelect.innerHTML = "";
    Object.entries(locations).forEach(([key, loc]) => {
      if (loc.discovered && loc.isHub) {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = loc.name;
        locationSelect.appendChild(option);
      }
    });
    locationSelect.value = currentLocation;
  }

  function unlockLocation(key) {
    const loc = locations[key];
    if (loc && !loc.discovered) {
      loc.discovered = true;
      log(`You discovered ${loc.name}!`);
      renderLocationDropdown();
      renderLocationList();
    }
  }

  function handleLocationAction(action, event) {
    const loc = locations[currentLocation];

    // Only stop woodcutting for actions other than chopping
    if (action !== "chop wood") {
      stopWoodcutting();
    }

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
      const btn = Array.from(
        document.querySelectorAll("#locationActions button"),
      ).find((b) => b.textContent.toLowerCase().includes("chop"));
      if (btn) toggleWoodcutting(event);
    }
  }

  window.switchLocation = function (newLoc) {
    if (locations[newLoc]) {
      stopWoodcutting();
      currentLocation = newLoc;
      log(`You travel to the ${locations[newLoc].name}.`);
      renderLocationUI();
    }
  };

  locationSelect.addEventListener("change", (e) => {
    switchLocation(e.target.value);
  });

  // Tab switching logic
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      const targetTab = button.dataset.tab;

      // Remove active class from all buttons
      document
        .querySelectorAll(".tab-button")
        .forEach((btn) => btn.classList.remove("active"));

      // Hide all tab contents
      document
        .querySelectorAll(".tab-content")
        .forEach((tab) => tab.classList.add("hidden"));

      // Activate clicked button and show relevant tab
      button.classList.add("active");
      document.getElementById(targetTab).classList.remove("hidden");
    });
  });

  // Tooltip binding (only once)
  const conWrapper = document.getElementById("statConWrapper");
  const strWrapper = document.getElementById("statStrWrapper");
  const dexWrapper = document.getElementById("statDexWrapper");
  if (conWrapper) {
    conWrapper.addEventListener("mouseover", (e) =>
      showTooltip(
        "Constitution increases health gained on level-up.",
        e.pageX,
        e.pageY,
      ),
    );
    conWrapper.addEventListener("mousemove", (e) =>
      showTooltip(
        "Constitution increases health gained on level-up.",
        e.pageX,
        e.pageY,
      ),
    );
    conWrapper.addEventListener("mouseleave", hideTooltip);
  }
  if (strWrapper) {
    strWrapper.addEventListener("mouseover", (e) =>
      showTooltip("Strength increases damage.", e.pageX, e.pageY),
    );
    strWrapper.addEventListener("mousemove", (e) =>
      showTooltip("Strength increases damage.", e.pageX, e.pageY),
    );
    strWrapper.addEventListener("mouseleave", hideTooltip);
  }
  if (dexWrapper) {
    dexWrapper.addEventListener("mouseover", (e) =>
      showTooltip("Dexterity increases attack speed.", e.pageX, e.pageY),
    );
    dexWrapper.addEventListener("mousemove", (e) =>
      showTooltip("Dexterity increases attack speed.", e.pageX, e.pageY),
    );
  }

  // At the very end of DOMContentLoaded
  const SAVE_KEY = "rpgSave";
  function saveGame() {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({ player, playerSkills, locations }),
    );
  }
  function loadGame() {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    if (data) {
      Object.assign(player, data.player);
      Object.assign(playerSkills, data.playerSkills);
      Object.entries(data.locations).forEach(([k, v]) =>
        Object.assign(locations[k], v),
      );
    }
  }
  window.addEventListener("beforeunload", saveGame);
  loadGame();
  updateUI();

  applyEquipmentBonuses();
  updateUI();
  renderLocationUI();
  renderLocationList();
  renderLocationDropdown();
  renderSkillTab();

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
