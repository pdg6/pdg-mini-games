const engine = new Engine('gameCanvas');
const player = { x: 400, y: 500, radius: 4 };
let bullets = [];
let timer = 0;
let patternTimer = 0;

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
}

engine.start(() => {
    player.x = 400; player.y = 500;
    bullets = [];
    timer = 0;
}, (dt) => {
    let speed = 4;
    if (engine.keys['ShiftLeft']) speed = 2;
    if (engine.keys['ArrowUp']) player.y -= speed;
    if (engine.keys['ArrowDown']) player.y += speed;
    if (engine.keys['ArrowLeft']) player.x -= speed;
    if (engine.keys['ArrowRight']) player.x += speed;
    player.x = Math.max(10, Math.min(790, player.x));
    player.y = Math.max(10, Math.min(590, player.y));

    timer += dt;
    patternTimer += dt;
    if (timer > 50) {
        let angle = (patternTimer / 200);
        for(let i=0; i<4; i++) {
           bullets.push({ 
               x: 400, y: 100, 
               vx: Math.cos(angle + i*Math.PI/2) * 3, 
               vy: Math.sin(angle + i*Math.PI/2) * 3,
               color: hsl(, 100%, 70%)
           });
        }
        timer = 0;
    }

    bullets.forEach(b => {
        b.x += b.vx; b.y += b.vy;
        let dist = Math.hypot(player.x - b.x, player.y - b.y);
        if (dist < 20 && dist > 8) engine.score++;
        if (dist < 8) {
            engine.addShake(20);
            engine.spawnParticle(player.x, player.y, '#fff', 30);
            engine.state = 'GAMEOVER';
        }
    });
    bullets = bullets.filter(b => b.x > -50 && b.x < 850 && b.y > -50 && b.y < 650);
}, (ctx) => {
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
});
