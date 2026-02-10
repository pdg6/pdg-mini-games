const engine = new Engine('gameCanvas');
engine.gameName = 'bullet-storm';
engine.loadHighScore();

const player = { x: 400, y: 500, radius: 4 };
let bullets = [];
let timer = 0;
let patternTimer = 0;
let pattern = 0;
let patternDuration = 0;
let difficulty = 1;
let grazeCombo = 0;
let grazeTimer = 0;

// Dash/Ability
let dashCooldown = 0;
let dashTime = 0;
const DASH_DURATION = 150;
const DASH_COOLDOWN = 600;

const PATTERNS = {
    SPIRAL: 0, BURST: 1, WAVE: 2, CROSS: 3
};

function setup() {
    player.x = 400; player.y = 500;
    bullets = [];
    timer = 0; patternTimer = 0; pattern = 0; patternDuration = 0;
    difficulty = 1; grazeCombo = 0; grazeTimer = 0; dashCooldown = 0;
}

function spawnPattern(angle) {
    const spd = 2.5 + difficulty * 0.3;
    switch(pattern) {
        case PATTERNS.SPIRAL:
            for(let i=0; i<4; i++) {
                bullets.push({ 
                    x: 400, y: 100, 
                    vx: Math.cos(angle + i*Math.PI/2) * spd, 
                    vy: Math.sin(angle + i*Math.PI/2) * spd,
                    color: `hsl(${(angle * 60) % 360}, 100%, 70%)`, grazed: false
                });
            }
            break;
        case PATTERNS.BURST:
            for(let i=0; i<8; i++) {
                let a = (i / 8) * Math.PI * 2;
                bullets.push({
                    x: 400, y: 300, vx: Math.cos(a) * (spd + 1), vy: Math.sin(a) * (spd + 1),
                    color: `hsl(${i * 45}, 100%, 70%)`, grazed: false
                });
            }
            break;
        case PATTERNS.WAVE:
            for(let i=0; i<3; i++) {
                bullets.push({
                    x: 100 + i * 300, y: -10, vx: Math.sin(angle + i) * 2, vy: spd,
                    color: `hsl(${200 + i * 40}, 100%, 70%)`, grazed: false
                });
            }
            break;
        case PATTERNS.CROSS:
            for(let i=0; i<4; i++) {
                let a = angle + i * Math.PI/2;
                for(let j=1; j<=2; j++) {
                    bullets.push({
                        x: 400 + Math.cos(a) * j * 30, y: 100 + Math.sin(a) * j * 30,
                        vx: Math.cos(a) * spd * 0.8, vy: Math.sin(a) * spd * 0.8 + 1,
                        color: `hsl(${(a * 90) % 360}, 100%, 70%)`, grazed: false
                    });
                }
            }
            break;
    }
}

function drawCore(ctx, x, y) {
    Assets.renderPlayer(ctx, x - 10, y - 10, 20, 20, {
        rotation: engine.lastTime / 500,
        state: 'idle'
    });
    let t = engine.lastTime / 200;
    ctx.fillStyle = Assets.COLORS.secondary;
    for(let i=0; i<3; i++) {
        let ax = x + Math.cos(t + i*2) * 20;
        let ay = y + Math.sin(t + i*2) * 20;
        ctx.beginPath(); ctx.arc(ax, ay, 3, 0, Math.PI*2); ctx.fill();
    }
}

engine.start(setup, (dt) => {
    const factor = dt / 16.67;
    const now = performance.now();
    let speed = 4 * factor;

    const isFocused = engine.keys['ShiftLeft'] || engine.keys['ShiftRight'];
    if (isFocused) speed = 2 * factor;

    if (engine.justPressed('KeyZ') || engine.justPressed('Space')) {
        if (now > dashCooldown) {
            dashTime = now;
            dashCooldown = now + DASH_COOLDOWN;
            playSound('dash');
            for(let i=0; i<10; i++) engine.spawnSpark(player.x, player.y, Assets.COLORS.accent);
        }
    }

    const isDashing = now < dashTime + DASH_DURATION;

    if (engine.isDown('ArrowUp') || engine.isDown('KeyW')) player.y -= speed * (isDashing ? 2 : 1);
    if (engine.isDown('ArrowDown') || engine.isDown('KeyS')) player.y += speed * (isDashing ? 2 : 1);
    if (engine.isDown('ArrowLeft') || engine.isDown('KeyA')) player.x -= speed * (isDashing ? 2 : 1);
    if (engine.isDown('ArrowRight') || engine.isDown('KeyD')) player.x += speed * (isDashing ? 2 : 1);
    
    player.x = Math.max(10, Math.min(790, player.x));
    player.y = Math.max(10, Math.min(590, player.y));

    difficulty = 1 + engine.score / 500;
    patternDuration += dt;
    if (patternDuration > 4000) {
        pattern = (pattern + 1) % 4;
        patternDuration = 0;
        playSound('levelup');
    }

    timer += dt; patternTimer += dt;
    const spawnRate = Math.max(25, 50 - difficulty * 3);
    if (timer > spawnRate) {
        let angle = patternTimer / 150;
        spawnPattern(angle);
        timer = 0;
    }

    grazeTimer -= dt;
    if (grazeTimer <= 0) {
        grazeCombo = 0;
        grazeTimer = 0;
    }

    let hit = false;
    bullets.forEach(b => {
        b.x += b.vx * factor; b.y += b.vy * factor;
        const dx = b.x - player.x, dy = b.y - player.y;
        const d2 = dx*dx + dy*dy;

        if (!isDashing && d2 < 16) hit = true;
        else if (d2 < 625 && !b.grazed) {
            b.grazed = true; grazeCombo++; grazeTimer = 1000;
            engine.score += 5 + Math.floor(grazeCombo / 10);
            if (grazeCombo % 10 === 0) playSound('coin');
            engine.spawnSpark(player.x, player.y, b.color);
        }
    });

    if (hit) {
        engine.addShake(20); playSound('death'); engine.state = 'GAMEOVER';
        for(let i=0; i<30; i++) engine.spawnSpark(player.x, player.y, Assets.COLORS.primary);
    }
    bullets = bullets.filter(b => b.y > -50 && b.y < 650 && b.x > -50 && b.x < 850);
}, (ctx) => {
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for(let i=0; i<20; i++) {
        let sx = (i * 123) % 800, sy = (engine.lastTime / (10 + (i%5)) + i*50) % 600;
        ctx.fillRect(sx, sy, 2, 2);
    }
    bullets.forEach(b => {
        ctx.fillStyle = b.color; ctx.shadowBlur = 4; ctx.shadowColor = b.color;
        ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI*2); ctx.fill();
    });
    ctx.shadowBlur = 0;
    if (performance.now() < dashTime + DASH_DURATION) {
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(player.x, player.y, 15, 0, Math.PI*2); ctx.stroke();
    }
    drawCore(ctx, player.x, player.y);
    if (engine.isDown('ShiftLeft') || engine.isDown('ShiftRight')) {
        ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.arc(player.x, player.y, 4, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.stroke();
    }
    engine.drawParticles(ctx);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Courier New';
    ctx.fillText(`SCORE: ${engine.score}`, 20, 30);
    ctx.fillText(`GRAZE: ${grazeCombo}`, 20, 55);
    ctx.fillStyle = '#222'; ctx.fillRect(20, 70, 60, 4);
    const cdPct = Math.max(0, (dashCooldown - performance.now()) / DASH_COOLDOWN);
    ctx.fillStyle = cdPct > 0 ? '#444' : Assets.COLORS.accent;
    ctx.fillRect(20, 70, 60 * (1 - cdPct), 4);
});
