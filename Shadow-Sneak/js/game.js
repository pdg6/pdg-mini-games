const engine = new Engine('gameCanvas');
engine.gameName = 'shadow-sneak';
engine.loadHighScore();

const player = new Entity(50, 50, 20, 20, '#fff');
let guards = [];
let walls = [];
let goal = { x: 700, y: 500, w: 40, h: 40};
let level = 1;
let alertLevel = 0; // 0 = undetected, grows when near sight cones

function setupLevel(lvl) {
    player.x = 50; player.y = 50;
    guards = [];
    walls = [];
    alertLevel = 0;
    
    // Generate walls for cover
    const wallCount = Math.min(lvl + 3, 12);
    for(let i = 0; i < wallCount; i++) {
        let w, h;
        if (Math.random() > 0.5) {
            w = 80 + Math.random() * 60; h = 20;
        } else {
            w = 20; h = 80 + Math.random() * 60;
        }
        walls.push({
            x: 100 + Math.random() * 550,
            y: 80 + Math.random() * 400,
            w, h
        });
    }
    
    // Make sure goal area is clear
    walls = walls.filter(w => 
        !(w.x < goal.x + goal.w + 30 && w.x + w.w > goal.x - 30 && 
          w.y < goal.y + goal.h + 30 && w.y + w.h > goal.y - 30) &&
        !(w.x < 80 && w.y < 80) // don't block spawn
    );
    
    for(let i = 0; i < lvl + 2; i++) {
        let g = {
            x: Math.random() * 500 + 100,
            y: Math.random() * 400 + 100,
            vx: 1 + Math.random(),
            vy: 0,
            limit: 100 + Math.random() * 200,
            start: 0, 
            angle: 0,
            sightLength: 120 + lvl * 10,
            alerted: false,
            alertTimer: 0,
            patrolAxis: Math.random() > 0.3 ? 'x' : 'y'
        };
        g.start = g.patrolAxis === 'x' ? g.x : g.y;
        if (g.patrolAxis === 'y') { g.vy = g.vx; g.vx = 0; }
        guards.push(g);
    }
}

function lineIntersectsWall(x1, y1, x2, y2) {
    for (const w of walls) {
        // Check if line from guard to player intersects any wall
        if (lineIntersectsRect(x1, y1, x2, y2, w.x, w.y, w.w, w.h)) return true;
    }
    return false;
}

function lineIntersectsRect(x1, y1, x2, y2, rx, ry, rw, rh) {
    // Check line against 4 edges of rectangle
    return lineIntersectsLine(x1,y1,x2,y2, rx,ry, rx+rw,ry) ||
           lineIntersectsLine(x1,y1,x2,y2, rx+rw,ry, rx+rw,ry+rh) ||
           lineIntersectsLine(x1,y1,x2,y2, rx,ry+rh, rx+rw,ry+rh) ||
           lineIntersectsLine(x1,y1,x2,y2, rx,ry, rx,ry+rh);
}

