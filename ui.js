// === DOM ELEMENT REFERENCES ===
// Get references to key UI elements for game control and display
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const moneyDisplay = document.getElementById("money-display");
    const livesDisplay = document.getElementById("lives-display");
    const waveDisplay = document.getElementById("wave-display");
    const enemiesLeftDisplay = document.getElementById("enemies-left");
    const towerMenu = document.getElementById("tower-menu");
    const startBtn = document.getElementById("startBtn");
    const stopBtn = document.getElementById("stopBtn");
    const autoBtn = document.getElementById("autoBtn");
    const speedBtn = document.getElementById("speedBtn");
    const upgradePanel = document.getElementById("upgrade-panel");
    const upgrade1Btn = document.getElementById("upgrade1Btn");
    const upgrade2Btn = document.getElementById("upgrade2Btn");
    const sellBtn = document.getElementById("sellBtn");
    const messageBox = document.getElementById("message-box");

    // === TOWER PLACEMENT STATE ===
// Tracks user input and UI context for tower placement

    let selectedTowerType = null,
      placingTower = false,
      selectedTower = null,
      hoveredTower = null;
      // Mouse position for tower placement

    let placementX = 0, placementY = 0;

         // === EVENT LISTENERS ===
// Cancel button: exits tower placement mode

      document.getElementById("cancelTowerBtn").addEventListener("click", () => {
        placingTower = false;
        selectedTowerType = null;
      });
