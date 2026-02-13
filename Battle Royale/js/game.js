const engine = new Engine('gameCanvas');
engine.gameName = 'battle-royale';

const MAP_SIZE = 2000;
let camera = { x: 0, y: 0 };
let player;
let bots = [];
let bullets = [];
let zone = { radius: MAP_SIZE, targetRadius: 0, shrinkSpeed: 10, damage: 5 };

class RoyaleEntity extends Entity {
    constructor(x, y, color, speed) {
        super(x, y, 20, 20, color);
        this.speed = speed;
        this.hp = 100;
        this.angle = 0;
        this.dead = false;
        this.cooldown = 0;
    }

    takeDamage(amount) {
        this.hp -= amount;
        engine.spawnSpark(this.x, this.y, this.color, 3);
        if (this.hp <= 0 && !this.dead) {
            this.dead = true;
            engine.spawnSpark(this.x, this.y, this.color, 15, 6);
            playSound('death');
        }
    }

    update(dt, factor) {
        if (this.dead) return;
        this.x += this.vx * factor;
        this.y += this.vy * factor;
        
        // Boundaries
        this.x = Math.max(-MAP_SIZE/2, Math.min(MAP_SIZE/2, this.x));
        this.y = Math.max(-MAP_SIZE/2, Math.min(MAP_SIZE/2, this.y));

        if (this.cooldown > 0) this.cooldown -= dt;
    }

    shoot() {
        if (this.cooldown <= 0) {
            bullets.push({
                x: this.x, y: this.y,
                vx: Math.cos(this.angle) * 10,
                vy: Math.sin(this.angle) * 10,
                owner: this,
                life: 100
            });
            this.cooldown = 300;
            playSound('shoot');
        }
    }
}

function setup() {
    player = new RoyaleEntity(0, 0, Assets.COLORS.primary, 4);
    bots = [];
    for(let i=0; i<24; i++) {
        const x = (Math.random() - 0.5) * MAP_SIZE;
        const y = (Math.random() - 0.5) * MAP_SIZE;
        bots.push(new RoyaleEntity(x, y, Assets.COLORS.secondary, 3));
    }
    bullets = [];
    zone.radius = MAP_SIZE;
}

engine.start(setup, (dt) => {
    const factor = dt / 16.67;
    
    // Player Move
    let dx = 0, dy = 0;
    if (engine.isDown('KeyW') || engine.isDown('ArrowUp')) dy -= 1;
    if (engine.isDown('KeyS') || engine.isDown('ArrowDown')) dy += 1;
    if (engine.isDown('KeyA') || engine.isDown('ArrowLeft')) dx -= 1;
    if (engine.isDown('KeyD') || engine.isDown('ArrowRight')) dx += 1;
    
    if (dx !== 0 || dy !== 0) {
        const mag = Math.hypot(dx, dy);
        player.vx = (dx / mag) * player.speed;
        player.vy = (dy / mag) * player.speed;
    } else {
        player.vx *= 0.8;
        player.vy *= 0.8;
    }
    
    player.update(dt, factor);
    
    // Player Rotation & Shoot
    const mouseWorldX = engine.mouse.x + camera.x;
    const mouseWorldY = engine.mouse.y + camera.y;
    player.angle = Math.atan2(mouseWorldY - player.y, mouseWorldX - player.x);
    if (engine.mouse.down) player.shoot();

    // Bots AI
    bots.forEach(bot => {
        if (bot.dead) return;
        
        // Simple logic: move towards center if in storm, else wander
        const distFromCenter = Math.hypot(bot.x, bot.y);
        if (distFromCenter > zone.radius - 50) {
            const angle = Math.atan2(-bot.y, -bot.x);
            bot.vx = Math.cos(angle) * bot.speed;
            bot.vy = Math.sin(angle) * bot.speed;
        } else {
            if (Math.random() > 0.98) {
                bot.angle = Math.random() * Math.PI * 2;
                bot.vx = Math.cos(bot.angle) * bot.speed * 0.5;
                bot.vy = Math.sin(bot.angle) * bot.speed * 0.5;
            }
        }
        
        // Aim at player if close
        const dToP = Math.hypot(player.x - bot.x, player.y - bot.y);
        if (dToP < 400 && !player.dead) {
            bot.angle = Math.atan2(player.y - bot.y, player.x - bot.x);
            bot.shoot();
        }

        bot.update(dt, factor);
    });

    // Bullets
    bullets.forEach(b => {
        b.x += b.vx * factor;
        b.y += b.vy * factor;
        b.life -= factor;
        
        // Collision
        const targets = [player, ...bots];
        targets.forEach(t => {
            if (t === b.owner || t.dead || b.dead) return;
            if (Math.hypot(b.x - t.x, b.y - t.y) < 20) {
                t.takeDamage(15);
                b.dead = true;
                if (t === player) engine.flash(100);
            }
        });
    });
    bullets = bullets.filter(b => b.life > 0 && !b.dead);
    
    // Zone
    zone.radius -= (zone.shrinkSpeed / 60) * factor;
    if (Math.hypot(player.x, player.y) > zone.radius) {
        player.takeDamage(0.2 * factor);
    }
    bots.forEach(bot => {
        if (!bot.dead && Math.hypot(bot.x, bot.y) > zone.radius) {
            bot.takeDamage(0.2 * factor);
        }
    });

    // Camera
    camera.x = player.x - 400;
    camera.y = player.y - 300;

    // Victory/Defeat
    if (player.dead) engine.state = 'GAMEOVER';
    if (bots.every(b => b.dead)) {
        engine.score += 1000;
        engine.state = 'GAMEOVER';
    }
}, (ctx) => {
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Grid
    ctx.strokeStyle = '#111';
    for(let i=-MAP_SIZE/2; i<=MAP_SIZE/2; i+=100) {
        ctx.beginPath(); ctx.moveTo(i, -MAP_SIZE/2); ctx.lineTo(i, MAP_SIZE/2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-MAP_SIZE/2, i); ctx.lineTo(MAP_SIZE/2, i); ctx.stroke();
    }

    // Zone
    ctx.beginPath();
    ctx.arc(0, 0, zone.radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Bots
    bots.forEach(bot => {
        if (bot.dead) return;
        Assets.renderPlayer(ctx, bot.x - 10, bot.y - 10, 20, 20, {
            rotation: bot.angle,
            velocity: { x: bot.vx, y: bot.vy },
            grounded: true,
            state: 'moving'
        });
    });

    // Bullets
    ctx.fillStyle = Assets.COLORS.highlight;
    bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI*2);
        ctx.fill();
    });

    // Player
    if (!player.dead) {
        Assets.renderPlayer(ctx, player.x - 12, player.y - 12, 24, 24, {
            rotation: player.angle,
            velocity: { x: player.vx, y: player.vy },
            grounded: true,
            state: 'moving'
        });
    }

    ctx.restore();
    
    // UI Local
    ctx.fillStyle = '#fff';
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'left';
    ctx.fillText(`ALIVE: ${bots.filter(b=>!b.dead).length + (player.dead?0:1)}`, 20, 60);
    
    // HP Bar
    ctx.fillStyle = '#333';
    ctx.fillRect(250, 570, 300, 10);
    ctx.fillStyle = player.hp > 30 ? Assets.COLORS.primary : Assets.COLORS.secondary;
    ctx.fillRect(250, 570, 300 * (Math.max(0, player.hp) / 100), 10);
});
