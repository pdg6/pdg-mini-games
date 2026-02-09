const engine = new Engine('gameCanvas');
engine.gameName = 'cyber-chase';
engine.loadHighScore();

const player = new Entity(100, 500, 30, 30, '#00ffcc');
let obstacles = [];
let floorY = 500;
let speed = 5;
let spawnTimer = 0;
let runFrame = 0;
let distanceTraveled = 0;
let doubleJumpAvailable = false;

function drawCyberPlayer(ctx, x, y, w, h, frame) {
    ctx.fillStyle = '#00ffcc';
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 10;
    // Head
    ctx.fillRect(x + 5, y, 20, 10);
    // Body / Engine
    ctx.fillRect(x + 5, y + 12, 12, 12);
    // Wheel / Legs (Animated)
    if (Math.sin(frame) > 0) {
        ctx.fillRect(x + 2, y + 25, 10, 5);
        ctx.fillRect(x + 18, y + 20, 10, 5);
    } else {
        ctx.fillRect(x + 5, y + 20, 10, 5);
        ctx.fillRect(x + 15, y + 25, 10, 5);
    }
    // Visor
    ctx.fillStyle = '#ff0055';
    ctx.fillRect(x + 18, y + 2, 8, 4);
    
    // Double jump indicator
    if (doubleJumpAvailable && !player.grounded) {
        ctx.fillStyle = 'rgba(0, 255, 204, 0.4)';
        ctx.beginPath();
        ctx.arc(x + 15, y + 15, 18, 0, Math.PI*2);
        ctx.fill();
    }
    ctx.shadowBlur = 0;
}

function drawServerRack(ctx, x, y, w, h, seed) {
    ctx.fillStyle = '#222';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#444';
    ctx.strokeRect(x, y, w, h);
    
    // Blinking lights (deterministic per rack to avoid flicker)
    for(let i = y + 5; i < y + h - 5; i += 10) {
        let hash = ((seed * 7 + i * 13) % 100) / 100;
        let blink = Math.sin(engine.lastTime / 300 + hash * 10) > 0;
        ctx.fillStyle = blink ? '#00ff00' : '#113311';
        ctx.fillRect(x + 5, i, 5, 2);
        ctx.fillStyle = !blink ? '#ff0000' : '#331111';
        ctx.fillRect(x + 15, i, 5, 2);
    }
}

engine.start(() => {
    player.y = floorY - 30;
    player.vy = 0;
    player.grounded = true;
    obstacles = [];
    speed = 5;
    spawnTimer = 0;
    runFrame = 0;
    distanceTraveled = 0;
    doubleJumpAvailable = true;
}, (dt) => {
    const factor = dt / 16.67;
    
    // Jump - with double jump
    if (engine.justPressed('Space') || engine.justPressed('ArrowUp')) {
        if (player.grounded) {
            player.vy = -12;
            player.grounded = false;
            doubleJumpAvailable = true;
            engine.spawnParticle(player.x + 15, player.y + 30, '#fff', 5);
        } else if (doubleJumpAvailable) {
            player.vy = -10;
            doubleJumpAvailable = false;
            engine.spawnParticle(player.x + 15, player.y + 30, '#00ffcc', 8);
        }
    }
    
    // Physics with dt normalization
    player.vy += 0.6 * factor;
    player.y += player.vy * factor;
    if (player.y > floorY - 30) {
        player.y = floorY - 30;
        player.vy = 0;
        player.grounded = true;
    }
    
    // Animation in update, not draw
    if (player.grounded) runFrame += 0.2 * factor;
    
    spawnTimer += dt;
    speed += 0.001 * dt;
    distanceTraveled += speed * factor;
    
    // Clamped spawn timer (min 400ms)
    const minSpawn = Math.max(400, 1500 - speed * 50);
    if (spawnTimer > minSpawn + Math.random() * 800) {
        let h = Math.random() > 0.5 ? 60 : 30;
        let y = floorY - h;
        if (Math.random() > 0.7) y -= 50;
        let o = new Entity(800, y, 30, h, '#ff4400');
        o.seed = Math.random() * 1000;
        obstacles.push(o);
        spawnTimer = 0;
    }
    obstacles.forEach(o => {
        o.x -= speed * factor;
        if (player.collidesWith(o)) {
            engine.addShake(10);
            engine.spawnParticle(player.x, player.y, '#00ffcc', 20);
            engine.state = 'GAMEOVER';
        }
    });
    obstacles = obstacles.filter(o => o.x > -100);
    engine.score = Math.floor(distanceTraveled / 10);
}, (ctx) => {
    // Background Grid
    let gridOffset = (distanceTraveled * 0.5) % 50;
    ctx.strokeStyle = '#003300';
    ctx.lineWidth = 1;
    for(let x=0; x<850; x+=50) {
        ctx.beginPath(); ctx.moveTo(x - gridOffset, 0); ctx.lineTo(x - gridOffset, 600); ctx.stroke();
    }
    for(let y=0; y<600; y+=50) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(800, y); ctx.stroke();
    }

    // Floor
    let grad = ctx.createLinearGradient(0, floorY, 0, 600);
    grad.addColorStop(0, '#001133');
    grad.addColorStop(1, '#000000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, floorY, 800, 100);
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, floorY); ctx.lineTo(800, floorY); ctx.stroke();

    drawCyberPlayer(ctx, player.x, player.y, player.width, player.height, runFrame);
    obstacles.forEach(o => drawServerRack(ctx, o.x, o.y, o.width, o.height, o.seed));

    // Speed indicator
    ctx.font = '8px "Press Start 2P"';
    ctx.fillStyle = '#00ffcc';
    ctx.textAlign = 'left';
    ctx.fillText(`SPD: ${speed.toFixed(1)}`, 10, 590);
});
