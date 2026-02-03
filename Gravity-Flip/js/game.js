const engine = new Engine('gameCanvas');
const player = new Entity(100, 300, 30, 30, '#00ffff');
let gravity = 0.8;
let obstacles = [];
let gameSpeed = 5;
let spawnTimer = 0;

function drawSpike(ctx, x, y, h, type) {
    let grad = ctx.createLinearGradient(x, type==='TOP'?y:y-h, x, type==='TOP'?y+h:y);
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

function drawGravityMan(ctx, x, y, w, h, flipped) {
    ctx.save();
    ctx.translate(x + w/2, y + h/2);
    if (flipped) ctx.scale(1, -1);
    
    ctx.fillStyle = '#00ffff';
    // Body
    ctx.fillRect(-10, -15, 20, 15);
    // Head
    ctx.fillStyle = '#fff';
    ctx.fillRect(-8, -25, 16, 10);
    // Legs (Idle/Run placeholder)
    ctx.fillStyle = '#008888';
    ctx.fillRect(-10, 0, 8, 15);
    ctx.fillRect(2, 0, 8, 15);
    
    ctx.restore();
}

engine.start(() => {
    player.y = 300; player.vy = 0;
    gravity = 0.8; obstacles = []; gameSpeed = 5;
}, (dt) => {
    if (engine.keys['Space'] && !engine.keysPressed['Space']) {
        gravity *= -1;
        engine.spawnParticle(player.x+15, player.y+15, '#fff', 10);
        engine.keysPressed['Space'] = true;
    }
    player.vy += gravity;
    player.y += player.vy;
    if (player.y < 50) { player.y = 50; player.vy = 0; }
    if (player.y > 520) { player.y = 520; player.vy = 0; }
    spawnTimer += dt;
    gameSpeed += 0.001 * dt;
    if (spawnTimer > 1500) {
        let type = Math.random() > 0.5 ? 'TOP' : 'BOTTOM';
        let y = type === 'TOP' ? 50 : 520;
        let h = Math.random() * 50 + 20;
        obstacles.push({x: 800, y: y, w: 30, h: h, type});
        spawnTimer = 0;
    }
    obstacles.forEach(o => {
        o.x -= gameSpeed;
       if (player.x < o.x + o.w && player.x + player.width > o.x &&
           Math.abs(player.y - o.y) < 50) { 
                engine.addShake(20);
                engine.state = 'GAMEOVER';
           }
    });
    engine.score += Math.floor(gameSpeed);
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
    
    // Details
    ctx.strokeStyle = '#555';
    for(let i=(engine.score*2)%100; i<800; i+=100) {
        ctx.strokeRect(i, 0, 50, 50);
        ctx.strokeRect(i, 550, 50, 50);
    }

    drawGravityMan(ctx, player.x, player.y, player.width, player.height, gravity < 0);
    obstacles.forEach(o => drawSpike(ctx, o.x, o.y, o.h, o.type));
});
