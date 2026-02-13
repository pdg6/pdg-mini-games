// Inferno Run - Modernized with Shared Engine
const engine = new Engine('gameCanvas');
engine.gameName = 'Inferno-Run';

// State & Level variables
let currentLevel = 1;
let coinsCollected = 0;
let lives = 3;

// Assets/Entities
let platforms = [];
let movingPlatforms = [];
let fires = [];
let coins = [];
let goal = { x: 0, y: 0, width: 0, height: 0 };

// Player specific (shared engine handles part of this, but we need local physics)
const player = {
    x: 0, y: 0, width: 28, height: 32,
    vx: 0, vy: 0,
    grounded: false,
    jumping: false,
    facing: 1,
    trail: [],
    isDashing: false,
    dashTime: 0,
    lastDashTime: 0,
    touchingWall: 0,
    dashDirection: 1
};

// Physics Constants
const GRAVITY = 0.45;
const JUMP_FORCE = -11;
const MAX_SPEED = 4.5;
const ACCEL = 0.25;
const FRICTION = 0.9;
const DASH_SPEED = 12;
const DASH_DURATION = 180;
const DASH_COOLDOWN = 600;

function setup() {
    loadLevel(currentLevel);
    engine.score = coinsCollected;
}

function loadLevel(num) {
    const level = levels[(num - 1) % levels.length];
    platforms = JSON.parse(JSON.stringify(level.platforms));
    movingPlatforms = JSON.parse(JSON.stringify(level.movingPlatforms));
    fires = JSON.parse(JSON.stringify(level.fires));
    coins = level.coins.map(c => ({ ...c, collected: false, bob: Math.random() * Math.PI * 2 }));
    goal = { ...level.goal };
    
    player.x = level.playerStart.x;
    player.y = level.playerStart.y;
    player.vx = 0;
    player.vy = 0;
    player.trail = [];
    player.isDashing = false;
}

function update(dt) {
    if (engine.state !== 'PLAY') return;

    const now = performance.now();
    const factor = dt / 16.67;

    // Dash logic
    const canDash = (now - player.lastDashTime) > DASH_COOLDOWN;
    if (engine.justPressed('ShiftLeft') && canDash && !player.isDashing) {
        player.isDashing = true;
        player.dashTime = now;
        player.lastDashTime = now;
        player.dashDirection = player.facing;
        player.vy = 0;
        playSound('dash');
        for(let i=0; i<8; i++) engine.spawnSpark(player.x+14, player.y+16, Assets.COLORS.accent);
    }

    if (player.isDashing) {
        if (now - player.dashTime < DASH_DURATION) {
            player.vx = DASH_SPEED * player.dashDirection;
            player.vy = 0;
            player.trail.push({ x: player.x + 14, y: player.y + 16, life: 1 });
        } else {
            player.isDashing = false;
        }
    } else {
        // Horizontal Movement
        let inputX = 0;
        if (engine.isDown('ArrowLeft') || engine.isDown('KeyA')) inputX--;
        if (engine.isDown('ArrowRight') || engine.isDown('KeyD')) inputX++;

        if (inputX !== 0) {
            player.vx += inputX * ACCEL * factor;
            player.facing = inputX;
        } else {
            player.vx *= Math.pow(FRICTION, factor);
        }
        player.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, player.vx));

        // Vertical Movement (Gravity)
        player.vy += GRAVITY * factor;

        // Jump
        if (player.grounded && (engine.justPressed('Space') || engine.isDown('ArrowUp') || engine.isDown('KeyW'))) {
            player.vy = JUMP_FORCE;
            player.grounded = false;
            playSound('jump');
            for(let i=0; i<5; i++) engine.spawnSpark(player.x+14, player.y+32, Assets.COLORS.secondary);
        }
    }

    // Move & Collide
    player.x += player.vx * factor;
    checkXCollisions();
    player.y += player.vy * factor;
    checkYCollisions(factor);

    // Entity updates
    movingPlatforms.forEach(p => {
        p.x += p.speed * p.direction * factor;
        if (p.x >= p.endX) p.direction = -1;
        else if (p.x <= p.startX) p.direction = 1;
    });

    // Fire & Coin Collisions
    checkTriggers();

    // Goal
    if (rectIntersect(player.x, player.y, player.width, player.height, goal.x, goal.y, goal.width, goal.height)) {
        winLevel();
    }

    // Bounds
    if (player.y > engine.height) killPlayer();

    // Trail cleanup
    player.trail.forEach(t => t.life -= 0.05 * factor);
    player.trail = player.trail.filter(t => t.life > 0);
}

