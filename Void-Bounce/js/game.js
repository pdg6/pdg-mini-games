const engine = new Engine('gameCanvas');
engine.gameName = 'void-bounce';
engine.loadHighScore();

const paddle = new Entity(350, 550, 100, 15, Assets.COLORS.primary);
let ball = { x: 400, y: 300, vx: 4, vy: -4, radius: 8 };
let bricks = [];
let level = 1;
let lives = 3;
let combo = 0;
let ballTrail = [];
let powerups = [];
const POWERUP_TYPES = ['WIDE', 'MULTI', 'SLOW'];

function createBricks(lvl) {
    bricks = [];
    const rows = Math.min(4 + lvl, 8);
    const cols = 8;
    for(let r = 0; r < rows; r++) {
        for(let c = 0; c < cols; c++) {
            let hp = 1;
            if (lvl > 1 && r < 2) hp = 2;
            if (lvl > 3 && r === 0) hp = 3;
            bricks.push({
                x: 80 + c * 80, y: 40 + r * 28, w: 70, h: 20,
                active: true, hp: hp, maxHp: hp,
                color: `hsl(${(r * 40 + c * 15) % 360}, 100%, 50%)`
            });
        }
    }
}

function spawnPowerup(x, y) {
    if (Math.random() > 0.8) {
        const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
        powerups.push({ x, y, type, vy: 2, radius: 10, active: true });
    }
}

function resetBall() {
    ball = { 
        x: paddle.x + paddle.width/2, y: paddle.y - 15, 
        vx: 4 * (Math.random() > 0.5 ? 1 : -1), vy: -4, radius: 8 
    };
    combo = 0; ballTrail = []; paddle.width = 100;
}

engine.start(() => {
    paddle.x = 350; level = 1; lives = 3; combo = 0;
    ballTrail = []; powerups = []; createBricks(level); resetBall();
}, (dt) => {
    const factor = dt / 16.67;
    if (engine.isDown('ArrowLeft') || engine.isDown('KeyA')) paddle.x -= 10 * factor;
    if (engine.isDown('ArrowRight') || engine.isDown('KeyD')) paddle.x += 10 * factor;
    paddle.x = Math.max(0, Math.min(800 - paddle.width, paddle.x));
    
    ball.x += ball.vx * factor; ball.y += ball.vy * factor;
    ballTrail.push({ x: ball.x, y: ball.y, life: 1 });
    if (ballTrail.length > 20) ballTrail.shift();
    ballTrail.forEach(t => t.life -= 0.05);
    
    if (ball.x - ball.radius < 0) { ball.vx = Math.abs(ball.vx); playSound('coin'); }
    if (ball.x + ball.radius > 800) { ball.vx = -Math.abs(ball.vx); playSound('coin'); }
    if (ball.y - ball.radius < 0) { ball.vy = Math.abs(ball.vy); playSound('coin'); }
    
    if (ball.y > 610) { 
        lives--; combo = 0; playSound('death');
        if (lives <= 0) { engine.addShake(20); engine.state = 'GAMEOVER'; } 
        else { engine.addShake(8); resetBall(); }
    }
    
    if (ball.vy > 0 && ball.y + ball.radius >= paddle.y && ball.y + ball.radius <= paddle.y + paddle.height + 10 &&
        ball.x >= paddle.x && ball.x <= paddle.x + paddle.width) {
        ball.vy = -Math.abs(ball.vy); ball.y = paddle.y - ball.radius - 1;
        let hitPoint = (ball.x - (paddle.x + paddle.width/2)) / (paddle.width/2);
        ball.vx = hitPoint * (5 + level);
        playSound('jump'); engine.addShake(2);
        for(let i=0; i<8; i++) engine.spawnSpark(ball.x, ball.y, Assets.COLORS.secondary);
    }
    
    bricks.forEach(b => {
        if (!b.active) return;
        let cX = Math.max(b.x, Math.min(ball.x, b.x + b.w));
        let cY = Math.max(b.y, Math.min(ball.y, b.y + b.h));
        if (Math.hypot(ball.x - cX, ball.y - cY) < ball.radius) {
            b.hp--;
            if (b.hp <= 0) {
                b.active = false; combo++; engine.score += 100 * Math.min(combo, 10);
                playSound('coin'); spawnPowerup(b.x + b.w/2, b.y + b.h/2);
            } else playSound('shoot');
            if (Math.abs(ball.x - cX) > Math.abs(ball.y - cY)) ball.vx *= -1; else ball.vy *= -1;
            engine.addShake(2);
        }
    });

    powerups.forEach(p => {
        p.y += p.vy * factor;
        if (p.x > paddle.x && p.x < paddle.x + paddle.width && p.y > paddle.y && p.y < paddle.y + paddle.height) {
            p.active = false; playSound('levelup');
            if (p.type === 'WIDE') paddle.width = 160;
            if (p.type === 'MULTI') engine.score += 500;
            if (p.type === 'SLOW') { ball.vx *= 0.7; ball.vy *= 0.7; }
        }
    });
    powerups = powerups.filter(p => p.y < 620 && p.active !== false);
    
    if (bricks.length > 0 && bricks.every(b => !b.active)) {
        level++; engine.score += 1000; playSound('levelup');
        createBricks(level); resetBall();
    }
}, (ctx) => {
    bricks.forEach(b => {
        if (!b.active) return;
        ctx.fillStyle = b.hp > 1 ? '#444' : b.color; ctx.shadowBlur = 5; ctx.shadowColor = b.color;
        ctx.fillRect(b.x, b.y, b.w, b.h); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(b.x, b.y, b.w, b.h);
    });
    ctx.shadowBlur = 0;
    powerups.forEach(p => {
        ctx.fillStyle = Assets.COLORS.accent; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center'; ctx.fillText(p.type[0], p.x, p.y+4);
    });
    ballTrail.forEach(t => {
        ctx.fillStyle = `rgba(0, 255, 255, ${Math.max(0, t.life) * 0.4})`;
        ctx.beginPath(); ctx.arc(t.x, t.y, Math.max(0, ball.radius * t.life), 0, Math.PI*2); ctx.fill();
    });
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = Assets.COLORS.primary; ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.strokeStyle = '#fff'; ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
    engine.drawParticles(ctx);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Courier New';
    ctx.fillText(`SCORE: ${engine.score}`, 20, 30);
    ctx.fillText(`LIVES: ${'♥'.repeat(lives)}`, 20, 55);
});
