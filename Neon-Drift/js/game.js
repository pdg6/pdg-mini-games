const engine = new Engine('gameCanvas');
engine.gameName = 'neon-drift';
engine.loadHighScore();

let car = { x: 600, y: 300, angle: 0, speed: 0, wx: 0, wy: 0 };
let totalTime = 0;
let trail = [];
let lap = 0;
let lapTimes = [];
let bestLap = Infinity;
let lastCheckAngle = 0;
let checkpointsPassed = 0;
const CHECKPOINTS = 4;
let onTrack = true;

function getCarTrackAngle() {
    return Math.atan2(car.y - 300, car.x - 400);
}

function normalizeAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
}

engine.start(() => {
    car = { x: 600, y: 300, angle: 0, speed: 0, wx: 0, wy: 0 };
    totalTime = 0;
    trail = [];
    lap = 0;
    lapTimes = [];
    bestLap = parseFloat(localStorage.getItem('neonDrift_bestLap')) || Infinity;
    lastCheckAngle = getCarTrackAngle();
    checkpointsPassed = 0;
}, (dt) => {
    const factor = dt / 16.67;
    
    if (engine.keys['ArrowUp'] || engine.keys['KeyW']) car.speed += 0.2 * factor;
    if (engine.keys['ArrowDown'] || engine.keys['KeyS']) car.speed -= 0.1 * factor;
    if (engine.keys['ArrowLeft'] || engine.keys['KeyA']) car.angle -= 0.07 * factor * (0.5 + Math.min(Math.abs(car.speed), 5) / 10);
    if (engine.keys['ArrowRight'] || engine.keys['KeyD']) car.angle += 0.07 * factor * (0.5 + Math.min(Math.abs(car.speed), 5) / 10);
    
    // Drag (exponential per-frame → use dt)
    car.speed *= Math.pow(0.96, factor);
    
    car.wx = Math.cos(car.angle) * car.speed;
    car.wy = Math.sin(car.angle) * car.speed;
    car.x += car.wx * factor;
    car.y += car.wy * factor;
    
    let dist = Math.hypot(car.x - 400, car.y - 300);
    onTrack = dist >= 150 && dist <= 250;
    
    if (!onTrack) {
        car.speed *= Math.pow(0.8, factor);
        if (Math.abs(car.speed) > 1) {
            engine.addShake(2);
            if(Math.random() > 0.5) engine.spawnParticle(car.x, car.y, '#555', 1);
        }
    }
    
    // Boost trail
    if (Math.abs(car.speed) > 5) {
        engine.spawnParticle(car.x - car.wx*2, car.y - car.wy*2, '#ffaa00', 1);
    }
    
    // Skid marks trail
    if (Math.abs(car.speed) > 2) {
        trail.push({ x: car.x, y: car.y, life: 1.0 });
        if (trail.length > 200) trail.shift();
    }
    trail.forEach(t => t.life -= 0.003);
    trail = trail.filter(t => t.life > 0);
    
    // Lap detection via checkpoint system
    const curAngle = getCarTrackAngle();
    const angleDiff = normalizeAngle(curAngle - lastCheckAngle);
    
    // Clockwise lap (positive angle progression)
    if (angleDiff > Math.PI / CHECKPOINTS * 0.8) {
        checkpointsPassed++;
        lastCheckAngle = curAngle;
    } else if (angleDiff < -Math.PI / CHECKPOINTS * 0.8) {
        checkpointsPassed = Math.max(0, checkpointsPassed - 1);
        lastCheckAngle = curAngle;
    }
    
    if (checkpointsPassed >= CHECKPOINTS * 2) {
        // Completed a lap!
        lap++;
        const lapTime = totalTime - (lapTimes.reduce((a,b) => a+b, 0));
        lapTimes.push(lapTime);
        if (lapTime < bestLap) {
            bestLap = lapTime;
            localStorage.setItem('neonDrift_bestLap', bestLap);
            engine.spawnParticle(car.x, car.y, '#ffcc00', 20);
        }
        engine.spawnParticle(car.x, car.y, '#00ffcc', 10);
        engine.score = lap;
        checkpointsPassed = 0;
        lastCheckAngle = curAngle;
    }
    
    totalTime += dt;
}, (ctx) => {
    // Skid marks
    trail.forEach(t => {
        ctx.fillStyle = `rgba(80, 80, 80, ${t.life * 0.3})`;
        ctx.fillRect(t.x - 2, t.y - 2, 4, 4);
    });

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

    // Checkpoint markers
    for (let i = 0; i < CHECKPOINTS * 2; i++) {
        const a = (i / (CHECKPOINTS * 2)) * Math.PI * 2;
        const x1 = 400 + Math.cos(a) * 150;
        const y1 = 300 + Math.sin(a) * 150;
        const x2 = 400 + Math.cos(a) * 250;
        const y2 = 300 + Math.sin(a) * 250;
        ctx.strokeStyle = i < checkpointsPassed ? '#00ff88' : '#333';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }

    // Start Line
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(650, 300); ctx.lineTo(550, 300); ctx.stroke();

    // Car - Detailed
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);
    
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(-15, -10, 35, 25);

    // Body
    ctx.fillStyle = onTrack ? '#ffcc00' : '#ff6600';
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

    // HUD
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.fillText(`LAP: ${lap}`, 10, 25);
    ctx.fillText(`TIME: ${(totalTime / 1000).toFixed(1)}s`, 10, 45);
    ctx.fillStyle = '#ffcc00';
    if (bestLap < Infinity) {
        ctx.fillText(`BEST: ${(bestLap / 1000).toFixed(2)}s`, 10, 65);
    }
    // Speed bar
    const spdPct = Math.min(Math.abs(car.speed) / 12, 1);
    ctx.fillStyle = '#333';
    ctx.fillRect(10, 570, 100, 10);
    ctx.fillStyle = spdPct > 0.8 ? '#ff4400' : '#00ffcc';
    ctx.fillRect(10, 570, 100 * spdPct, 10);
});
