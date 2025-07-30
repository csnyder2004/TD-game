  
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

// === GAME STATE VARIABLES ===
// These track the player's current resources, wave progress, and game settings

    let money = 500,
      lives = 10,
      waveNumber = 0,
      enemiesToSpawn = 0,
      spawning = false,
      spawnTimer = 0,
      gamePaused = false,
      autoStart = true,
      gameSpeed = 1,
      enemyTypes = ["normal", "fast"];

// === TOWER PLACEMENT STATE ===
// Tracks user input and UI context for tower placement

    let selectedTowerType = null,
      placingTower = false,
      selectedTower = null,
      hoveredTower = null;

// Mouse position for tower placement

    let placementX = 0, placementY = 0;

// === GAME ENTITIES ===
// Dynamic game objects stored and updated each fram

    let towers = [],
      enemies = [],
      bullets = [],
      effects = [];

      // === EVENT LISTENERS ===
// Cancel button: exits tower placement mode

      document.getElementById("cancelTowerBtn").addEventListener("click", () => {
        placingTower = false;
        selectedTowerType = null;
      });

// === TOWER COSTS ===
// Initial purchase cost for each tower type

    const towerCosts = {
      basic: 50,
      sniper: 120,
      cannon: 150,
      flame: 200,
      ice: 200,
      tesla: 300,
      missile: 350,
      sniperElite: 400,
      Obsidian: 500,
      Nova: 650,
      poison: 250,
      railgun: 800,
      hyperLaser: 4000,
      omegaCannon: 10000,
    };

// === UPGRADE EFFECTS ===
// Functional upgrades applied to each tower per path (usually modifies stats like damage, range, reload)
    
    const upgradeEffects = {
      basic: [
        tower => { tower.reloadSpeed = Math.max(3, tower.reloadSpeed - 4); },
        tower => { tower.damage += 15; }
      ],
      sniper: [
        tower => { tower.range += 50; },
        tower => { tower.reloadSpeed = Math.max(5, tower.reloadSpeed - 10); }
      ],
      cannon: [
        tower => { tower.damage += 25; },
        tower => { tower.range += 25; }
      ],
      flame: [
        tower => {
          tower.damage += 7;
          tower.reloadSpeed = Math.max(2, tower.reloadSpeed - 2);
        },
        tower => {
          tower.range += 25;
          tower.damage += 3;
        }
      ],
      ice: [
        tower => { tower.reloadSpeed = Math.max(5, tower.reloadSpeed - 7); },
        tower => { tower.damage += 12; }
      ],
      tesla: [
        tower => { tower.range += 30; },
        tower => { tower.reloadSpeed = Math.max(6, tower.reloadSpeed - 6); }
      ],
      missile: [
        tower => { tower.damage += 30; },
        tower => { tower.reloadSpeed = Math.max(25, tower.reloadSpeed - 20); }
      ],
      sniperElite: [
        tower => { tower.range += 60; },
        tower => { tower.damage += 40; }
      ],
      Obsidian: [
        tower => { tower.reloadSpeed = Math.max(5, tower.reloadSpeed - 5); },
        tower => { tower.damage += 25; }
      ],
      Nova: [
        tower => { tower.range += 40; },
        tower => { tower.reloadSpeed = Math.max(10, tower.reloadSpeed - 8); }
      ],
      poison: [
        tower => { tower.range += 30; },
        tower => { tower.damage += 12; }
      ],
      railgun: [
        tower => { tower.damage += 150; },
        tower => { tower.reloadSpeed = Math.max(8, tower.reloadSpeed - 10); }
      ],
      hyperLaser: [
        tower => { tower.reloadSpeed = Math.max(0.5, tower.reloadSpeed - 1); }, // insanely fast
        tower => { tower.damage += 35; } // major damage boost
      ],
        omegaCannon: [
        tower => { tower.damage += 400; tower.range += 100; },
        tower => { tower.reloadSpeed = Math.max(5, tower.reloadSpeed - 10); }
      ],


    };

// === UPGRADE COSTS ===
// Each tower has 2 upgrade path costs [Path1, Path2]

    const upgradeCosts = {
      basic: [30, 50],
      sniper: [60, 100],
      cannon: [70, 120],
      flame: [60, 100],
      ice: [70, 120],
      tesla: [100, 150],
      missile: [120, 180],
      sniperElite: [150, 220],
      Obsidian: [200, 300],
      Nova: [300, 400],
      poison: [70, 90],
      railgun: [400, 500],
      hyperLaser: [1200, 1800],
      omegaCannon: [2000, 3000],


    };

// === TOWER UPGRADE UI DATA ===
// Icons (emojis) and shorthand for each tower's upgrade paths

    const upgradePaths = {
      basic: { path1: ["+fireRate", "🔁"], path2: ["+damage", "💥"] },
      sniper: { path1: ["+range", "🎯"], path2: ["+damage", "🔥"] },
      cannon: { path1: ["+damage", "💣"], path2: ["+range", "📏"] },
      flame: { path1: ["+damage", "🔥"], path2: ["+range", "🌡️"] },
      ice: { path1: ["+fireRate", "❄️"], path2: ["+damage", "🧊"] },
      tesla: { path1: ["+range", "⚡"], path2: ["+fireRate", "🔋"] },
      missile: { path1: ["+damage", "🚀"], path2: ["+fireRate", "🧨"] },
      sniperElite: { path1: ["+range", "🧿"], path2: ["+damage", "🔫"] },
      Obsidian: { path1: ["+fireRate", "🔥"], path2: ["+damage", "🌋"] },
      Nova: { path1: ["+range", "🌟"], path2: ["+fireRate", "☀️"] },
      poison: { path1: ["+range", "☠️"], path2: ["+poison", "🧪"] },
      railgun: { path1: ["+damage", "📡"], path2: ["+fireRate", "⚙️"] },
      hyperLaser: { path1: ["+fireRate", "🌞"], path2: ["+damage", "⚡"] },
      omegaCannon: { path1: ["+damage/range", "💥"], path2: ["+fireRate", "⚡"] },


    };

