const engine = new Engine('gameCanvas');
let car = { x: 400, y: 300, angle: 0, speed: 0, wx: 0, wy: 0 };
let track = [];
let totalTime = 0;

engine.start(() => {
    car = { x: 400, y: 300, angle: 0, speed: 0, wx: 0, wy: 0 };
    totalTime = 0;
}, (dt) => {
    if (engine.keys['ArrowUp']) car.speed += 0.2;
    if (engine.keys['ArrowDown']) car.speed -= 0.1;
    if (engine.keys['ArrowLeft']) car.angle -= 0.07;
    if (engine.keys['ArrowRight']) car.angle += 0.07;
    car.speed *= 0.96;
    car.wx = Math.cos(car.angle) * car.speed;
    car.wy = Math.sin(car.angle) * car.speed;
    car.x += car.wx;
    car.y += car.wy;
    let dist = Math.hypot(car.x - 400, car.y - 300);
    if (dist < 150 || dist > 250) {
        car.speed *= 0.8;
        if (car.speed > 1) {
            engine.addShake(2);
            if(Math.random()>0.5) engine.spawnParticle(car.x, car.y, '#555', 1);
        }
    }
    if (car.speed > 8) engine.spawnParticle(car.x - car.wx*2, car.y - car.wy*2, '#ffaa00', 1);
    totalTime += dt;
    engine.score = (totalTime / 1000).toFixed(2);
}, (ctx) => {
    // Track - Neon Borders
    ctx.lineWidth = 100;
    ctx.beginPath(); ctx.arc(400, 300, 200, 0, Math.PI*2); 
    ctx.strokeStyle = '#222'; ctx.stroke();
    
    // Bounds Glow
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ffcc';
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(400, 300, 150, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(400, 300, 250, 0, Math.PI*2); ctx.stroke();
    ctx.shadowBlur = 0;

    // Start Line
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(650, 300); ctx.lineTo(550, 300); ctx.stroke();

    // Car - Detailed
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);
    
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(-15, -10, 35, 25);

    // Body
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.moveTo(15, -10);
    ctx.lineTo(15, 10);
    ctx.lineTo(-15, 10);
    ctx.lineTo(-15, -10);
    ctx.fill();
    
    // Roof
    ctx.fillStyle = '#333';
    ctx.fillRect(-5, -8, 10, 16);
    
    // Headlights
    ctx.fillStyle = '#ffffaa';
    ctx.shadowBlur = 5; ctx.shadowColor = '#ffffaa';
    ctx.fillRect(14, -8, 2, 4);
    ctx.fillRect(14, 4, 2, 4);
    ctx.shadowBlur = 0;

    // Taillights
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(-15, -8, 2, 4);
    ctx.fillRect(-15, 4, 2, 4);

    ctx.restore();
});
