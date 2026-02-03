const engine = new Engine('gameCanvas');
const paddle = new Entity(350, 550, 100, 15, '#fff');
let ball = { x: 400, y: 300, vx: 4, vy: -4, radius: 8 };
let bricks = [];

engine.start(() => {
    paddle.x = 350;
    ball = { x: 400, y: 400, vx: 4 * (Math.random() > 0.5 ? 1 : -1), vy: -4, radius: 8 };
    bricks = [];
    for(let r=0; r<5; r++) {
        for(let c=0; c<8; c++) {
            bricks.push({
                x: 80 + c * 80,
                y: 50 + r * 30,
                w: 70, h: 20,
                active: true,
                color: hsl(, 100%, 50%)
            });
        }
    }
}, (dt) => {
    if (engine.keys['ArrowLeft'] && paddle.x > 0) paddle.x -= 8;
    if (engine.keys['ArrowRight'] && paddle.x < 700) paddle.x += 8;
    ball.x += ball.vx; ball.y += ball.vy;
    
    if (ball.x < 0 || ball.x > 800) { ball.vx *= -1; engine.spawnParticle(ball.x, ball.y, '#fff', 3); }
    if (ball.y < 0) { ball.vy *= -1; engine.spawnParticle(ball.x, ball.y, '#fff', 3); }
    if (ball.y > 600) { engine.addShake(20); engine.state = 'GAMEOVER'; }
    if (ball.vy > 0 && ball.y + ball.radius >= paddle.y && ball.x >= paddle.x && ball.x <= paddle.x + paddle.width) {
        ball.vy = -Math.abs(ball.vy);
        ball.y = paddle.y - ball.radius - 1;
        let hitPoint = (ball.x - (paddle.x + paddle.width/2)) / (paddle.width/2);
        ball.vx = hitPoint * 8;
        engine.spawnParticle(ball.x, ball.y, '#fff', 5);
    }
    bricks.forEach(b => {
        if (!b.active) return;
        if (ball.x > b.x && ball.x < b.x + b.w && ball.y > b.y && ball.y < b.y + b.h) {
            b.active = false;
            ball.vy *= -1;
            engine.score += 100;
            engine.spawnParticle(ball.x, ball.y, b.color, 8);
            engine.addShake(2);
        }
    });
    if (bricks.every(b => !b.active)) engine.start(null, null, null);
}, (ctx) => {
    // Paddle - Rounded with glow
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ffff';
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 8);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Ball - Glowing orb
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#fff';
    ctx.fillStyle = '#fff';
    ctx.beginPath(); 
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2); 
    ctx.fill();
    ctx.shadowBlur = 0;

    // Bricks - Beveled
    bricks.forEach(b => {
        if (b.active) {
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, b.y, b.w, b.h);
            
            // Shininess
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.moveTo(b.x, b.y + b.h);
            ctx.lineTo(b.x, b.y);
            ctx.lineTo(b.x + b.w, b.y);
            ctx.closePath();
            ctx.fill();
        }
    });
});
