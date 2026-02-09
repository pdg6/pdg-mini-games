const engine = new Engine('gameCanvas');
engine.gameName = 'gravity-flip';
engine.loadHighScore();

const player = new Entity(100, 300, 30, 30, '#00ffff');
let gravity = 0.8;
let obstacles = [];
let gameSpeed = 5;
let spawnTimer = 0;
let flipCount = 0;
let distanceTraveled = 0;

function drawSpike(ctx, x, y, h, type) {
    let grad = ctx.createLinearGradient(x, type==='TOP'?50:550-h, x, type==='TOP'?50+h:550);
    grad.addColorStop(0, '#550000');
    grad.addColorStop(1, '#ff0000');
    ctx.fillStyle = grad;
    ctx.beginPath();
    if (type === 'BOTTOM') {
        ctx.moveTo(x, 550);
        ctx.lineTo(x + 15, 550 - h);
        ctx.lineTo(x + 30, 550);
    } else {
        ctx.moveTo(x, 50);
        ctx.lineTo(x + 15, 50 + h);
        ctx.lineTo(x + 30, 50);
    }
    ctx.fill();
    ctx.strokeStyle = '#ffbbbb';
    ctx.lineWidth = 1;
    ctx.stroke();
}

// Point-in-triangle test for accurate spike collision
function pointInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
    const d1 = (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
    const d2 = (px - x3) * (y2 - y3) - (x2 - x3) * (py - y3);
    const d3 = (px - x1) * (y3 - y1) - (x3 - x1) * (py - y1);
    const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
    return !(hasNeg && hasPos);
}

function collidesWithSpike(player, o) {
    let x1, y1, x2, y2, x3, y3;
    if (o.type === 'BOTTOM') {
        x1 = o.x; y1 = 550;
        x2 = o.x + 15; y2 = 550 - o.h;
        x3 = o.x + 30; y3 = 550;
    } else {
        x1 = o.x; y1 = 50;
        x2 = o.x + 15; y2 = 50 + o.h;
        x3 = o.x + 30; y3 = 50;
    }
    // Check player corners against triangle
    const corners = [
        [player.x, player.y],
        [player.x + player.width, player.y],
        [player.x, player.y + player.height],
        [player.x + player.width, player.y + player.height],
        [player.x + player.width/2, player.y + player.height/2]
    ];
    return corners.some(([px, py]) => pointInTriangle(px, py, x1, y1, x2, y2, x3, y3));
}

function drawGravityMan(ctx, x, y, w, h, flipped) {
    ctx.save();
    ctx.translate(x + w/2, y + h/2);
    if (flipped) ctx.scale(1, -1);
    
    // Glow based on gravity direction
    ctx.shadowColor = flipped ? '#ff6600' : '#00ffff';
    ctx.shadowBlur = 8;
    
    ctx.fillStyle = flipped ? '#ff6600' : '#00ffff';
    // Body
    ctx.fillRect(-10, -15, 20, 15);
    // Head
    ctx.fillStyle = '#fff';
    ctx.fillRect(-8, -25, 16, 10);
    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(-4, -22, 4, 4);
    ctx.fillRect(3, -22, 4, 4);
    // Legs (Idle/Run placeholder)
    ctx.fillStyle = flipped ? '#993300' : '#008888';
    ctx.fillRect(-10, 0, 8, 15);
    ctx.fillRect(2, 0, 8, 15);
    
    ctx.shadowBlur = 0;
    ctx.restore();
}

engine.start(() => {
    player.y = 300; player.vy = 0;
    gravity = 0.8; obstacles = []; gameSpeed = 5;
    flipCount = 0; distanceTraveled = 0;
    spawnTimer = 0;
}, (dt) => {
    const factor = dt / 16.67;
    
    if (engine.justPressed('Space')) {
        gravity *= -1;
        flipCount++;
        engine.spawnParticle(player.x+15, player.y+15, gravity < 0 ? '#ff6600' : '#00ffff', 10);
    }
    
    player.vy += gravity * factor;
    player.y += player.vy * factor;
    if (player.y < 50) { player.y = 50; player.vy = 0; }
    if (player.y > 520) { player.y = 520; player.vy = 0; }
    
    spawnTimer += dt;
    gameSpeed += 0.001 * dt;
    distanceTraveled += gameSpeed * factor;
    
    // Spawn both TOP and BOTTOM spikes, sometimes paired
    const spawnRate = Math.max(600, 1500 - gameSpeed * 30);
    if (spawnTimer > spawnRate) {
        let type = Math.random() > 0.5 ? 'TOP' : 'BOTTOM';
        let h = Math.random() * 60 + 30;
        obstacles.push({x: 800, y: 0, w: 30, h: h, type});
        // Sometimes add a pair
        if (gameSpeed > 7 && Math.random() > 0.6) {
            let otherType = type === 'TOP' ? 'BOTTOM' : 'TOP';
            let otherH = Math.random() * 40 + 20;
            obstacles.push({x: 850, y: 0, w: 30, h: otherH, type: otherType});
        }
        spawnTimer = 0;
    }
    obstacles.forEach(o => {
        o.x -= gameSpeed * factor;
        if (collidesWithSpike(player, o)) {
            engine.addShake(20);
            engine.spawnParticle(player.x + 15, player.y + 15, '#ff0000', 15);
            engine.state = 'GAMEOVER';
        }
    });
    obstacles = obstacles.filter(o => o.x > -40);
    engine.score = Math.floor(distanceTraveled / 10);
}, (ctx) => {
    // Tunnel
    let grad = ctx.createLinearGradient(0, 0, 0, 600);
    grad.addColorStop(0, '#333');
    grad.addColorStop(0.1, '#111');
    grad.addColorStop(0.9, '#111');
    grad.addColorStop(1, '#333');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 600);
    
    ctx.fillStyle = '#444';
    ctx.fillRect(0, 0, 800, 50);
    ctx.fillRect(0, 550, 800, 50);
    
    // Scrolling details
    ctx.strokeStyle = '#555';
    let scrollOffset = distanceTraveled % 100;
    for(let i = -scrollOffset; i < 800; i += 100) {
        ctx.strokeRect(i, 0, 50, 50);
        ctx.strokeRect(i, 550, 50, 50);
    }

    // Gravity direction indicator
    ctx.fillStyle = gravity < 0 ? '#ff6600' : '#00ffff';
    ctx.font = '20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(gravity < 0 ? '▲' : '▼', 15, 35);

    drawGravityMan(ctx, player.x, player.y, player.width, player.height, gravity < 0);
    obstacles.forEach(o => drawSpike(ctx, o.x, o.y, o.h, o.type));
});