// Tooltip-style descriptions for upgrade buttons

    const upgradeDescriptions = {
      basic: [
        "Faster shooting speed", 
        "More powerful bullets"
      ],
      sniper: [
        "Increased range to snipe from afar", 
        "High-caliber rounds for double damage"
      ],
      cannon: [
        "Stronger explosion damage", 
        "Wider blast radius"
      ],
      flame: [
        "Hotter flames that burn faster", 
        "Extended flamethrower reach"
      ],
      ice: [
        "Rapid chilling for quick shots", 
        "Deeper freeze for more damage"
      ],
      tesla: [
        "Extended shock range", 
        "Faster energy bursts"
      ],
      missile: [
        "High-yield warheads", 
        "Rapid missile launch system"
      ],
      sniperElite: [
        "Extreme range vision", 
        "Armor-piercing shots"
      ],
      Obsidian: [
        "Faster burn rate", 
        "Eruptive lava damage"
      ],
      Nova: [
        "Wider blast radius", 
        "Blazing pulse frequency"
      ],
      poison: [
        "Longer poison spread", 
        "Toxic cloud damage over time"
      ],
      railgun: [
        "Overcharged beam damage", 
        "Faster beam recharge"
      ],
      hyperLaser: [
        "Ridiculously fast beam rate",
        "Supercharged beam damage"
      ],
        omegaCannon: [
        "Devastating blast with longer range",
        "Fires significantly faster"
      ],


    };

// === UTILITY FUNCTIONS ===

// Calculate distance between two points (used for targeting, hover detection, etc.)

    function distance(x1, y1, x2, y2) {
      return Math.hypot(x2 - x1, y2 - y1);
    }

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