// Display a temporary message in the message box

    function showMessage(text, duration = 2000) {
      clearTimeout(messageBox.clearTimeout);
      messageBox.textContent = text;
      messageBox.style.opacity = "1";
      messageBox.clearTimeout = setTimeout(
        () => (messageBox.style.opacity = "0"),
        duration
      );
    }

    // Update top HUD displays (money, lives, wave, enemies left)

    function updateDisplays() {
      moneyDisplay.textContent = `Money: ${money}`;
      livesDisplay.textContent = `Lives: ${lives}`;
      waveDisplay.textContent = `Wave: ${waveNumber}`;
      enemiesLeftDisplay.textContent = `Enemies Left: ${enemies.length + enemiesToSpawn}`;
    }


    
      // === HANDLE CANVAS CLICK ===
    canvas.addEventListener("click", (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      // === PLACING A NEW TOWER ===
      if (placingTower && selectedTowerType) {
        // Block path overlap
        let onPath = false;
        for (let i = 0; i < enemyPath.length - 1; i++) {
          const p = enemyPath[i], q = enemyPath[i + 1];
          const dx = q.x - p.x, dy = q.y - p.y;
          const t = ((mx - p.x) * dx + (my - p.y) * dy) / (dx * dx + dy * dy);
          if (t > 0 && t < 1) {
            const cx = p.x + t * dx, cy = p.y + t * dy;
            if (distance(mx, my, cx, cy) < 40) onPath = true;
          }
        }
        if (onPath) return showMessage("Cannot place on the path!", 1000);

        // Block overlapping another tower
        if (towers.some(t => distance(t.x, t.y, mx, my) < 40)) {
          return showMessage("Too close to another tower!", 1000);
        }

        // Check money
        const cost = towerCosts[selectedTowerType];
        if (money < cost) return showMessage("Not enough money!", 1000);

        // Place tower
        money -= cost;
        towers.push(new Tower(mx, my, selectedTowerType));
        placingTower = false;
        selectedTowerType = null;
        updateDisplays();
        return;
      }

            // === SELECTING A TOWER FOR UPGRADES ===
      selectedTower = towers.find(t => distance(mx, my, t.x, t.y) < 20) || null;
      upgradePanel.style.display = selectedTower ? "block" : "none";

      if (selectedTower) {
        const type = selectedTower.type;

        // Update upgrade buttons with text and cost
        upgrade1Btn.textContent = `Path 1: ${upgradeDescriptions[type][0]} ($${upgradeCosts[type][0]})`;
        upgrade2Btn.textContent = `Path 2: ${upgradeDescriptions[type][1]} ($${upgradeCosts[type][1]})`;

        // Display icons
        const icons = [];
        const up = selectedTower.upgrades;
        if (up.path1 > 0) icons.push(upgradePaths[type].path1[1]);
        if (up.path2 > 0) icons.push(upgradePaths[type].path2[1]);
        document.getElementById("upgrade-icons").innerHTML = icons.join(" ");

        // Lock conflicting upgrade path
        if (up.path1 > 0) {
          upgrade2Btn.disabled = true;
          upgrade2Btn.textContent += " (Locked)";
        } else if (up.path2 > 0) {
          upgrade1Btn.disabled = true;
          upgrade1Btn.textContent += " (Locked)";
        } else {
          upgrade1Btn.disabled = false;
          upgrade2Btn.disabled = false;
        }

        // Show sell value
        sellBtn.textContent = `Sell Tower ($${Math.floor(towerCosts[type] / 2)})`;
      }
    });

        // === SHOW TOWER PREVIEW ON HOVER ===
    towerMenu.addEventListener("mouseover", (e) => {
      if (e.target.tagName !== "BUTTON") return;
      const towerType = e.target.dataset.tower;
      const cost = towerCosts[towerType];
      const desc = upgradeDescriptions[towerType] || ["", ""];

      const previewBox = document.getElementById("tower-preview");
      const nameBox = document.getElementById("preview-name");
      const costBox = document.getElementById("preview-cost");
      const statBox = document.getElementById("preview-stats");

      nameBox.textContent = towerType + " Tower";
      costBox.textContent = `Cost: $${cost}`;
      statBox.innerHTML = `
        <li>🛠 Path 1: ${desc[0]}</li>
        <li>🧪 Path 2: ${desc[1]}</li>
      `;
      previewBox.style.display = "block";
    });

    // === HIDE TOWER PREVIEW ON EXIT ===
    towerMenu.addEventListener("mouseout", (e) => {
      if (e.target.tagName !== "BUTTON") return;
      document.getElementById("tower-preview").style.display = "none";
    });




    // === UPGRADE BUTTON PATH 1 ===
    upgrade1Btn.addEventListener("click", () => {
      if (!selectedTower) return;

      const type = selectedTower.type;
      const cost = upgradeCosts[type][0];

      // Block if path 2 already used
      if (selectedTower.upgrades.path2 > 0) {
        return showMessage("❌ You already upgraded Path 2!", 1500);
      }

      if (money < cost) return showMessage("Not enough money!", 1500);

      // Apply upgrade
      money -= cost;
      selectedTower.level++;
      selectedTower.upgrades.path1++;
      upgradeEffects[type][0](selectedTower);

      updateDisplays();
      showMessage(`✅ ${type} Path 1 Upgraded!`, 1500);
    });


    // === UPGRADE BUTTON PATH 2 ===
    upgrade2Btn.addEventListener("click", () => {
      if (!selectedTower) return;

      const type = selectedTower.type;
      const cost = upgradeCosts[type][1];

      // Block if path 1 already used
      if (selectedTower.upgrades.path1 > 0) {
        return showMessage("❌ You already upgraded Path 1!", 1500);
      }

      if (money < cost) return showMessage("Not enough money!", 1500);

      // Apply upgrade
      money -= cost;
      selectedTower.level++;
      selectedTower.upgrades.path2++;

      // Apply custom effect based on tower type
      switch (type) {
        case "basic":
          selectedTower.damage += 15;
          break;
        case "sniper":
          selectedTower.reloadSpeed = Math.max(5, selectedTower.reloadSpeed - 10);
          break;
        case "cannon":
          selectedTower.range += 25;
          break;
        case "flame":
          selectedTower.range += 25;
          selectedTower.damage += 3;
          break;
        case "ice":
          selectedTower.damage += 12;
          break;
        case "tesla":
          selectedTower.reloadSpeed = Math.max(6, selectedTower.reloadSpeed - 6);
          break;
        case "missile":
          selectedTower.reloadSpeed = Math.max(25, selectedTower.reloadSpeed - 20);
          break;
        case "sniperElite":
          selectedTower.damage += 40;
          break;
        case "Obsidian":
          selectedTower.damage += 25;
          break;
        case "Nova":
          selectedTower.reloadSpeed = Math.max(10, selectedTower.reloadSpeed - 8);
          break;
        case "poison":
          selectedTower.damage += 12;
          break;
        case "railgun":
          selectedTower.reloadSpeed = Math.max(8, selectedTower.reloadSpeed - 10);
          break;
      }

      updateDisplays();
      showMessage(`✅ ${type} Path 2 Upgraded!`, 1500);
    });

    // === SELL TOWER BUTTON ===
    sellBtn.addEventListener("click", () => {
      if (!selectedTower) return;
      const refund = Math.floor(towerCosts[selectedTower.type] / 2);
      money += refund;
      towers = towers.filter((t) => t !== selectedTower);
      selectedTower = null;
      upgradePanel.style.display = "none";
      updateDisplays();
      showMessage(`Sold for $${refund}`, 1500);
    });

    // === START WAVE BUTTON ===
    startBtn.addEventListener("click", startWave);

    // === PAUSE / RESUME BUTTON ===
    stopBtn.addEventListener("click", () => {
      gamePaused = !gamePaused;
      stopBtn.textContent = gamePaused ? "Resume" : "Pause";
      showMessage(gamePaused ? "Game Paused" : "Game Resumed", 1000);
    });

    // === AUTO START TOGGLE ===
    autoBtn.addEventListener("click", () => {
      autoStart = !autoStart;
      autoBtn.textContent = `Auto Start: ${autoStart ? "ON" : "OFF"}`;
    });

    // === GAME SPEED CYCLE BUTTON ===
    speedBtn.addEventListener("click", () => {
      gameSpeed = gameSpeed >= 10 ? 1 : gameSpeed + 1;
      speedBtn.textContent = `Speed: ${gameSpeed}x`;
    });

    
    updateDisplays();
    startWave();
    requestAnimationFrame(gameLoop);

    // === ENEMY INFO UI SETUP ===
    const enemyInfoBtn = document.getElementById("enemyInfoBtn");
    const enemyInfoPanel = document.getElementById("enemy-info-panel");
    const enemyList = document.getElementById("enemy-list");
    const closeEnemyInfoBtn = document.getElementById("closeEnemyInfoBtn");

    // === ENEMY DESCRIPTIONS ===
    const enemyDescriptions = {
      normal: "Standard tank — balanced health & speed.",
      fast: "Fast-moving jeep — low health, quick.",
      armoredBoss: "Heavy tank with strong armor.",
      shielded: "Tank with a protective forcefield.",
      regenerator: "APC that regenerates health over time.",
      flying: "Jet that flies over obstacles.",
      titan: "Massive dropship — huge health pool.",
      specter: "Stealth drone that evades bullets.",
      inferno: "Flame mech with burn aura."
    };

    // === OPEN ENEMY INFO PANEL ===
    enemyInfoBtn.addEventListener("click", () => {
      enemyList.innerHTML = "";
      Object.keys(enemySprites).forEach(type => {
        const card = document.createElement("div");
        card.className = "enemy-card";
        const img = enemySprites[type].cloneNode();
        const name = document.createElement("strong");
        name.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        const desc = document.createElement("p");
        desc.textContent = enemyDescriptions[type] || "No description.";
        card.appendChild(img);
        card.appendChild(name);
        card.appendChild(desc);
        enemyList.appendChild(card);
      });
      enemyInfoPanel.style.display = "block";
    });

    // === CLOSE ENEMY INFO PANEL ===
    closeEnemyInfoBtn.addEventListener("click", () => {
      enemyInfoPanel.style.display = "none";
    });