function lineIntersectsLine(x1,y1,x2,y2, x3,y3,x4,y4) {
    const den = (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4);
    if (Math.abs(den) < 0.001) return false;
    const t = ((x1-x3)*(y3-y4) - (y1-y3)*(x3-x4)) / den;
    const u = -((x1-x2)*(y1-y3) - (y1-y2)*(x1-x3)) / den;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

function playerInWall(px, py) {
    for (const w of walls) {
        if (px < w.x + w.w && px + 20 > w.x && py < w.y + w.h && py + 20 > w.y) return true;
    }
    return false;
}

function drawAgent(ctx, x, y) {
    ctx.fillStyle = '#111';
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = alertLevel > 0 ? 0 : 6;
    ctx.beginPath(); ctx.arc(x+10, y+10, 10, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    // Night Vision Goggles
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(x+5, y+5, 4, 4);
    ctx.fillRect(x+11, y+5, 4, 4);
}

function drawGuard(ctx, x, y, dx, alerted) {
    ctx.fillStyle = alerted ? '#884444' : '#335577';
    ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = alerted ? '#662222' : '#112244';
    ctx.beginPath(); ctx.arc(x, y, 12, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, y+5); ctx.lineTo(x + (dx>0?15:-15), y+5); ctx.stroke();
    // Alert exclamation
    if (alerted) {
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('!', x, y - 18);
    }
}

engine.start(() => {
    level = 1; setupLevel(level);
}, (dt) => {
    const factor = dt / 16.67;
    let speed = 3 * factor;
    // Sneak (slower but smaller detection)
    if (engine.keys['ShiftLeft'] || engine.keys['ShiftRight']) speed = 1.5 * factor;
    
    let newX = player.x, newY = player.y;
    if (engine.keys['ArrowUp'] || engine.keys['KeyW']) newY -= speed;
    if (engine.keys['ArrowDown'] || engine.keys['KeyS']) newY += speed;
    if (engine.keys['ArrowLeft'] || engine.keys['KeyA']) newX -= speed;
    if (engine.keys['ArrowRight'] || engine.keys['KeyD']) newX += speed;
    
    // Wall collision
    if (!playerInWall(newX, player.y)) player.x = newX;
    if (!playerInWall(player.x, newY)) player.y = newY;
    
    player.x = Math.max(0, Math.min(780, player.x));
    player.y = Math.max(0, Math.min(580, player.y));
    
    // Goal check
    if (player.x < goal.x + goal.w && player.x + 20 > goal.x && 
        player.y < goal.y + goal.h && player.y + 20 > goal.y) {
            level++;
            engine.score += 500 + Math.floor((1 - alertLevel) * 200);
            engine.spawnParticle(player.x, player.y, '#00ff00', 20);
            setupLevel(level);
    }
    
    // Alert decay
    alertLevel = Math.max(0, alertLevel - 0.005 * factor);
    
    guards.forEach(g => {
        // Patrol movement
        if (g.patrolAxis === 'x') {
            g.x += g.vx * factor;
            g.angle = g.vx > 0 ? 0 : Math.PI;
            if (Math.abs(g.x - g.start) > g.limit) g.vx *= -1;
        } else {
            g.y += g.vy * factor;
            g.angle = g.vy > 0 ? Math.PI/2 : -Math.PI/2;
            if (Math.abs(g.y - g.start) > g.limit) g.vy *= -1;
        }
        
        let dx = (player.x + 10) - g.x;
        let dy = (player.y + 10) - g.y;
        let dist = Math.hypot(dx, dy);
        let angleToPlayer = Math.atan2(dy, dx);
        let diff = angleToPlayer - g.angle;
        while (diff > Math.PI) diff -= Math.PI*2;
        while (diff < -Math.PI) diff += Math.PI*2;
        
        const isSneaking = engine.keys['ShiftLeft'] || engine.keys['ShiftRight'];
        const effectiveSight = isSneaking ? g.sightLength * 0.6 : g.sightLength;
        
        // Line of sight blocked by walls?
        const blocked = lineIntersectsWall(g.x, g.y, player.x + 10, player.y + 10);
        
        if (dist < effectiveSight && Math.abs(diff) < 0.5 && !blocked) {
            alertLevel = Math.min(1, alertLevel + 0.03 * factor);
            g.alerted = true;
            g.alertTimer = 500;
            if (alertLevel >= 1) {
                engine.addShake(10);
                engine.state = 'GAMEOVER';
            }
        } else {
            if (g.alertTimer > 0) g.alertTimer -= dt;
            else g.alerted = false;
        }
    });
}, (ctx) => {
    // Floor Tiles
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, 800, 600);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for(let i=0; i<800; i+=50) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,600); ctx.stroke(); }
    for(let i=0; i<600; i+=50) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(800,i); ctx.stroke(); }

    // Walls
    walls.forEach(w => {
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.fillStyle = '#3a3a4a';
        ctx.fillRect(w.x, w.y, w.w, 3);
        ctx.strokeStyle = '#444';
        ctx.strokeRect(w.x, w.y, w.w, w.h);
    });

    // Goal
    ctx.fillStyle = 'rgba(0, 255, 0, 0.15)';
    ctx.fillRect(goal.x, goal.y, goal.w, goal.h);
    ctx.strokeStyle = '#00ff00';
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = -engine.lastTime / 10;
    ctx.strokeRect(goal.x, goal.y, goal.w, goal.h);
    ctx.setLineDash([]);
    ctx.font = '10px monospace';
    ctx.fillStyle = '#00ff00';
    ctx.textAlign = 'center';
    ctx.fillText("EXIT", goal.x + goal.w/2, goal.y - 5);

    drawAgent(ctx, player.x, player.y);
    guards.forEach(g => {
        // Cone
        let coneColor = g.alerted ? 'rgba(255, 80, 0,' : 'rgba(255, 255, 0,';
        let grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.sightLength);
        grad.addColorStop(0, coneColor + '0.4)');
        grad.addColorStop(1, coneColor + '0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(g.x, g.y);
        ctx.arc(g.x, g.y, g.sightLength, g.angle - 0.5, g.angle + 0.5);
        ctx.fill();
        drawGuard(ctx, g.x, g.y, g.vx || g.vy, g.alerted);
    });
    
    // Alert bar
    if (alertLevel > 0) {
        ctx.fillStyle = '#333';
        ctx.fillRect(300, 10, 200, 12);
        ctx.fillStyle = alertLevel > 0.7 ? '#ff0000' : alertLevel > 0.4 ? '#ffaa00' : '#ffff00';
        ctx.fillRect(300, 10, 200 * alertLevel, 12);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(300, 10, 200, 12);
        ctx.font = '8px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText('ALERT', 400, 20);
    }
    
    // Level indicator
    ctx.font = '8px "Press Start 2P"';
    ctx.fillStyle = '#555';
    ctx.textAlign = 'left';
    ctx.fillText('FLOOR ' + level, 10, 590);
    
    // Sneak indicator
    if (engine.keys['ShiftLeft'] || engine.keys['ShiftRight']) {
        ctx.fillStyle = '#00ff00';
        ctx.fillText('SNEAKING', 10, 20);
    }
});
