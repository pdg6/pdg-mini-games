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

const PATTERNS = {
    SPIRAL: 0,
    BURST: 1,
    WAVE: 2,
    CROSS: 3
};

function drawCore(ctx, x, y) {
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#fff';
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    
    // Rotating shield bits
    let t = engine.lastTime / 200;
    ctx.fillStyle = '#ff0044';
    for(let i=0; i<3; i++) {
        let ax = x + Math.cos(t + i*2) * 15;
        let ay = y + Math.sin(t + i*2) * 15;
        ctx.beginPath(); ctx.arc(ax, ay, 3, 0, Math.PI*2); ctx.fill();
    }
    
    // Graze combo indicator
    if (grazeCombo > 5) {
        ctx.font = '10px "Press Start 2P"';
        ctx.fillStyle = `hsl(${grazeCombo * 10}, 100%, 70%)`;
        ctx.textAlign = 'center';
        ctx.fillText(`x${grazeCombo}`, x, y - 20);
    }
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
                    color: `hsl(${(angle * 60) % 360}, 100%, 70%)`,
                    grazed: false
                });
            }
            break;
        case PATTERNS.BURST:
            for(let i=0; i<8; i++) {
                let a = (i / 8) * Math.PI * 2;
                bullets.push({
                    x: 400, y: 300,
                    vx: Math.cos(a) * (spd + 1),
                    vy: Math.sin(a) * (spd + 1),
                    color: `hsl(${i * 45}, 100%, 70%)`,
                    grazed: false
                });
            }
            break;
        case PATTERNS.WAVE:
            for(let i=0; i<3; i++) {
                bullets.push({
                    x: 100 + i * 300, y: -10,
                    vx: Math.sin(angle + i) * 2,
                    vy: spd,
                    color: `hsl(${200 + i * 40}, 100%, 70%)`,
                    grazed: false
                });
            }
            break;
        case PATTERNS.CROSS:
            for(let i=0; i<4; i++) {
                let a = angle + i * Math.PI/2;
                for(let j=1; j<=2; j++) {
                    bullets.push({
                        x: 400 + Math.cos(a) * j * 30, 
                        y: 100 + Math.sin(a) * j * 30,
                        vx: Math.cos(a) * spd * 0.8,
                        vy: Math.sin(a) * spd * 0.8 + 1,
                        color: `hsl(${(a * 90) % 360}, 100%, 70%)`,
                        grazed: false
                    });
                }
            }
            break;
    }
}

engine.start(() => {
    player.x = 400; player.y = 500;
    bullets = [];
    timer = 0;
    patternTimer = 0;
    pattern = 0;
    patternDuration = 0;
    difficulty = 1;
    grazeCombo = 0;
    grazeTimer = 0;
}, (dt) => {
    const factor = dt / 16.67;
    let speed = 4 * factor;
    if (engine.keys['ShiftLeft'] || engine.keys['ShiftRight']) speed = 2 * factor;
    if (engine.keys['ArrowUp'] || engine.keys['KeyW']) player.y -= speed;
    if (engine.keys['ArrowDown'] || engine.keys['KeyS']) player.y += speed;
    if (engine.keys['ArrowLeft'] || engine.keys['KeyA']) player.x -= speed;
    if (engine.keys['ArrowRight'] || engine.keys['KeyD']) player.x += speed;
    player.x = Math.max(10, Math.min(790, player.x));
    player.y = Math.max(10, Math.min(590, player.y));

    // Difficulty ramp
    difficulty = 1 + engine.score / 500;

    // Pattern switching
    patternDuration += dt;
    if (patternDuration > 5000) {
        pattern = (pattern + 1) % 4;
        patternDuration = 0;
    }

    timer += dt;
    patternTimer += dt;
    const spawnRate = Math.max(30, 60 - difficulty * 3);
    if (timer > spawnRate) {
        let angle = patternTimer / 200;
        spawnPattern(angle);
        timer = 0;
    }

    // Graze timer decay
    grazeTimer -= dt;
    if (grazeTimer <= 0) {
        grazeCombo = 0;
        grazeTimer = 0;
    }

    let hit = false;
    bullets.forEach(b => {
        b.x += b.vx * factor; 
        b.y += b.vy * factor;
        let dist = Math.hypot(player.x - b.x, player.y - b.y);
        // Graze scoring (once per bullet)
        if (dist < 25 && dist > 8 && !b.grazed) {
            b.grazed = true;
            grazeCombo++;
            grazeTimer = 1000;
            engine.score += Math.min(grazeCombo, 20);
        }
        if (dist < 6) {
            hit = true;
            engine.addShake(20);
            engine.spawnParticle(player.x, player.y, '#fff', 30);
        }
    });
    if (hit) engine.state = 'GAMEOVER';
    bullets = bullets.filter(b => b.x > -50 && b.x < 850 && b.y > -50 && b.y < 650);
}, (ctx) => {
    // Background - subtle radial grid
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1;
    for(let r = 50; r < 500; r += 80) {
        ctx.beginPath(); ctx.arc(400, 300, r, 0, Math.PI*2); ctx.stroke();
    }

    drawCore(ctx, player.x, player.y);
    // Bullets - Glowing Orbs
    bullets.forEach(b => {
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = b.color;
        ctx.beginPath(); ctx.arc(b.x, b.y, 6, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI*2); ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';

    // Pattern indicator
    ctx.font = '8px "Press Start 2P"';
    ctx.fillStyle = '#555';
    ctx.textAlign = 'left';
    const names = ['SPIRAL','BURST','WAVE','CROSS'];
    ctx.fillText(names[pattern], 10, 590);
});
