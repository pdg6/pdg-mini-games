const engine = new Engine('gameCanvas');
engine.gameName = 'space-defender';
engine.loadHighScore();

const player = new Entity(380, 550, 40, 20, '#00ff44');
let bullets = [];
let enemies = [];
let enemyBullets = [];
let spawnTimer = 0;
let fireCooldown = 0;
let powerups = [];
let fireLevel = 1;
let shieldActive = false;
let shieldTimer = 0;
let wave = 1;
let waveTimer = 0;
let enemiesKilled = 0;
const WAVE_SIZE = 10;

function drawSpaceship(ctx, x, y, c) {
    ctx.shadowBlur = 10;
    ctx.shadowColor = c;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x + 20, y);
    ctx.lineTo(x + 40, y + 20);
    ctx.lineTo(x + 20, y + 15);
    ctx.lineTo(x, y + 20);
    ctx.closePath();
    ctx.fill();
    
    // Engine glow
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 18, y + 18, 4, 4 + Math.random() * 4);
    ctx.shadowBlur = 0;
    
    // Shield visual
    if (shieldActive) {
        ctx.strokeStyle = 'rgba(0, 150, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + 20, y + 10, 25, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Fire level indicators
    if (fireLevel > 1) {
        ctx.fillStyle = '#ffcc00';
        for (let i = 0; i < fireLevel - 1; i++) {
            ctx.fillRect(x + 5 + i * 10, y + 22, 6, 2);
        }
    }
}

function drawAlien(ctx, x, y, w, h, color, hp) {
    ctx.fillStyle = color;
    ctx.fillRect(x + w*0.2, y, w*0.6, h*0.2);
    ctx.fillRect(x + w*0.1, y + h*0.2, w*0.8, h*0.2);
    ctx.fillRect(x, y + h*0.4, w, h*0.3);
    ctx.fillRect(x, y + h*0.7, w*0.2, h*0.3);
    ctx.fillRect(x + w*0.8, y + h*0.7, w*0.2, h*0.3);
    
    ctx.fillStyle = '#000';
    ctx.fillRect(x + w*0.3, y + h*0.45, w*0.1, h*0.1);
    ctx.fillRect(x + w*0.6, y + h*0.45, w*0.1, h*0.1);
    
    // HP bar for tough enemies
    if (hp > 1) {
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y - 6, w, 4);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(x, y - 6, w * (hp / 3), 4);
    }
}

function spawnPowerup(x, y) {
    if (Math.random() > 0.85) {
        const type = Math.random() > 0.5 ? 'fire' : 'shield';
        powerups.push({ x, y, type, vy: 1.5 });
    }
}

