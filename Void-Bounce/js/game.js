const engine = new Engine('gameCanvas');
engine.gameName = 'void-bounce';
engine.loadHighScore();

const paddle = new Entity(350, 550, 100, 15, '#fff');
let ball = { x: 400, y: 300, vx: 4, vy: -4, radius: 8 };
let bricks = [];
let level = 1;
let lives = 3;
let combo = 0;
let ballTrail = [];

function createBricks(lvl) {
    bricks = [];
    const rows = Math.min(4 + lvl, 8);
    const cols = 8;
    for(let r = 0; r < rows; r++) {
        for(let c = 0; c < cols; c++) {
            let hp = 1;
            // Higher rows are tougher in later levels
            if (lvl > 1 && r < 2) hp = 2;
            if (lvl > 3 && r === 0) hp = 3;
            
            bricks.push({
                x: 80 + c * 80,
                y: 40 + r * 28,
                w: 70, h: 20,
                active: true,
                hp: hp,
                maxHp: hp,
                color: `hsl(${(r * 40 + c * 15) % 360}, 100%, 50%)`
            });
        }
    }
}

function getHpColor(brick) {
    if (brick.hp === 3) return '#ff4444';
    if (brick.hp === 2) return '#ffaa44';
    return brick.color;
}

function resetBall() {
    ball = { 
        x: paddle.x + paddle.width/2, 
        y: paddle.y - 15, 
        vx: 4 * (Math.random() > 0.5 ? 1 : -1), 
        vy: -4, 
        radius: 8 
    };
    combo = 0;
    ballTrail = [];
}

engine.start(() => {
    paddle.x = 350;
    level = 1;
    lives = 3;
    combo = 0;
    ballTrail = [];
    createBricks(level);
    resetBall();
}, (dt) => {
    const factor = dt / 16.67;
    
    if (engine.keys['ArrowLeft'] || engine.keys['KeyA']) paddle.x -= 8 * factor;
    if (engine.keys['ArrowRight'] || engine.keys['KeyD']) paddle.x += 8 * factor;
    paddle.x = Math.max(0, Math.min(700, paddle.x));
    
    ball.x += ball.vx * factor; 
    ball.y += ball.vy * factor;
    
    // Ball trail
    ballTrail.push({ x: ball.x, y: ball.y, life: 1 });
    if (ballTrail.length > 15) ballTrail.shift();
    ballTrail.forEach(t => t.life -= 0.07);
    
    // Wall bounces
    if (ball.x - ball.radius < 0) { ball.x = ball.radius; ball.vx = Math.abs(ball.vx); engine.spawnParticle(ball.x, ball.y, '#fff', 3); }
    if (ball.x + ball.radius > 800) { ball.x = 800 - ball.radius; ball.vx = -Math.abs(ball.vx); engine.spawnParticle(ball.x, ball.y, '#fff', 3); }
    if (ball.y - ball.radius < 0) { ball.y = ball.radius; ball.vy = Math.abs(ball.vy); engine.spawnParticle(ball.x, ball.y, '#fff', 3); }
    
    // Ball lost
    if (ball.y > 610) { 
        lives--;
        combo = 0;
        if (lives <= 0) {
            engine.addShake(20); 
            engine.state = 'GAMEOVER'; 
        } else {
            engine.addShake(8);
            resetBall();
        }
    }
    
    // Paddle collision
    if (ball.vy > 0 && ball.y + ball.radius >= paddle.y && ball.y + ball.radius <= paddle.y + paddle.height + 5 &&
        ball.x >= paddle.x && ball.x <= paddle.x + paddle.width) {
        ball.vy = -Math.abs(ball.vy);
        ball.y = paddle.y - ball.radius - 1;
        let hitPoint = (ball.x - (paddle.x + paddle.width/2)) / (paddle.width/2);
        ball.vx = hitPoint * 7;
        // Ensure minimum vertical speed
        if (Math.abs(ball.vy) < 3) ball.vy = ball.vy > 0 ? 3 : -3;
        engine.spawnParticle(ball.x, ball.y, '#00ffff', 5);
    }
    
    // Brick collision with proper side detection
    bricks.forEach(b => {
        if (!b.active) return;
        
        // Find closest point on brick to ball center
        let closestX = Math.max(b.x, Math.min(ball.x, b.x + b.w));
        let closestY = Math.max(b.y, Math.min(ball.y, b.y + b.h));
        let distX = ball.x - closestX;
        let distY = ball.y - closestY;
        let dist = Math.hypot(distX, distY);
        
        if (dist < ball.radius) {
            b.hp--;
            if (b.hp <= 0) {
                b.active = false;
                combo++;
                engine.score += 100 * Math.min(combo, 10);
                engine.spawnParticle(ball.x, ball.y, b.color, 8);
            } else {
                engine.spawnParticle(ball.x, ball.y, '#fff', 2);
            }
            engine.addShake(2);
            
            // Proper reflection direction
            if (Math.abs(distX) > Math.abs(distY)) {
                ball.vx *= -1;
            } else {
                ball.vy *= -1;
            }
        }
    });
    
    // Level complete
    if (bricks.every(b => !b.active)) {
        level++;
        engine.score += 500 * level;
        engine.spawnParticle(400, 300, '#ffcc00', 30);
        createBricks(level);
        resetBall();
    }
    
    // Speed cap
    const maxSpeed = 8 + level * 0.5;
    const currentSpeed = Math.hypot(ball.vx, ball.vy);
    if (currentSpeed > maxSpeed) {
        ball.vx = (ball.vx / currentSpeed) * maxSpeed;
        ball.vy = (ball.vy / currentSpeed) * maxSpeed;
    }
}, (ctx) => {
    // Ball trail
    ballTrail.forEach(t => {
        if (t.life > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${t.life * 0.3})`;
            ctx.beginPath();
            ctx.arc(t.x, t.y, ball.radius * t.life, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Paddle - Rounded with glow
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ffff';
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 8);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Ball - Glowing orb
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#fff';
    ctx.fillStyle = '#fff';
    ctx.beginPath(); 
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2); 
    ctx.fill();
    ctx.shadowBlur = 0;

    // Bricks - Beveled with HP colors
    bricks.forEach(b => {
        if (b.active) {
            ctx.fillStyle = getHpColor(b);
            ctx.fillRect(b.x, b.y, b.w, b.h);
            
            // Shininess
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.moveTo(b.x, b.y + b.h);
            ctx.lineTo(b.x, b.y);
            ctx.lineTo(b.x + b.w, b.y);
            ctx.closePath();
            ctx.fill();
            
            // Border
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.strokeRect(b.x, b.y, b.w, b.h);
        }
    });
    
    // Lives display
    ctx.font = '10px "Press Start 2P"';
    ctx.fillStyle = '#ff4444';
    ctx.textAlign = 'left';
    ctx.fillText('\u2665'.repeat(lives), 10, 590);
    
    // Level & combo
    ctx.fillStyle = '#555';
    ctx.fillText('LV.' + level, 10, 25);
    if (combo > 2) {
        ctx.fillStyle = `hsl(${combo * 30}, 100%, 70%)`;
        ctx.fillText('x' + combo, 700, 590);
    }
});
