const engine = new Engine('gameCanvas');
engine.gameName = 'neon-drift';
engine.loadHighScore();

// Track Generation
let trackPoints = [];
let TRACK_RADIUS = 200;
let TRACK_WIDTH = 100;
let TRACK_COMPLEXITY = 12;
let level = 1;

function generateTrack() {
    trackPoints = [];
    TRACK_COMPLEXITY = 10 + level * 2;
    const radius = 180 + Math.random() * 40;
    for (let i = 0; i < TRACK_COMPLEXITY; i++) {
        const angle = (i / TRACK_COMPLEXITY) * Math.PI * 2;
        const variance = 40 + level * 10;
        const r = radius + (Math.random() - 0.5) * variance;
        trackPoints.push({
            x: 400 + Math.cos(angle) * r,
            y: 300 + Math.sin(angle) * r,
            angle: angle
        });
    }
}

function distToSegmentDetailed(p, v, w) {
    const l2 = Math.pow(v.x - w.x, 2) + Math.pow(v.y - w.y, 2);
    if (l2 === 0) return { distance: Math.hypot(p.x - v.x, p.y - v.y), point: v };
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const point = { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
    return { distance: Math.hypot(p.x - point.x, p.y - point.y), point: point };
}

function getTrackInfo(px, py) {
    let minSourceDist = Infinity;
    let closestPoint = null;
    for (let i = 0; i < trackPoints.length; i++) {
        const p1 = trackPoints[i];
        const p2 = trackPoints[(i + 1) % trackPoints.length];
        const distInfo = distToSegmentDetailed({x: px, y: py}, p1, p2);
        if (distInfo.distance < minSourceDist) {
            minSourceDist = distInfo.distance;
            closestPoint = distInfo.point;
        }
    }
    return { distance: minSourceDist, point: closestPoint };
}

let car = { x: 600, y: 300, angle: 0, speed: 0, wx: 0, wy: 0 };
let opponents = [];
let totalTime = 0;
let trail = [];
let lap = 0;
let checkpointsPassed = 0;
let onTrack = true;
const LAPS_TO_WIN = 3;

function spawnOpponents() {
    opponents = [];
    const count = Math.min(3, level);
    for (let i = 0; i < count; i++) {
        const p = trackPoints[0];
        opponents.push({
            x: p.x + (Math.random()-0.5)*20, 
            y: p.y + (Math.random()-0.5)*20, 
            angle: p.angle + Math.PI/2,
            speed: 3 + Math.random() * 2 + level * 0.5,
            targetIndex: 1,
            color: [Assets.COLORS.secondary, Assets.COLORS.tertiary, Assets.COLORS.accent][i % 3],
            name: ['X-FLARE', 'NEON-B', 'VOID-1'][i % 3]
        });
    }
}

engine.start(() => {
    generateTrack();
    car = { x: trackPoints[0].x, y: trackPoints[0].y, angle: trackPoints[0].angle + Math.PI/2, speed: 0, wx: 0, wy: 0 };
    totalTime = 0;
    trail = [];
    lap = 0;
    checkpointsPassed = 0;
    spawnOpponents();
}, (dt) => {
    const factor = dt / 16.67;
    
    // Player Input
    if (engine.keys['ArrowUp'] || engine.keys['KeyW']) {
        car.speed += 0.25 * factor;
        if (Math.random() > 0.8) engine.spawnSpark(car.x, car.y, Assets.COLORS.secondary);
    }
    if (engine.keys['ArrowDown'] || engine.keys['KeyS']) car.speed -= 0.15 * factor;
    
    const steeringSens = 0.08 * (0.4 + Math.min(Math.abs(car.speed), 8) / 10);
    if (engine.keys['ArrowLeft'] || engine.keys['KeyA']) car.angle -= steeringSens * factor;
    if (engine.keys['ArrowRight'] || engine.keys['KeyD']) car.angle += steeringSens * factor;
    
    car.speed *= Math.pow(0.97, factor);
    car.wx = Math.cos(car.angle) * car.speed;
    car.wy = Math.sin(car.angle) * car.speed;
    car.x += car.wx * factor;
    car.y += car.wy * factor;
    
    // Wall Bouncing Logic
    const trackInfo = getTrackInfo(car.x, car.y);
    onTrack = trackInfo.distance < TRACK_WIDTH / 2;
    
    if (!onTrack) {
        // Find normal from closest point
        const dx = car.x - trackInfo.point.x;
        const dy = car.y - trackInfo.point.y;
        const mag = Math.hypot(dx, dy);
        if (mag > 0) {
            const nx = dx / mag;
            const ny = dy / mag;
            
            // Push back to edge
            car.x = trackInfo.point.x + nx * (TRACK_WIDTH / 2);
            car.y = trackInfo.point.y + ny * (TRACK_WIDTH / 2);
            
            // Reflect velocity (simplified via angle)
            const normalAngle = Math.atan2(ny, nx);
            const moveAngle = Math.atan2(car.wy, car.wx);
            const reflectedAngle = 2 * normalAngle - moveAngle + Math.PI;
            
            car.angle = reflectedAngle;
            car.speed *= 0.6;
            
            engine.addShake(5);
            playSound('death');
            for(let i=0; i<5; i++) engine.spawnSpark(car.x, car.y, '#fff');
        }
    }
    
    // Opponents AI
    opponents.forEach(opp => {
        const target = trackPoints[opp.targetIndex];
        const angleToTarget = Math.atan2(target.y - opp.y, target.x - opp.x);
        
        // Simple smoothing for AI angle
        let diff = angleToTarget - opp.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        opp.angle += diff * 0.1 * factor;
        
        opp.x += Math.cos(opp.angle) * opp.speed * factor;
        opp.y += Math.sin(opp.angle) * opp.speed * factor;
        
        if (Math.hypot(opp.x - target.x, opp.y - target.y) < 50) {
            opp.targetIndex = (opp.targetIndex + 1) % trackPoints.length;
        }
    });
    
    // Lap Progress
    const nextCP = trackPoints[(checkpointsPassed + 1) % trackPoints.length];
    if (Math.hypot(car.x - nextCP.x, car.y - nextCP.y) < TRACK_WIDTH) {
        checkpointsPassed++;
        if (checkpointsPassed % trackPoints.length === 0) {
            lap++;
            engine.score = lap;
            playSound('levelup');
            if (lap >= LAPS_TO_WIN) {
                level++;
                engine.score += 100 * level;
                engine.start(() => {
                    generateTrack();
                    car = { x: trackPoints[0].x, y: trackPoints[0].y, angle: trackPoints[0].angle + Math.PI/2, speed: 0, wx: 0, wy: 0 };
                    trail = [];
                    lap = 0;
                    checkpointsPassed = 0;
                    spawnOpponents();
                }, (dt)=>{}, (ctx)=>{}); // Trigger reset
                return;
            }
        }
    }
    
    // Trail
    if (Math.abs(car.speed) > 2) {
        trail.push({ x: car.x, y: car.y, life: 1.0, angle: car.angle });
        if (trail.length > 100) trail.shift();
    }
    trail.forEach(t => t.life -= 0.01 * factor);
    trail = trail.filter(t => t.life > 0);
}, (ctx) => {
    // Background Grid
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1;
    for(let i=0; i<800; i+=40) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,600); ctx.stroke(); }
    for(let i=0; i<600; i+=40) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(800,i); ctx.stroke(); }

    // Draw Track Path
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.shadowBlur = 15; ctx.shadowColor = Assets.COLORS.primary;
    ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = TRACK_WIDTH;
    ctx.beginPath();
    ctx.moveTo(trackPoints[0].x, trackPoints[0].y);
    trackPoints.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.stroke();
    
    ctx.shadowBlur = 0;
    ctx.strokeStyle = Assets.COLORS.primary; ctx.lineWidth = 2;
    ctx.stroke();

    // Skid Marks
    trail.forEach(t => {
        ctx.fillStyle = `rgba(0, 255, 200, ${t.life * 0.3})`;
        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.rotate(t.angle);
        ctx.fillRect(-2, -8, 4, 16);
        ctx.restore();
    });

    // Draw Opponents
    opponents.forEach(opp => {
        ctx.save();
        ctx.translate(opp.x, opp.y);
        ctx.rotate(opp.angle);
        
        ctx.shadowBlur = 10; ctx.shadowColor = opp.color;
        ctx.fillStyle = opp.color;
        ctx.beginPath();
        ctx.moveTo(15, 0); ctx.lineTo(-10, -10); ctx.lineTo(-10, 10); ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#fff';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(opp.name, 0, -15);
        ctx.restore();
    });

    // Car
    Assets.renderPlayer(ctx, car.x - 15, car.y - 12, 30, 24, {
        rotation: car.angle,
        velocity: { x: car.wx, y: car.wy },
        state: Math.abs(car.speed) > 1 ? 'moving' : 'idle',
        grounded: onTrack
    });

    // HUD
    ctx.fillStyle = Assets.COLORS.PRIMARY;
    ctx.font = 'bold 16px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText(`LEVEL: ${level}`, 20, 50);
    ctx.fillText(`LAP: ${lap+1}/${LAPS_TO_WIN}`, 20, 75);
    ctx.fillText(`SPEED: ${Math.round(Math.abs(car.speed) * 20)} KM/H`, 20, 100);

    engine.drawUI(ctx);
});