// Utility to draw rounded rectangles (used for UI elements, tooltips, towers, etc.)

    function roundRect(ctx, x, y, w, h, r) {
      if (w < 2 * r) r = w / 2;
      if (h < 2 * r) r = h / 2;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
    
// === BACKGROUND IMAGE ===
// Draw the background map once loaded (used in draw loop)

    const backgroundImg = new Image();
    backgroundImg.src = 'backgroundimage/sprite.png';

    function drawGrassBackground() {
      if (backgroundImg.complete) {
        ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
      } else {
        backgroundImg.onload = () => {
          ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
        };
      }
    }

// === ENEMY PATH COORDINATES ===
// Defines the path that enemies follow across the map

    const enemyPath = [
      { x: 0, y: 100 },
      { x: 850, y: 100 },
      { x: 850, y: 200 },
      { x: 100, y: 200 },
      { x: 100, y: 300 },
      { x: 850, y: 300 },
      { x: 850, y: 400 },
      { x: 100, y: 400 },
      { x: 100, y: 500 },
      { x: 850, y: 500 },
      { x: 850, y: 800 },
    ];

// === ENEMY SPRITES CACHE ===
// Stores dynamically created sprites for each enemy type

    const enemySprites = {};

// === PROCEDURAL ENEMY SPRITE GENERATION ===
// Creates top-down 64x64 enemy sprites using canvas

    function generateEnemySprites() {
      const types = ["normal", "fast", "armoredBoss", "shielded", "regenerator", "flying", "titan", "specter", "inferno"];

      types.forEach(type => {
        const canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext("2d");
        ctx.translate(32, 32);

    // === COLOR THEMES PER TYPE ===

        const colors = {
          normal:   ["#506830", "#344420", "#aacd6e"],
          fast:     ["#c0392b", "#7b241c", "#f1948a"],
          armoredBoss: ["#3a3a3a", "#555", "#aaa"],
          shielded: ["#4477aa", "#223344", "#88ccff"],
          regenerator: ["#33aa33", "#116611", "#88ff88"],
          flying:   ["#555577", "#333355", "#9999ff"],
          titan:    ["#444444", "#888888", "#e0e0e0"],
          specter:  ["#aaccff", "#ffffff55", "#ccddee"],
          inferno:  ["#cc5500", "#442200", "#ffaa33"]
        };

        const [base, shade, highlight] = colors[type] || ["#999", "#666", "#ccc"];

        ctx.fillStyle = shade;

  // === SPRITE SHAPES PER TYPE ===

        if (type === "normal") {
          ctx.fillStyle = base;
          ctx.fillRect(-14, -10, 28, 20); // Body
          ctx.fillStyle = shade;
          ctx.fillRect(-10, -4, 20, 8);   // Inner
          ctx.fillStyle = highlight;
          ctx.fillRect(-2, -2, 4, 4);     // Core
        } else if (type === "fast") {
          ctx.fillStyle = base;
          ctx.fillRect(-12, -14, 24, 28); // Body
          ctx.fillStyle = "#222";
          ctx.fillRect(-8, -6, 16, 12);   // Windows
        } else if (type === "armoredBoss") {
          ctx.fillStyle = base;
          ctx.fillRect(-18, -12, 36, 24); // Tank body
          ctx.fillStyle = "#222";
          ctx.fillRect(-6, -4, 12, 8);    // Turret
          ctx.fillStyle = "#888";
          ctx.fillRect(6, -2, 10, 4);     // Barrel
        } else if (type === "shielded") {
          ctx.fillStyle = base;
          ctx.fillRect(-14, -10, 28, 20); // Body
          ctx.strokeStyle = "#99ccff";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 24, 0, Math.PI * 2); // Forcefield ring
          ctx.stroke();
        } else if (type === "regenerator") {
          ctx.fillStyle = base;
          ctx.fillRect(-13, -13, 26, 26); // Body
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(-5, -2, 10, 4);    // Cross arm
          ctx.fillRect(-2, -5, 4, 10);    // Cross leg
        } else if (type === "flying") {
          ctx.fillStyle = base;
          ctx.beginPath();
          ctx.moveTo(0, -20);
          ctx.lineTo(12, 12);
          ctx.lineTo(6, 6);
          ctx.lineTo(-6, 6);
          ctx.lineTo(-12, 12);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = highlight;
          ctx.fillRect(-4, -12, 8, 6);    // Cockpit
        } else if (type === "titan") {
          ctx.fillStyle = base;
          ctx.beginPath();
          ctx.ellipse(0, 0, 22, 16, 0, 0, Math.PI * 2); // Dropship
          ctx.fill();

          ctx.fillStyle = highlight;
          ctx.fillRect(-4, -4, 8, 8);     // Core light
        } else if (type === "specter") {
          ctx.globalAlpha = 0.6;
          ctx.fillStyle = base;
          ctx.beginPath();
          ctx.arc(0, 0, 14, 0, Math.PI * 2); // Ghost drone
          ctx.fill();
          ctx.globalAlpha = 1;
        } else if (type === "inferno") {
          ctx.fillStyle = base;
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, Math.PI * 2); // Flame body
          ctx.fill();
          ctx.fillStyle = "#ffff33";
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);  // Flame core
          ctx.fill();
        }

        // Save the rendered sprite as an image
        const img = new Image();
        img.src = canvas.toDataURL();
        enemySprites[type] = img;
      });
    }

    // === INITIALIZE ENEMY SPRITES ===
    // Call once to populate enemySprites with procedurally generated top-down visuals
    generateEnemySprites();

    // === BOSS SPRITE GENERATION ===
    // Generates a special 128x128 sprite for the boss enemy
    const bossSprite = new Image();

    function generateBossSprite() {
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");
      ctx.translate(64, 64); // center drawing

      // Base body shape
      ctx.fillStyle = "#3a3a3a";
      ctx.beginPath();
      ctx.ellipse(0, 0, 48, 28, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cockpit dome
      ctx.fillStyle = "#ccaa00";
      ctx.beginPath();
      ctx.arc(0, -20, 10, 0, Math.PI * 2);
      ctx.fill();

      // Wings (left & right)
      ctx.fillStyle = "#555";
      ctx.fillRect(-60, -4, 20, 8);
      ctx.fillRect(40, -4, 20, 8);

      // Engines (rear)
      ctx.fillStyle = "#222";
      ctx.beginPath();
      ctx.arc(-48, 12, 6, 0, Math.PI * 2);
      ctx.arc(48, 12, 6, 0, Math.PI * 2);
      ctx.fill();

      // Gun turrets
      ctx.fillStyle = "#777";
      ctx.fillRect(-6, 28, 12, 8);
      ctx.fillRect(-3, 36, 6, 10);

      // Center light/flicker
      ctx.fillStyle = "#ff2222";
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      // Save as image
      bossSprite.src = canvas.toDataURL();
    }
    generateBossSprite();


    // === TOWER SPRITE LOADING ===
    // Loads tower visuals from folders like: towerimages/basictower/sprite.png
    const towerSprites = {};

    function loadTowerSprites() {
      const types = Object.keys(towerCosts); // gets tower type names
      types.forEach(type => {
        const img = new Image();
        img.src = `towerimages/${type}tower/sprite.png`;

        // Debug feedback for asset loading
        img.onload = () => console.log(`✅ Loaded: ${img.src}`);
        img.onerror = () => console.warn(`⚠️ Could not load: ${img.src}`);

        towerSprites[type] = img;
      });
    }

    loadTowerSprites();



    // === TOWER CLASS ===
    // Represents all behavior and data for an individual tower
    class Tower {
      constructor(x, y, type) {
        // --- Position & Type ---
        this.x = x;
        this.y = y;
        this.type = type;

        // --- Core Stats ---
        this.level = 1;
        this.reloadTimer = 0;
        this.rotation = 0;
        this.targetMode = "first"; // Default targeting behavior

        // === Base Tower Stats by Type ===
        switch (type) {
          case "basic":
            this.range = 100;
            this.damage = 15;
            this.reloadSpeed = 15;
            this.size = 100;
            break;
          case "sniper":
            this.range = 200;
            this.damage = 40;
            this.reloadSpeed = 40;
            this.size = 100;
            break;
          case "cannon":
            this.range = 120;
            this.damage = 40;
            this.reloadSpeed = 25;
            this.size = 105;
            break;
          case "flame":
            this.range = 80;
            this.damage = 10;
            this.reloadSpeed = 5;
            this.size = 75;
            break;
          case "ice":
            this.range = 90;
            this.damage = 5;
            this.reloadSpeed = 20;
            this.size = 80;
            break;
          case "tesla":
            this.range = 110;
            this.damage = 35;
            this.reloadSpeed = 15;
            this.size = 90;
            break;
          case "missile":
            this.range = 160;
            this.damage = 50;
            this.reloadSpeed = 50;
            this.size = 90;
            break;
          case "sniperElite":
            this.range = 250;
            this.damage = 70;
            this.reloadSpeed = 30;
            this.size = 90;
            break;
          case "Obsidian":
            this.range = 160;
            this.damage = 40;
            this.reloadSpeed = 12;
            this.size = 90;
            break;
          case "Nova":
            this.range = 100;
            this.damage = 60;
            this.reloadSpeed = 20;
            this.fireCooldown = 0;
            this.size = 65;
            break;
          case "poison":
            this.range = 100;
            this.damage = 10;
            this.reloadSpeed = 20;
            this.size = 75;
            break;
          case "railgun":
            this.range = 400;
            this.damage = 200;
            this.reloadSpeed = 100;
            this.size = 115;
            break;
          case "hyperLaser":
            this.range = 280;
            this.damage = 65;
            this.reloadSpeed = 2;
            this.size = 100;
            break;
          case "omegaCannon":
            this.range = 280;
            this.damage = 800;
            this.reloadSpeed = 20;
            this.size = 120;
            break;
        }

        // === Upgrade State ===
        this.upgrades = { path1: 0, path2: 0 };
      }

      // === UPDATE METHOD ===
      // Handles firing logic, cooldowns, targeting, and special effects
      update() {
        this.reloadTimer += gameSpeed;
        if (this.fireCooldown > 0) this.fireCooldown -= gameSpeed;

        if (this.reloadTimer >= this.reloadSpeed) {
          this.reloadTimer = 0;

          // Filter enemies in range
          let inRange = enemies.filter(
            (e) => !e.dead && distance(this.x, this.y, e.x, e.y) <= this.range
          );

          let target = null;

          // === Targeting Logic ===
          if (inRange.length > 0) {
            switch (this.targetMode) {
              case "first":
                target = inRange.reduce((a, b) =>
                  a.currentPathIndex > b.currentPathIndex ? a : b
                );
                break;
              case "last":
                target = inRange.reduce((a, b) =>
                  a.currentPathIndex < b.currentPathIndex ? a : b
                );
                break;
              case "strong":
                target = inRange.reduce((a, b) => (a.health > b.health ? a : b));
                break;
              case "close":
                target = inRange.reduce((a, b) =>
                  distance(this.x, this.y, a.x, a.y) < distance(this.x, this.y, b.x, b.y)
                    ? a
                    : b
                );
                break;
            }
          }

          if (target) {
            // === Firing Logic ===
            this.rotation = Math.atan2(target.y - this.y, target.x - this.x);

            switch (this.type) {
              case "flame":
                target.health -= this.damage * 0.5;
                break;

              case "ice":
                if (!target.slowTimer) {
                  target.originalSpeed = target.speed;
                  target.speed *= 0.03;
                  target.slowTimer = 60;
                }
                target.health -= this.damage * 0.8;
                break;

              case "tesla":
                enemies.forEach((e) => {
                  if (!e.dead && distance(e.x, e.y, target.x, target.y) < 40) {
                    e.health -= this.damage;
                  }
                });
                break;

              case "Obsidian":
                target.health -= this.damage;
                if (!target.burn) {
                  target.burn = { damagePerSecond: 5, duration: 3, elapsed: 0 };
                }
                effects.push(new BurnEffect(target.x, target.y));
                break;

              case "poison":
                target.health -= this.damage * 0.3;
                if (!target.poison) {
                  target.poison = { dps: 4, duration: 4, elapsed: 0 };
                }
                break;

              case "Nova":
                if (this.fireCooldown <= 0) {
                  enemies.forEach((enemy) => {
                    const dist = distance(this.x, this.y, enemy.x, enemy.y);
                    if (dist <= this.range) {
                      enemy.health -= this.damage;
                    }
                  });
                  this.fireCooldown = this.reloadSpeed;
                  effects.push(new SunBeamEffect(this.x, this.y));
                }
                break;

              default:
                // Generic bullet
                console.log("✅ Bullet fired", this.x, this.y, "Type:", this.type);
                bullets.push(
                  new Bullet(this.x, this.y, target, this.damage, this.rotation, this.type)
                );
            }

            // Recoil animation effect
            effects.push(new RecoilBlast(this.x, this.y, this.rotation));
          }
        }
      }

      // === DRAW METHOD ===
      // Renders the tower sprite, level label, and upgrade indicators
      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        if (towerSprites[this.type] && towerSprites[this.type].complete) {
          ctx.drawImage(
            towerSprites[this.type],
            -this.size / 2,
            -this.size / 2,
            this.size,
            this.size
          );
        } else {
          console.warn(`⚠️ Missing sprite for: ${this.type}`);
          ctx.fillStyle = "#999";
          ctx.fillRect(-16, -16, 32, 32);
        }

        ctx.restore();

        // === Draw Level Label ===
        ctx.fillStyle = "#cdf7b9";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`Lv.${this.level}`, this.x, this.y + 40);

        // === Draw Range Ring + Upgrade Icons ===
        if (this === hoveredTower || this === selectedTower) {
          ctx.save();
          ctx.strokeStyle = this === selectedTower ? "#cdf7b9" : "rgba(205,247,185,0.5)";
          ctx.setLineDash([8, 8]);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
          ctx.stroke();

          // Draw upgrade icons
          const up = this.upgrades;
          const icons = [];
          if (up.path1 > 0) icons.push(upgradePaths[this.type].path1[1]);
          if (up.path2 > 0) icons.push(upgradePaths[this.type].path2[1]);

          ctx.fillStyle = "#fff";
          ctx.font = "bold 12px Arial";
          icons.forEach((ico, i) => {
            ctx.fillText(ico, this.x, this.y - 25 - i * 14);
          });

          ctx.restore();
        }
      }
    }



    // === BULLET CLASS ===
    // Represents a projectile fired by a tower
    class Bullet {
      constructor(x, y, target, damage, angle, type = "default") {
        // --- Bullet position and source ---
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;

        // --- Targeting and type ---
        this.target = target;
        this.damage = damage;
        this.angle = angle;
        this.type = type;

        // --- Movement and speed settings ---
        this.speed = (type === "sniperElite") ? 6 : 12;
        this.traveled = 0;
        this.framesAlive = 0;

        // --- Status flags ---
        this.dead = false;
        this.hitDetected = false;

        // --- Special handling for bullet types ---
        if (type === "hyperLaser") {
          this.pierceCount = 4;
          this.maxDistance = 800;
          this.speed = 16;
        } else if (type === "railgun" || type === "sniperElite") {
          this.pierceCount = 2;
          this.maxDistance = 600;
          this.speed = 6;
        } else {
          this.pierceCount = 1;
          this.maxDistance = 9999;
          this.speed = 12;
        }

        // --- Track what enemies were hit (for pierce logic) ---
        this.hitEnemies = new Set();
      }

      // === UPDATE METHOD ===
      update() {
        this.framesAlive++;
        if (this.dead) return;

        if (!this.target || this.target.dead) {
          this.dead = true;
          return;
        }

        // --- Travel distance calculation ---
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.hypot(dx, dy);
        const travel = this.speed * gameSpeed;

        // === HIT DETECTION ===

        if (this.type === "hyperLaser") {
          // Multi-hit piercing laser
          enemies.forEach(enemy => {
            if (!enemy.dead && !this.hitEnemies.has(enemy)) {
              const d = distance(this.x, this.y, enemy.x, enemy.y);
              if (d < (enemy.hitRadius || 16)) {
                enemy.health -= this.damage;
                this.hitEnemies.add(enemy);
                effects.push(new RecoilBlast(this.x, this.y, this.angle));
                if (this.hitEnemies.size >= this.pierceCount) {
                  this.dead = true;
                }
              }
            }
          });

        } else if (dist <= travel + (this.target.hitRadius || 16)) {
          // Standard collision logic
          this.hitDetected = true;

          switch (this.type) {
            case "cannon":
              enemies.forEach(e => {
                const d2 = distance(this.x, this.y, e.x, e.y);
                if (d2 < 40 && !e.dead) {
                  e.health -= this.damage * (1 - d2 / 40);
                }
              });
              break;

            case "poison":
              this.target.health -= this.damage;
              if (!this.target.poison) {
                this.target.poison = { dps: 4, duration: 4, elapsed: 0 };
              }
              break;

            case "ice":
              this.target.health -= this.damage;
              if (!this.target.slowTimer) {
                this.target.originalSpeed = this.target.speed;
                this.target.speed *= 0.6;
                this.target.slowTimer = 90;
              }
              break;

            case "Obsidian":
              this.target.health -= this.damage;
              if (!this.target.burn) {
                this.target.burn = { damagePerSecond: 5, duration: 3, elapsed: 0 };
              }
              effects.push(new BurnEffect(this.x, this.y));
              break;

            case "omegaCannon":
              enemies.forEach(e => {
                if (!e.dead && distance(this.x, this.y, this.target.x, this.target.y) < 100) {
                  e.health -= this.damage;
                  effects.push(new RecoilBlast(e.x, e.y, this.angle));
                }
              });
              break;

            default:
              this.target.health -= this.damage;
              break;
          }

          effects.push(new RecoilBlast(this.x, this.y, this.angle));
          this.dead = true;
          return;
        }

        // --- Move toward target if not hit ---
        this.x += (dx / dist) * travel;
        this.y += (dy / dist) * travel;

        this.traveled += travel;
        if (this.traveled > this.maxDistance) this.dead = true;
      }

      // === DRAW METHOD ===
      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        console.log("Drawing bullet:", this.type, this.x, this.y);

        // === Style per bullet type ===
        switch (this.type) {
          case "sniper":
            ctx.strokeStyle = "#00f";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(14, 0);
            ctx.stroke();
            break;

          case "cannon":
            ctx.fillStyle = "#f00";
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.fill();
            break;

          case "missile":
            ctx.fillStyle = "#aaa";
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(12, -3);
            ctx.lineTo(12, 3);
            ctx.closePath();
            ctx.fill();
            break;

          case "poison":
            ctx.fillStyle = "green";
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();
            break;

          case "ice":
            ctx.fillStyle = "#00ffff";
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();
            break;

          case "railgun":
            ctx.strokeStyle = "#99f";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-10, 0);
            ctx.lineTo(10, 0);
            ctx.stroke();
            break;

          case "basic":
            ctx.fillStyle = "#ffcc00";
            ctx.fillRect(0, -2, 10, 4);
            break;

          case "flame":
            ctx.fillStyle = "orange";
            ctx.beginPath();
            ctx.arc(0, 0, 3 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
            break;

          case "tesla":
            ctx.strokeStyle = "#ffff00";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-4, -4);
            ctx.lineTo(4, 4);
            ctx.moveTo(-4, 4);
            ctx.lineTo(4, -4);
            ctx.stroke();
            break;

          case "sniperElite":
            ctx.strokeStyle = "#ff00ff";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(16, 0);
            ctx.stroke();
            break;

          case "Obsidian":
            ctx.fillStyle = "#a83232";
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ff6600";
            ctx.beginPath();
            ctx.arc(0, 0, 2, 0, Math.PI * 2);
            ctx.fill();
            break;

          case "Nova":
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(0, 0, 5 + Math.sin(Date.now() / 50) * 2, 0, Math.PI * 2);
            ctx.fill();
            break;

          case "hyperLaser":
            // Core laser beam
            ctx.strokeStyle = "#ffff66";
            ctx.lineWidth = 3 + Math.sin(this.framesAlive * 0.6);
            ctx.beginPath();
            ctx.lineTo(24, (Math.random() - 0.5) * 2);
            ctx.stroke();

            // Blue glow
            ctx.strokeStyle = "rgba(100,200,255,0.4)";
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.lineTo(24, (Math.random() - 0.5) * 2);
            ctx.stroke();

            // Sparks
            for (let i = 0; i < 2; i++) {
              ctx.strokeStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.3})`;
              ctx.beginPath();
              ctx.moveTo(8 + Math.random() * 8, -1 + Math.random() * 2);
              ctx.lineTo(8 + Math.random() * 8, -6 + Math.random() * 12);
              ctx.stroke();
            }

            // Orb at origin
            ctx.fillStyle = "#ffffcc";
            ctx.beginPath();
            ctx.arc(0, 0, 3 + Math.sin(this.framesAlive * 0.4), 0, Math.PI * 2);
            ctx.fill();
            break;

          case "omegaCannon":
            const gradient = ctx.createRadialGradient(0, 0, 2, 0, 0, 12);
            gradient.addColorStop(0, "#fff");
            gradient.addColorStop(0.3, "#99f");
            gradient.addColorStop(0.6, "#33f");
            gradient.addColorStop(1, "#001133");
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "rgba(100,150,255,0.4)";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, 18 + Math.sin(this.framesAlive * 0.4) * 2, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = "#ccf";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-14, 0);
            ctx.lineTo(14, 0);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(0, 0, 6 + Math.sin(this.framesAlive / 3) * 2, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(255,255,255,0.1)";
            ctx.lineWidth = 1;
            ctx.stroke();
            break;

          default:
            ctx.fillStyle = "#ffcc00";
            ctx.fillRect(0, -2, 10, 4);
            break;
        }

        ctx.restore();
      }
    }



    // === ENEMY CLASS ===
    // Represents a single enemy that follows the path and can be damaged
    class Enemy {
      constructor(path, type, waveNumber = 1) {
        // --- Path & position ---
        this.path = path;
        this.currentPathIndex = 0;
        this.x = path[0].x;
        this.y = path[0].y;

        // --- Enemy attributes ---
        this.type = type;
        this.hitRadius = (type === "titan") ? 50 : 16;
        this.dead = false;

        // --- Enemy stats based on type ---
        switch (type) {
          case "fast":
            this.speed = 2.2 + 0.2 * waveNumber;
            this.health = 40 + 7 * waveNumber;
            break;
          case "armoredBoss":
            this.speed = 0.8 + 0.2 * waveNumber;
            this.health = 200 + 7 * waveNumber;
            break;
          case "shielded":
            this.speed = 1.2 + 0.2 * waveNumber;
            this.health = 150 + 7 * waveNumber;
            break;
          case "regenerator":
            this.speed = 1 + 0.2 * waveNumber;
            this.health = 80 + 7 * waveNumber;
            this.regenRate = 0.3;
            break;
          case "flying":
            this.speed = 1.8 + 0.2 * waveNumber;
            this.health = 50 + 7 * waveNumber;
            break;
          case "titan":
            this.speed = 0.4 + 0.02 * waveNumber;
            this.health = 10000 + waveNumber * 700;
            this.hitRadius = 24;
            this.reward = 50 + waveNumber * 5;
            break;
          case "specter":
            this.speed = 2.5 + 0.2 * waveNumber;
            this.health = 100 + 7 * waveNumber;
            this.evasive = true;
            break;
          case "inferno":
            this.speed = 1.2 + 0.2 * waveNumber;
            this.health = 300 + 7 * waveNumber;
            this.burnAura = true;
            break;
          default:
            this.speed = 1 + 0.1 * waveNumber;
            this.health = 50 + 5 * waveNumber;
            this.reward = 5;
        }

        this.maxHealth = this.health;
      }

      // === UPDATE METHOD ===
      update() {
        if (this.dead) return;

        const target = this.path[this.currentPathIndex + 1];

        // === Reached end of path ===
        if (!target) {
          this.dead = true;
          lives--;
          showMessage("Enemy escaped! -1 Life", 1500);

          // Remove from enemies list
          const index = enemies.indexOf(this);
          if (index !== -1) enemies.splice(index, 1);

          return;
        }

        // --- Movement toward next path point ---
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.hypot(dx, dy);

        // === SPECIAL ABILITIES ===

        // Specter: 20% chance to evade update
        if (this.evasive && Math.random() < 0.2) return;

        // Inferno: slow nearby towers
        if (this.burnAura) {
          towers.forEach(t => {
            if (distance(this.x, this.y, t.x, t.y) < 50) {
              t.reloadSpeed += 0.05 * gameSpeed;
            }
          });
        }

        // --- Step forward or snap to next path point ---
        if (dist < this.speed * gameSpeed) {
          this.x = target.x;
          this.y = target.y;
          this.currentPathIndex++;
        } else {
          this.x += (dx / dist) * this.speed * gameSpeed;
          this.y += (dy / dist) * this.speed * gameSpeed;
        }

        // === STATUS EFFECTS ===

        // Regenerator healing
        if (this.type === "regenerator") {
          this.health = Math.min(this.maxHealth, this.health + this.regenRate * gameSpeed);
        }

        // Poison damage over time
        if (this.poison) {
          this.poison.elapsed += gameSpeed;
          if (this.poison.elapsed % 20 === 0) {
            this.health -= this.poison.dps / 3;
          }
          this.poison.duration -= gameSpeed;
          if (this.poison.duration <= 0) delete this.poison;
        }

        // Slow effect
        if (this.slowTimer) {
          this.slowTimer -= gameSpeed;
          if (this.slowTimer <= 0) {
            this.speed = this.originalSpeed;
            delete this.slowTimer;
          }
        }

        // Burn effect
        if (this.burn) {
          this.burn.elapsed += gameSpeed;
          if (this.burn.elapsed % 20 === 0) {
            this.health -= this.burn.damagePerSecond / 3;
          }
          this.burn.duration -= gameSpeed;
          if (this.burn.duration <= 0) delete this.burn;
        }

        // === DEATH ===
        if (this.health <= 0) {
          this.dead = true;
          const reward = this.reward || 5;
          money += reward;
          showMessage(`+${reward} Gold!`, 1000);
        }
      }

      // === DRAW METHOD ===
      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        // --- Rotate to face next path direction ---
        const next = this.path[this.currentPathIndex + 1];
        if (next) {
          const dx = next.x - this.x;
          const dy = next.y - this.y;
          ctx.rotate(Math.atan2(dy, dx));
        }

        // --- Flash red when damaged ---
        if (this._flashTimer && this._flashTimer > 0) {
          ctx.globalAlpha = 0.6;
          ctx.fillStyle = "red";
          ctx.beginPath();
          ctx.arc(0, 0, this.hitRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          this._flashTimer -= gameSpeed;
        }

        // --- Draw enemy sprite ---
        const sprite = enemySprites[this.type];
        if (sprite) {
          if (this.type === "titan") {
            ctx.drawImage(sprite, -64, -64, 128, 128); // large enemy
          } else {
            ctx.drawImage(sprite, -32, -32, 64, 64); // normal enemy
          }
        }

        // --- Effects: glow outlines for special types ---
        if (this.type === "shielded") {
          ctx.strokeStyle = "rgba(100,200,255,0.5)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, this.hitRadius + 4, 0, Math.PI * 2);
          ctx.stroke();
        }
        if (this.type === "regenerator") {
          ctx.strokeStyle = "rgba(100,255,100,0.3)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, this.hitRadius + 6, 0, Math.PI * 2);
          ctx.stroke();
        }

        // --- Health bar (always upright) ---
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = "red";
        ctx.fillRect(-this.hitRadius, -this.hitRadius - 12, this.hitRadius * 2, 5);
        ctx.fillStyle = "lime";
        ctx.fillRect(
          -this.hitRadius,
          -this.hitRadius - 12,
          (this.health / this.maxHealth) * this.hitRadius * 2,
          5
        );

        ctx.restore();
      }
    }



    // === BOSS ENEMY CLASS ===
    // Giant enemy with more health, slower speed, and special sprite
    class BossEnemy {
      constructor(path, waveNumber = 10) {
        // Path and position
        this.path = path;
        this.currentPathIndex = 0;
        this.x = path[0].x;
        this.y = path[0].y;

        // Core stats
        this.hitRadius = 30;
        this.dead = false;
        this.speed = 0.5 + 0.1 * (waveNumber / 10);
        this.health = 5000 + waveNumber * 600;
        this.maxHealth = this.health;
        this.reward = 150 + waveNumber * 20;
      }

      update() {
        if (this.dead) return;

        const target = this.path[this.currentPathIndex + 1];
        if (!target) {
          this.dead = true;
          lives--;
          showMessage("BOSS escaped! -1 Life", 1500);
          return;
        }

        // Movement logic
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.speed * gameSpeed) {
          this.x = target.x;
          this.y = target.y;
          this.currentPathIndex++;
        } else {
          this.x += (dx / dist) * this.speed * gameSpeed;
          this.y += (dy / dist) * this.speed * gameSpeed;
        }

        // Check for death
        if (this.health <= 0) {
          this.dead = true;
          money += this.reward;
          showMessage(`💰 Boss defeated! +$${this.reward}`, 2500);
        }
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Rotate to face direction of movement
        const next = this.path[this.currentPathIndex + 1];
        if (next) {
          const dx = next.x - this.x;
          const dy = next.y - this.y;
          ctx.rotate(Math.atan2(dy, dx));
        }

        // Draw sprite
        if (bossSprite.complete) {
          ctx.drawImage(bossSprite, -64, -64, 128, 128);
        }

        // Health bar
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = "#800";
        ctx.fillRect(-40, -56, 80, 10);
        ctx.fillStyle = "#0f0";
        ctx.fillRect(-40, -56, (this.health / this.maxHealth) * 80, 10);

        ctx.restore();
      }
    }


    // === BURN EFFECT ===
    // Orange flame that flickers out over time
    class BurnEffect {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.timer = 0;
      }

      update() {
        this.timer += gameSpeed;
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.globalAlpha = 0.6 - (this.timer % 20) * 0.03;
        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.arc(0, 0, 6 + Math.sin(this.timer * 0.2) * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      get finished() {
        return this.timer > 60;
      }
    }


    // === SUN BEAM EFFECT ===
    // Radiating yellow beams from Nova tower
    class SunBeamEffect {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.timer = 0;
        this.finished = false;
      }

      update() {
        this.timer += gameSpeed;
        if (this.timer > 20) this.finished = true;
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.globalAlpha = 1 - this.timer / 20;

        // 12 rays spinning outward
        for (let i = 0; i < 12; i++) {
          const angle = (Math.PI * 2 * i) / 12;
          ctx.strokeStyle = `rgba(255, 255, 100, ${1 - this.timer / 20})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(angle) * 40, Math.sin(angle) * 40);
          ctx.stroke();
        }

        ctx.restore();
      }
    }


    // === RECOIL BLAST EFFECT ===
    // Expanding ring at point of fire/impact
    class RecoilBlast {
      constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.timer = 0;
        this.finished = false;
      }

      update() {
        this.timer += gameSpeed;
        if (this.timer > 15) this.finished = true;
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.globalAlpha = 1 - this.timer / 15;

        // Expanding flash
        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.arc(10, 0, 6 + this.timer / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }




    // === DRAW ENEMY PATH / RIVER ===
    function drawRiver() {
      // Jungle border (outer path)
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 36;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(enemyPath[0].x, enemyPath[0].y);
      enemyPath.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.stroke();

      // Dirt core (inner)
      ctx.strokeStyle = "#33322F";
      ctx.lineWidth = 26;
      ctx.beginPath();
      ctx.moveTo(enemyPath[0].x, enemyPath[0].y);
      enemyPath.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.stroke();

      // Center line for clarity
      ctx.strokeStyle = "#F5B20C";
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(enemyPath[0].x, enemyPath[0].y);
      enemyPath.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      ctx.setLineDash([]);
    }





    // === OPTIONAL PATH OVERLAY ===
    function drawEnemyPath() {
      ctx.strokeStyle = "#F5B20C";
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(enemyPath[0].x, enemyPath[0].y);
      enemyPath.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // === START WAVE LOGIC ===
    function startWave() {
      if (spawning) return; // prevent multiple starts
      waveNumber++;

      // Unlock tougher types on wave 25
      if (waveNumber === 25) {
        enemyTypes.push("specter", "inferno");
      }

      // Spawn titans every 5 waves after 25
      if (waveNumber >= 25 && waveNumber % 5 === 0) {
        const titanCount = Math.floor((waveNumber - 25) / 5) + 2;
        for (let i = 0; i < titanCount; i++) {
          enemies.push(new Enemy(enemyPath, "titan", waveNumber));
        }
        if (enemiesToSpawn > 0) {
          enemiesToSpawn -= titanCount;
          if (enemiesToSpawn < 0) enemiesToSpawn = 0;
        }
        showMessage(`⚠️ ${titanCount} Titan${titanCount > 1 ? "s" : ""} incoming!`, 2500);
      }

      // Ensure all core types are present
      if (!enemyTypes.includes("normal")) {
        enemyTypes = ["normal", "fast", "armoredBoss", "shielded", "regenerator", "flying"];
      }

      // BOSS wave every 10 rounds
      if (waveNumber % 10 === 0) {
        enemiesToSpawn = 0;
        enemies.push(new BossEnemy(enemyPath, waveNumber));
        showMessage(`👑 BOSS WAVE ${waveNumber}! Prepare for battle!`, 3000);
      } else {
        enemiesToSpawn = 5 + waveNumber * 4;
      }

      // Extra Titan overlap catch (just in case)
      if (waveNumber >= 25 && waveNumber % 5 === 0) {
        enemies.push(new Enemy(enemyPath, "titan", waveNumber));
        if (enemiesToSpawn > 0) enemiesToSpawn--;
        showMessage("⚠️ Titan incoming!", 2500);
      }

      spawning = true;
      spawnTimer = 0;
      showMessage(`Wave ${waveNumber} started!`, 2000);
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


    // === MOUSE MOVE: Track Hover and Tower Placement Cursor ===
    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      // Highlight hovered tower for UI
      hoveredTower = towers.find((t) => distance(mx, my, t.x, t.y) < 20) || null;

      // Track placement position for rendering ghost
      if (placingTower) {
        placementX = mx;
        placementY = my;
      }
    });


    // === TOWER MENU CLICK: Choose Tower to Place ===
    towerMenu.addEventListener("click", (e) => {
      if (e.target.tagName !== "BUTTON") return;
      const type = e.target.dataset.tower;

      if (towerCosts[type]) {
        selectedTowerType = type;
        placingTower = true;
        selectedTower = null;
        upgradePanel.style.display = "none";
        showMessage(`Placing ${type} tower`, 1500);
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

    function gameLoop() {
      // === GAME OVER CHECK ===
      if (lives <= 0) {
        gamePaused = true;
        showMessage("Game Over!", 5000);
      }

      if (!gamePaused) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrassBackground();
        drawRiver();
        drawEnemyPath();

        // === DRAW TOWER PLACEMENT PREVIEW ===
        if (placingTower && selectedTowerType) {
          ctx.save();

          // Determine range ring based on selected tower type
          let towerRange = (() => {
            switch (selectedTowerType) {
              case "sniper": return 200;
              case "cannon": return 120;
              case "flame": return 80;
              case "ice": return 90;
              case "tesla": return 110;
              case "missile": return 160;
              case "sniperElite": return 250;
              case "Obsidian": return 160;
              case "Nova": return 100;
              case "poison": return 100;
              case "railgun": return 400;
              case "hyperLaser":
              case "omegaCannon": return 280;
              default: return 100;
            }
          })();

          // Check if placement is valid
          let valid = true;
          for (let i = 0; i < enemyPath.length - 1; i++) {
            const p = enemyPath[i], q = enemyPath[i + 1];
            const dx = q.x - p.x, dy = q.y - p.y;
            const t = ((placementX - p.x) * dx + (placementY - p.y) * dy) / (dx * dx + dy * dy);
            if (t > 0 && t < 1) {
              const cx = p.x + t * dx, cy = p.y + t * dy;
              if (distance(placementX, placementY, cx, cy) < 40) valid = false;
            }
          }
          if (towers.some(t => distance(t.x, t.y, placementX, placementY) < 40)) valid = false;

          ctx.strokeStyle = valid ? "#0f0" : "#f00";
          ctx.globalAlpha = 0.3;
          ctx.beginPath();
          ctx.arc(placementX, placementY, towerRange, 0, Math.PI * 2);
          ctx.fillStyle = valid ? "#0f04" : "#f004";
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }

        // === ENEMY SPAWNING ===
        if (spawning && enemiesToSpawn > 0) {
          spawnTimer--;
          if (spawnTimer <= 0) {
            if (waveNumber > 5 && enemyTypes.length < 6) {
              enemyTypes = ["normal", "fast", "armoredBoss", "shielded", "regenerator", "flying"];
            }
            const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            enemies.push(new Enemy(enemyPath, type, waveNumber));
            enemiesToSpawn--;
            spawnTimer = Math.max(10, 40 - waveNumber * 2);
          }
        }

        // === AUTO START NEXT WAVE ===
        if (spawning && enemiesToSpawn === 0 && enemies.length === 0) {
          spawning = false;
          if (autoStart) startWave();
        }

        // === GAME OBJECT UPDATES ===
        towers.forEach(t => t.update());
        bullets.forEach(b => b.update());
        enemies.forEach(e => e.update());
        effects.forEach(e => e.update());

        // === CLEANUP ===
        effects = effects.filter(e => !e.finished);
        bullets = bullets.filter(b => !b.dead);
        enemies = enemies.filter(e => !e.dead || e.health > 0);

        // === RENDER ===
        towers.forEach(t => t.draw());
        enemies.forEach(e => e.draw());
        bullets.forEach(b => b.draw());
        effects.forEach(e => e.draw());

        updateDisplays();
      }

      requestAnimationFrame(gameLoop);
    }


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
