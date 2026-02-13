const engine = new Engine('gameCanvas');
engine.gameName = 'neon-drift';
engine.loadHighScore();

// Procedural Track Generation
let trackPoints = [];
const TRACK_RADIUS = 200;
const TRACK_WIDTH = 100;
const TRACK_COMPLEXITY = 12;

function generateTrack() {
    trackPoints = [];
    for (let i = 0; i < TRACK_COMPLEXITY; i++) {
        const angle = (i / TRACK_COMPLEXITY) * Math.PI * 2;
        const variance = 50 + Math.random() * 100;
        const r = TRACK_RADIUS + (Math.random() - 0.5) * variance;
        trackPoints.push({
            x: 400 + Math.cos(angle) * r,
            y: 300 + Math.sin(angle) * r,
            angle: angle
        });
    }
}

function isPointOnTrack(px, py) {
    let minSourceDist = Infinity;
    for (let i = 0; i < trackPoints.length; i++) {
        const p1 = trackPoints[i];
        const p2 = trackPoints[(i + 1) % trackPoints.length];
        
        // Distance to segment
        const d = distToSegment({x: px, y: py}, p1, p2);
        minSourceDist = Math.min(minSourceDist, d);
    }
    return minSourceDist < TRACK_WIDTH / 2;
}

function distToSegment(p, v, w) {
    const l2 = Math.pow(v.x - w.x, 2) + Math.pow(v.y - w.y, 2);
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

let car = { x: 600, y: 300, angle: 0, speed: 0, wx: 0, wy: 0 };
let totalTime = 0;
let trail = [];
let lap = 0;
let lapTimes = [];
let bestLap = Infinity;
let checkpointsPassed = 0;
let onTrack = true;

engine.start(() => {
    generateTrack();
    // Start at first point
    car = { x: trackPoints[0].x, y: trackPoints[0].y, angle: trackPoints[0].angle + Math.PI/2, speed: 0, wx: 0, wy: 0 };
    totalTime = 0;
    trail = [];
    lap = 0;
    lapTimes = [];
    bestLap = parseFloat(localStorage.getItem('neonDrift_bestLap')) || Infinity;
    checkpointsPassed = 0;
}, (dt) => {
    const factor = dt / 16.67;
    
    // Input
    if (engine.keys['ArrowUp'] || engine.keys['KeyW']) {
        car.speed += 0.25 * factor;
        if (Math.random() > 0.8) engine.spawnSpark(car.x, car.y, Assets.COLORS.secondary);
    }
    if (engine.keys['ArrowDown'] || engine.keys['KeyS']) car.speed -= 0.15 * factor;
    
    // Steering based on speed
    const steeringSens = 0.08 * (0.4 + Math.min(Math.abs(car.speed), 8) / 10);
    if (engine.keys['ArrowLeft'] || engine.keys['KeyA']) car.angle -= steeringSens * factor;
    if (engine.keys['ArrowRight'] || engine.keys['KeyD']) car.angle += steeringSens * factor;
    
    // Drift physics (simplified)
    car.speed *= Math.pow(0.97, factor);
    
    car.wx = Math.cos(car.angle) * car.speed;
    car.wy = Math.sin(car.angle) * car.speed;
    car.x += car.wx * factor;
    car.y += car.wy * factor;
    
    // Track Bounds
    onTrack = isPointOnTrack(car.x, car.y);
    
    if (!onTrack) {
        car.speed *= Math.pow(0.85, factor);
        if (Math.abs(car.speed) > 1.5) {
            engine.addShake(3);
            if(Math.random() > 0.3) engine.spawnSpark(car.x, car.y, '#666');
            if (car.speed > 1 && Math.random() > 0.9) playSound('death'); 
        }
    }
    
    // Lap Progress
    const nextCP = trackPoints[(checkpointsPassed + 1) % trackPoints.length];
    const distToCP = Math.hypot(car.x - nextCP.x, car.y - nextCP.y);
    if (distToCP < TRACK_WIDTH) {
        checkpointsPassed++;
        if (checkpointsPassed % trackPoints.length === 0) {
            lap++;
            engine.score = lap;
            playSound('levelup');
            for(let i=0; i<15; i++) engine.spawnSpark(car.x, car.y, Assets.COLORS.accent);
        }
    }
    
    // Trail
    if (Math.abs(car.speed) > 2) {
        trail.push({ x: car.x, y: car.y, life: 1.0, angle: car.angle });
        if (trail.length > 150) trail.shift();
    }
    trail.forEach(t => t.life -= 0.005);
    trail = trail.filter(t => t.life > 0);
    
    totalTime += dt;
}, (ctx) => {
    // Background Grid
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1;
    for(let i=0; i<800; i+=40) {
        ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,600); ctx.stroke();
    }
    for(let i=0; i<600; i+=40) {
        ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(800,i); ctx.stroke();
    }

    // Draw Track Path
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    
    // Outer Glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = Assets.COLORS.primary;
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = TRACK_WIDTH;
    ctx.beginPath();
    ctx.moveTo(trackPoints[0].x, trackPoints[0].y);
    trackPoints.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Inner Lines
    ctx.strokeStyle = Assets.COLORS.primary;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Road markers
    ctx.setLineDash([20, 20]);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.stroke();
    ctx.setLineDash([]);

    // Skid Marks
    trail.forEach(t => {
        ctx.fillStyle = `rgba(0, 255, 200, ${t.life * 0.2})`;
        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.rotate(t.angle);
        ctx.fillRect(-2, -8, 4, 16);
        ctx.restore();
    });

    // Checkpoint target
    const target = trackPoints[(checkpointsPassed + 1) % trackPoints.length];
    ctx.fillStyle = Assets.COLORS.accent;
    ctx.beginPath();
    ctx.arc(target.x, target.y, 10, 0, Math.PI*2);
    ctx.fill();

    // Car
    Assets.renderPlayer(ctx, car.x - 15, car.y - 12, 30, 24, {
        rotation: car.angle,
        velocity: { x: car.wx, y: car.wy },
        state: Math.abs(car.speed) > 1 ? 'moving' : 'idle',
        grounded: onTrack
    });

    // Particles
    engine.drawParticles(ctx);

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Courier New';
    ctx.fillText(`LAP: ${lap}`, 20, 30);
    ctx.fillText(`SPEED: ${Math.round(car.speed * 20)} KM/H`, 20, 50);
});