engine.start(() => {
    player.x = 380;
    bullets = [];
    enemies = [];
    enemyBullets = [];
    powerups = [];
    spawnTimer = 0;
    fireCooldown = 0;
    fireLevel = 1;
    shieldActive = false;
    shieldTimer = 0;
    wave = 1;
    waveTimer = 0;
    enemiesKilled = 0;
}, (dt) => {
    const factor = dt / 16.67;
    
    // Player movement
    if (engine.keys['ArrowLeft'] || engine.keys['KeyA']) player.x -= 6 * factor;
    if (engine.keys['ArrowRight'] || engine.keys['KeyD']) player.x += 6 * factor;
    player.x = Math.max(0, Math.min(760, player.x));
    
    // Fire
    if (fireCooldown > 0) fireCooldown -= dt;
    if (engine.keys['Space'] && fireCooldown <= 0) {
        const cooldown = fireLevel >= 3 ? 120 : 200;
        if (fireLevel === 1) {
            bullets.push(new Entity(player.x + 18, player.y, 4, 10, '#00ffff'));
        } else if (fireLevel === 2) {
            bullets.push(new Entity(player.x + 10, player.y, 4, 10, '#00ffff'));
            bullets.push(new Entity(player.x + 26, player.y, 4, 10, '#00ffff'));
        } else {
            bullets.push(new Entity(player.x + 18, player.y - 5, 4, 10, '#00ffff'));
            bullets.push(new Entity(player.x + 6, player.y, 3, 8, '#00aaff'));
            bullets.push(new Entity(player.x + 30, player.y, 3, 8, '#00aaff'));
        }
        fireCooldown = cooldown;
    }
    
    // Shield timer
    if (shieldActive) {
        shieldTimer -= dt;
        if (shieldTimer <= 0) shieldActive = false;
    }
    
    // Wave system
    const spawnRate = Math.max(300, 1000 - wave * 50);
    spawnTimer += dt;
    if (spawnTimer > spawnRate && enemies.length < 15) {
        let type = Math.random();
        let e = new Entity(Math.random() * 720 + 20, -40, 30, 30, '#ff00ff');
        if (type > 0.85) { 
            e.color = '#ff0000'; e.hp = 3; e.maxHp = 3; e.width = 40; e.height = 40;
            e.canShoot = true; e.shootTimer = 0;
        } else if (type > 0.7) {
            e.color = '#ffaa00'; e.hp = 2; e.maxHp = 2;
            e.canShoot = false;
        } else { 
            e.hp = 1; e.maxHp = 1; e.canShoot = false;
        }
        e.movePattern = Math.random() > 0.7 ? 'zigzag' : 'straight';
        e.moveTimer = 0;
        enemies.push(e);
        spawnTimer = 0;
    }
    
    // Bullets move
    bullets.forEach(b => b.y -= 8 * factor);
    
    // Enemy bullets
    enemyBullets.forEach(b => {
        b.x += b.vx * factor;
        b.y += b.vy * factor;
    });
    enemyBullets = enemyBullets.filter(b => b.y < 620 && b.x > -10 && b.x < 810);
    
    // Enemy AI
    enemies.forEach(e => {
        const baseSpeed = (2 + wave * 0.2) * factor;
        e.moveTimer += dt;
        
        if (e.movePattern === 'zigzag') {
            e.y += baseSpeed * 0.7;
            e.x += Math.sin(e.moveTimer / 300) * 2 * factor;
        } else {
            e.y += baseSpeed;
        }
        
        // Enemy shooting
        if (e.canShoot) {
            e.shootTimer += dt;
            if (e.shootTimer > 1500) {
                let dx = (player.x + 20) - (e.x + e.width/2);
                let dy = (player.y) - (e.y + e.height);
                let len = Math.hypot(dx, dy);
                enemyBullets.push({ 
                    x: e.x + e.width/2, y: e.y + e.height, 
                    vx: (dx/len) * 3, vy: (dy/len) * 3, 
                    w: 4, h: 4 
                });
                e.shootTimer = 0;
            }
        }
        
        // Enemy-player collision
        if (e.collidesWith(player) && !e.dead) {
            if (shieldActive) {
                e.dead = true;
                engine.score += 5;
                engine.spawnParticle(e.x + 15, e.y + 15, '#0088ff', 10);
            } else {
                engine.addShake(15);
                engine.spawnParticle(player.x, player.y, '#00ff44', 20);
                engine.state = 'GAMEOVER';
            }
        }
        
        // Bullet-enemy collision
        bullets.forEach(b => {
            if (!b.dead && !e.dead && b.collidesWith(e)) {
                b.dead = true;
                e.hp--;
                engine.spawnParticle(b.x, b.y, '#fff', 3);
                if (e.hp <= 0) {
                    e.dead = true;
                    engine.score += e.maxHp * 10;
                    enemiesKilled++;
                    engine.spawnParticle(e.x + 15, e.y + 15, e.color, 10);
                    engine.addShake(2);
                    spawnPowerup(e.x + e.width/2, e.y);
                    
                    // Wave progression
                    if (enemiesKilled % WAVE_SIZE === 0) {
                        wave++;
                        engine.spawnParticle(400, 300, '#ffcc00', 15);
                    }
                }
            }
        });
        if (e.y > 600 && !e.dead) { engine.score = Math.max(0, engine.score - 5); e.dead = true; }
    });
    
    // Enemy bullet-player collision
    enemyBullets.forEach(b => {
        if (player.x < b.x + b.w && player.x + player.width > b.x &&
            player.y < b.y + b.h && player.y + player.height > b.y) {
            if (shieldActive) {
                b.dead = true;
                engine.spawnParticle(b.x, b.y, '#0088ff', 3);
            } else {
                engine.addShake(10);
                engine.spawnParticle(player.x + 20, player.y, '#ff0000', 15);
                engine.state = 'GAMEOVER';
            }
        }
    });
    enemyBullets = enemyBullets.filter(b => !b.dead);
    
    // Powerup collection
    powerups.forEach(p => {
        p.y += p.vy * factor;
        if (player.x < p.x + 15 && player.x + player.width > p.x - 5 &&
            player.y < p.y + 15 && player.y + player.height > p.y - 5) {
            if (p.type === 'fire') {
                fireLevel = Math.min(3, fireLevel + 1);
            } else {
                shieldActive = true;
                shieldTimer = 5000;
            }
            engine.spawnParticle(p.x, p.y, p.type === 'fire' ? '#ffcc00' : '#0088ff', 8);
            p.dead = true;
        }
    });
    powerups = powerups.filter(p => p.y < 620 && !p.dead);
    
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
    
    // Enemy bullets
    enemyBullets.forEach(b => {
        ctx.fillStyle = '#ff4444';
        ctx.shadowBlur = 4; ctx.shadowColor = '#ff0000';
        ctx.fillRect(b.x - 2, b.y - 2, b.w, b.h);
        ctx.shadowBlur = 0;
    });
    
    enemies.forEach(e => drawAlien(ctx, e.x, e.y, e.width, e.height, e.color, e.hp));
    
    // Powerups
    powerups.forEach(p => {
        ctx.fillStyle = p.type === 'fire' ? '#ffcc00' : '#0088ff';
        ctx.shadowBlur = 8; ctx.shadowColor = ctx.fillStyle;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(p.type === 'fire' ? 'F' : 'S', p.x, p.y + 4);
        ctx.shadowBlur = 0;
    });
    
    // Starfield
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for(let i=0; i<30; i++) {
        let sx = (i * 137) % 800;
        let sy = (engine.lastTime / (5 + (i%5)) + i*40) % 600;
        ctx.fillRect(sx, sy, 2, 2);
    }
    
    // Wave indicator
    ctx.font = '8px "Press Start 2P"';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'left';
    ctx.fillText('WAVE ' + wave, 10, 590);
    
    if (shieldActive) {
        ctx.fillStyle = '#0088ff';
        ctx.fillText('SHIELD', 10, 575);
    }
});
