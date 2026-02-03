const engine = new Engine('gameCanvas');
const player = new Entity(100, 500, 30, 30, '#00ffcc');
let obstacles = [];
let floorY = 500;
let speed = 5;
let spawnTimer = 0;
let runFrame = 0;

function drawCyberPlayer(ctx, x, y, w, h) {
    ctx.fillStyle = '#00ffcc';
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 10;
    // Head
    ctx.fillRect(x + 5, y, 20, 10);
    // Body / Engine
    ctx.fillRect(x + 5, y + 12, 12, 12);
    // Wheel / Legs (Animated)
    runFrame += 0.2;
    if (Math.sin(runFrame) > 0) {
        ctx.fillRect(x + 2, y + 25, 10, 5); // Back foot
        ctx.fillRect(x + 18, y + 20, 10, 5); // Front foot
    } else {
        ctx.fillRect(x + 5, y + 20, 10, 5);
        ctx.fillRect(x + 15, y + 25, 10, 5);
    }
    // Visor
    ctx.fillStyle = '#ff0055';
    ctx.fillRect(x + 18, y + 2, 8, 4);
    ctx.shadowBlur = 0;
}

function drawServerRack(ctx, x, y, w, h) {
    ctx.fillStyle = '#222';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#444';
    ctx.strokeRect(x, y, w, h);
    
    // Blinking lights
    for(let i = y + 5; i < y + h - 5; i += 10) {
        ctx.fillStyle = Math.random() > 0.5 ? '#00ff00' : '#113311';
        ctx.fillRect(x + 5, i, 5, 2);
        ctx.fillStyle = Math.random() > 0.5 ? '#ff0000' : '#331111';
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
}, (dt) => {
    // Logic mostly same as before
    if ((engine.keys['Space'] || engine.keys['ArrowUp']) && player.grounded) {
        player.vy = -12;
        player.grounded = false;
        engine.spawnParticle(player.x + 15, player.y + 30, '#fff', 5);
    }
    player.vy += 0.6;
    player.y += player.vy;
    if (player.y > floorY - 30) {
        player.y = floorY - 30;
        player.vy = 0;
        player.grounded = true;
    }
    spawnTimer += dt;
    speed += 0.001 * dt;
    if (spawnTimer > 1500 + Math.random() * 1000 - (speed * 50)) {
        let h = Math.random() > 0.5 ? 60 : 30;
        let y = floorY - h;
        if (Math.random() > 0.7) y -= 50; 
        obstacles.push(new Entity(800, y, 30, h, '#ff4400'));
        spawnTimer = 0;
    }
    obstacles.forEach(o => {
        o.x -= speed;
        if (player.collidesWith(o)) {
            engine.addShake(10);
            engine.spawnParticle(player.x, player.y, '#00ffcc', 20);
            engine.state = 'GAMEOVER';
        }
    });
    obstacles = obstacles.filter(o => o.x > -100);
    engine.score += Math.floor(speed);
}, (ctx) => {
    // Background Grid
    let gridOffset = (engine.score * 5) % 50;
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

    drawCyberPlayer(ctx, player.x, player.y, player.width, player.height);
    obstacles.forEach(o => drawServerRack(ctx, o.x, o.y, o.width, o.height));
});