function draw() {
    const ctx = engine.ctx;
    
    // Background
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, engine.width, engine.height);

    // Goal Gate (Neon)
    ctx.shadowBlur = 15;
    ctx.shadowColor = Assets.COLORS.accent;
    ctx.strokeStyle = Assets.COLORS.accent;
    ctx.lineWidth = 4;
    ctx.strokeRect(goal.x, goal.y, goal.width, goal.height);
    ctx.shadowBlur = 0;

    // Draw Entities
    drawLevelEntities(ctx);

    // Dash Trail
    player.trail.forEach(t => {
        ctx.fillStyle = `rgba(0, 255, 255, ${Math.max(0, t.life) * 0.5})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, Math.max(0, 10 * t.life), 0, Math.PI*2);
        ctx.fill();
    });

    // Player
    Assets.renderPlayer(ctx, player.x, player.y, player.width, player.height, {
        velocity: { x: player.vx, y: player.vy },
        grounded: player.grounded,
        state: Math.abs(player.vx) > 0.5 ? 'moving' : 'idle'
    });

    // Particles
    engine.drawParticles(ctx);

    // UI
    drawUI(ctx);
}

function drawUI(ctx) {
    ctx.fillStyle = Assets.COLORS.secondary;
    ctx.font = 'bold 16px Courier New';
    ctx.textAlign = 'left';
    
    let hearts = '';
    for(let i=0; i<lives; i++) hearts += '♥';
    ctx.fillText(hearts, 20, 60);

    // engine.drawUI() handles MENU, GAMEOVER, and basic Score/GameName automatically
}

function checkXCollisions() {
    [...platforms, ...movingPlatforms].forEach(p => {
        if (rectIntersect(player.x, player.y, player.width, player.height, p.x, p.y, p.width, p.height)) {
            if (player.vx > 0) player.x = p.x - player.width;
            else if (player.vx < 0) player.x = p.x + p.width;
            player.vx = 0;
        }
    });
}

function checkYCollisions(factor) {
    player.grounded = false;
    [...platforms, ...movingPlatforms].forEach(p => {
        if (rectIntersect(player.x, player.y, player.width, player.height, p.x, p.y, p.width, p.height)) {
            if (player.vy > 0) {
                player.y = p.y - player.height;
                player.grounded = true;
                player.vy = 0;
                // If on moving platform, move with it
                if (p.speed) player.x += p.speed * p.direction * factor;
            } else if (player.vy < 0) {
                player.y = p.y + p.height;
                player.vy = 0;
            }
        }
    });
}

function checkTriggers() {
    fires.forEach(f => {
        if (rectIntersect(player.x+4, player.y+4, player.width-8, player.height-8, f.x, f.y, f.width, f.height)) {
            if (!player.isDashing) killPlayer();
        }
    });

    coins.forEach(c => {
        if (!c.collected && rectIntersect(player.x, player.y, player.width, player.height, c.x, c.y, 20, 20)) {
            c.collected = true;
            engine.score += 100;
            playSound('coin');
            for(let i=0; i<10; i++) engine.spawnSpark(c.x+10, c.y+10, Assets.COLORS.secondary);
        }
    });
}

function killPlayer() {
    lives--;
    engine.flash(300);
    playSound('death');
    for(let i=0; i<20; i++) engine.spawnSpark(player.x+14, player.y+16, Assets.COLORS.primary);
    
    if (lives <= 0) {
        engine.state = 'GAMEOVER';
        lives = 3;
        currentLevel = 1;
        coinsCollected = 0;
    } else {
        loadLevel(currentLevel);
    }
}

function winLevel() {
    playSound('levelup');
    coinsCollected = engine.score;
    currentLevel++;
    if (currentLevel > levels.length) {
        engine.state = 'GAMEOVER'; // Full win
    } else {
        loadLevel(currentLevel);
    }
}

function rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x2 < x1 + w1 && x2 + w2 > x1 && y2 < y1 + h1 && y2 + h2 > y1;
}

function drawLevelEntities(ctx) {
    // Platforms (Modernized look)
    [...platforms, ...movingPlatforms].forEach(p => {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.strokeStyle = '#444466';
        ctx.lineWidth = 1;
        ctx.strokeRect(p.x, p.y, p.width, p.height);
        
        // Neon edge
        ctx.fillStyle = Assets.COLORS.primary;
        ctx.fillRect(p.x, p.y, p.width, 2);
    });

    // Fires
    fires.forEach(f => {
        const t = performance.now() * 0.01;
        ctx.fillStyle = Assets.COLORS.primary;
        ctx.shadowBlur = 10;
        ctx.shadowColor = Assets.COLORS.primary;
        for(let i=0; i<3; i++) {
            const h = f.height + Math.sin(t + i) * 10;
            ctx.beginPath();
            ctx.moveTo(f.x, f.y + f.height);
            ctx.lineTo(f.x + f.width/2, f.y + f.height - h);
            ctx.lineTo(f.x + f.width, f.y + f.height);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    });

    // Coins
    coins.forEach(c => {
        if (c.collected) return;
        const bob = Math.sin(performance.now() * 0.005 + c.bob) * 5;
        ctx.fillStyle = Assets.COLORS.secondary;
        ctx.shadowBlur = 5;
        ctx.shadowColor = Assets.COLORS.secondary;
        ctx.beginPath();
        ctx.arc(c.x + 10, c.y + 10 + bob, 8, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });
}

// Kickoff
engine.start(setup, update, draw);
