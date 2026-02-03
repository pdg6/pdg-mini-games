const engine = new Engine('gameCanvas');
const player = new Entity(50, 50, 20, 20, '#fff');
let guards = [];
let goal = { x: 700, y: 500, w: 40, h: 40};
let level = 1;

function setupLevel(lvl) {
    player.x = 50; player.y = 50;
    guards = [];
    for(let i=0; i<lvl + 2; i++) {
        guards.push({
            x: Math.random() * 500 + 100,
            y: Math.random() * 400 + 100,
            vx: 1 + Math.random(),
            vy: 0,
            limit: 100 + Math.random() * 200,
            start: 0, 
            angle: 0,
            sightLength: 150
        });
        guards[i].start = guards[i].x;
    }
}

function drawAgent(ctx, x, y) {
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x+10, y+10, 10, 0, Math.PI*2); ctx.fill();
    // Night Vision Goggles
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(x+5, y+5, 4, 4);
    ctx.fillRect(x+11, y+5, 4, 4);
}

function drawGuard(ctx, x, y, dx) {
    ctx.fillStyle = '#335577';
    ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI*2); ctx.fill();
    // Cap
    ctx.fillStyle = '#112244';
    ctx.beginPath(); ctx.arc(x, y, 12, Math.PI, 0); ctx.fill();
    // Flashlight handle
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, y+5); ctx.lineTo(x + (dx>0?15:-15), y+5); ctx.stroke();
}

engine.start(() => {
    level = 1; setupLevel(level);
}, (dt) => {
    let speed = 3;
    if (engine.keys['ArrowUp']) player.y -= speed;
    if (engine.keys['ArrowDown']) player.y += speed;
    if (engine.keys['ArrowLeft']) player.x -= speed;
    if (engine.keys['ArrowRight']) player.x += speed;
    player.x = Math.max(0, Math.min(780, player.x));
    player.y = Math.max(0, Math.min(580, player.y));
    if (player.x < goal.x + goal.w && player.x + 20 > goal.x && 
        player.y < goal.y + goal.h && player.y + 20 > goal.y) {
            level++;
            engine.score += 500;
            engine.spawnParticle(player.x, player.y, '#00ff00', 20);
            setupLevel(level);
    }
    guards.forEach(g => {
        g.x += g.vx;
        g.angle = g.vx > 0 ? 0 : Math.PI;
        if (Math.abs(g.x - g.start) > g.limit) g.vx *= -1;
        let dx = (player.x + 10) - g.x;
        let dy = (player.y + 10) - g.y;
        let dist = Math.hypot(dx, dy);
        let angleToPlayer = Math.atan2(dy, dx);
        let diff = angleToPlayer - g.angle;
        while (diff > Math.PI) diff -= Math.PI*2;
        while (diff < -Math.PI) diff += Math.PI*2;
        if (dist < g.sightLength && Math.abs(diff) < 0.5) { engine.addShake(10); engine.state = 'GAMEOVER'; }
    });
}, (ctx) => {
    // Floor Tiles
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for(let i=0; i<800; i+=50) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,600); ctx.stroke(); }
    for(let i=0; i<600; i+=50) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(800,i); ctx.stroke(); }

    // Goal
    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.fillRect(goal.x, goal.y, goal.w, goal.h);
    ctx.strokeStyle = '#00ff00';
    ctx.strokeRect(goal.x, goal.y, goal.w, goal.h);
    ctx.font = '10px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText("EXIT", goal.x+20, goal.y-5);

    drawAgent(ctx, player.x, player.y);
    guards.forEach(g => {
        // Cone
        let grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.sightLength);
        grad.addColorStop(0, 'rgba(255, 255, 0, 0.4)');
        grad.addColorStop(1, 'rgba(255, 255, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(g.x, g.y);
        ctx.arc(g.x, g.y, g.sightLength, g.angle - 0.5, g.angle + 0.5);
        ctx.fill();
        drawGuard(ctx, g.x, g.y, g.vx);
    });
});
