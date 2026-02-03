const engine = new Engine('gameCanvas');
const player = new Entity(380, 550, 40, 20, '#00ff44');
let bullets = [];
let enemies = [];
let spawnTimer = 0;
let fireCooldown = 0;

function drawSpaceship(ctx, x, y, c) {
    ctx.shadowBlur = 10;
    ctx.shadowColor = c;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x + 20, y); // Tip
    ctx.lineTo(x + 40, y + 20); // Right Wing
    ctx.lineTo(x + 20, y + 15); // Center indent
    ctx.lineTo(x, y + 20); // Left Wing
    ctx.closePath();
    ctx.fill();
    
    // Engine glow
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 18, y + 18, 4, 6);
    ctx.shadowBlur = 0;
}

function drawAlien(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    // Invader shape
    ctx.fillRect(x + w*0.2, y, w*0.6, h*0.2); // Top
    ctx.fillRect(x + w*0.1, y + h*0.2, w*0.8, h*0.2); // Brow
    ctx.fillRect(x, y + h*0.4, w, h*0.3); // Eyes level
    ctx.fillRect(x, y + h*0.7, w*0.2, h*0.3); // Leg L
    ctx.fillRect(x + w*0.8, y + h*0.7, w*0.2, h*0.3); // Leg R
    
    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(x + w*0.3, y + h*0.45, w*0.1, h*0.1);
    ctx.fillRect(x + w*0.6, y + h*0.45, w*0.1, h*0.1);
}

engine.start(() => {
    player.x = 380;
    bullets = [];
    enemies = [];
    spawnTimer = 0;
}, (dt) => {
    if (engine.keys['ArrowLeft'] && player.x > 0) player.x -= 6;
    if (engine.keys['ArrowRight'] && player.x < 760) player.x += 6;
    if (fireCooldown > 0) fireCooldown -= dt;
    if (engine.keys['Space'] && fireCooldown <= 0) {
        bullets.push(new Entity(player.x + 18, player.y, 4, 10, '#00ffff'));
        fireCooldown = 200;
    }
    spawnTimer += dt;
    if (spawnTimer > 1000 - (engine.score * 2)) {
        let type = Math.random();
        let e = new Entity(Math.random() * 760, -40, 30, 30, '#ff00ff');
        if (type > 0.8) { e.color = '#ff0000'; e.hp = 3; e.width = 40; e.height = 40; } 
        else { e.hp = 1; }
        enemies.push(e);
        spawnTimer = 0;
    }
    bullets.forEach(b => b.y -= 8);
    enemies.forEach(e => {
        e.y += 2 + (engine.score / 500);
        if (e.collidesWith(player)) {
            engine.addShake(15);
            engine.spawnParticle(player.x, player.y, '#00ff44', 20);
            engine.state = 'GAMEOVER';
        }
        bullets.forEach(b => {
            if (!b.dead && !e.dead && b.collidesWith(e)) {
                b.dead = true;
                e.hp--;
                engine.spawnParticle(b.x, b.y, '#fff', 3);
                if (e.hp <= 0) {
                    e.dead = true;
                    engine.score += 10;
                    engine.spawnParticle(e.x + 15, e.y + 15, e.color, 10);
                    engine.addShake(2);
                }
            }
        });
        if (e.y > 600 && !e.dead) { engine.score -= 5; e.dead = true; }
    });
    bullets = bullets.filter(b => b.y > -20 && !b.dead);
    enemies = enemies.filter(e => e.y < 650 && !e.dead);
}, (ctx) => {
    drawSpaceship(ctx, player.x, player.y, player.color);
    bullets.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.shadowBlur = 5; ctx.shadowColor = b.color;
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.shadowBlur = 0;
    });
    enemies.forEach(e => drawAlien(ctx, e.x, e.y, e.width, e.height, e.color));
    
    // Starfield
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for(let i=0; i<30; i++) {
        let sx = (i * 137) % 800;
        let sy = (engine.lastTime / (5 + (i%5)) + i*40) % 600;
        ctx.fillRect(sx, sy, 2, 2);
    }
});
