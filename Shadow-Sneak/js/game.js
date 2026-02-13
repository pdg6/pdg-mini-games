const engine = new Engine('gameCanvas');
engine.gameName = 'shadow-sneak';
engine.loadHighScore();

const player = new Entity(50, 50, 20, 20, Assets.COLORS.PRIMARY);
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
            waitTimer: 0,
            patrolAxis: Math.random() > 0.3 ? 'x' : 'y'
        };
        g.start = g.patrolAxis === 'x' ? g.x : g.y;
        if (g.patrolAxis === 'y') { g.vy = g.vx; g.vx = 0; }
        guards.push(g);
    }
}

function lineIntersectsWall(x1, y1, x2, y2) {
    for (const w of walls) {
        if (lineIntersectsRect(x1, y1, x2, y2, w.x, w.y, w.w, w.h)) return true;
    }
    return false;
}

function lineIntersectsRect(x1, y1, x2, y2, rx, ry, rw, rh) {
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
    Assets.renderPlayer(ctx, x, y, 20, 20, {
        state: alertLevel > 0 ? 'moving' : 'idle'
    });
}

function drawGuard(ctx, x, y, dx, alerted) {
    ctx.fillStyle = alerted ? '#884444' : '#335577';
    ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = alerted ? '#662222' : '#112244';
    ctx.beginPath(); ctx.arc(x, y, 12, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, y+5); ctx.lineTo(x + (dx>0?15:-15), y+5); ctx.stroke();
    if (alerted) {
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('!', x, y - 18);
    }
}

function normalizeAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
}

engine.start(() => {
    level = 1; setupLevel(level);
}, (dt) => {
    const factor = dt / 16.67;
    let speed = 3 * factor;
    const isSneaking = engine.keys['ShiftLeft'] || engine.keys['ShiftRight'];
    if (isSneaking) speed = 1.5 * factor;
    
    let newX = player.x, newY = player.y;
    if (engine.keys['ArrowUp'] || engine.keys['KeyW']) newY -= speed;
    if (engine.keys['ArrowDown'] || engine.keys['KeyS']) newY += speed;
    if (engine.keys['ArrowLeft'] || engine.keys['KeyA']) newX -= speed;
    if (engine.keys['ArrowRight'] || engine.keys['KeyD']) newX += speed;
    
    if (!playerInWall(newX, player.y)) player.x = newX;
    if (!playerInWall(player.x, newY)) player.y = newY;
    
    player.x = Math.max(0, Math.min(780, player.x));
    player.y = Math.max(0, Math.min(580, player.y));
    
    if (player.x < goal.x + goal.w && player.x + 20 > goal.x && 
        player.y < goal.y + goal.h && player.y + 20 > goal.y) {
            level++;
            engine.score += 500;
            playSound('levelup');
            engine.spawnSpark(player.x, player.y, '#00ff00');
            setupLevel(level);
    }
    
    alertLevel = Math.max(0, alertLevel - 0.005 * factor);
    
    guards.forEach(g => {
        g.angle = g.patrolAxis === 'x' ? (g.vx > 0 ? 0 : Math.PI) : (g.vy > 0 ? Math.PI/2 : -Math.PI/2);
        
        const dx = (player.x + 10) - g.x;
        const dy = (player.y + 10) - g.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist < g.sightLength) {
            const angleToPlayer = Math.atan2(dy, dx);
            const angleDiff = normalizeAngle(angleToPlayer - g.angle);
            if (Math.abs(angleDiff) < Math.PI/4) {
                if (!lineIntersectsWall(g.x, g.y, player.x + 10, player.y + 10)) {
                    g.alerted = true;
                    g.alertTimer = 1000;
                    const alertGain = (1.2 - dist/g.sightLength) * (isSneaking ? 0.05 : 0.2);
                    alertLevel = Math.min(1.0, alertLevel + alertGain * factor);
                    if (alertLevel >= 1.0) {
                        engine.addShake(20);
                        playSound('death');
                        engine.state = 'GAMEOVER';
                    }
                }
            }
        }

        if (g.alertTimer > 0) {
            g.alertTimer -= dt;
            if (g.alertTimer <= 0) g.alerted = false;
        }

        if (g.waitTimer > 0) {
            g.waitTimer -= dt;
        } else {
            if (g.patrolAxis === 'x') {
                g.x += g.vx * factor;
                if (Math.abs(g.x - g.start) > g.limit) {
                    g.vx *= -1; g.waitTimer = 1000;
                }
            } else {
                g.y += g.vy * factor;
                if (Math.abs(g.y - g.start) > g.limit) {
                    g.vy *= -1; g.waitTimer = 1000;
                }
            }
        }
    });
}, (ctx) => {
    ctx.strokeStyle = '#050a15';
    for(let i=0; i<800; i+=40) {
        ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,600); ctx.stroke();
    }
    for(let i=0; i<600; i+=40) {
        ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(800,i); ctx.stroke();
    }

    walls.forEach(w => {
        ctx.fillStyle = '#111';
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 1;
        ctx.strokeRect(w.x, w.y, w.w, w.h);
    });

    ctx.shadowBlur = 10; ctx.shadowColor = '#ffff00';
    ctx.fillStyle = '#ffff0033'; ctx.fillRect(goal.x, goal.y, goal.w, goal.h);
    ctx.strokeStyle = '#ffff00'; ctx.lineWidth = 2; ctx.strokeRect(goal.x, goal.y, goal.w, goal.h);
    ctx.shadowBlur = 0;

    guards.forEach(g => {
        ctx.fillStyle = g.alerted ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 150, 255, 0.1)';
        ctx.beginPath();
        ctx.moveTo(g.x, g.y);
        ctx.arc(g.x, g.y, g.sightLength, g.angle - Math.PI/4, g.angle + Math.PI/4);
        ctx.closePath();
        ctx.fill();
        drawGuard(ctx, g.x, g.y, g.vx || g.vy, g.alerted);
    });

    drawAgent(ctx, player.x, player.y);

    ctx.fillStyle = '#333'; ctx.fillRect(300, 20, 200, 10);
    ctx.fillStyle = alertLevel > 0.7 ? '#ff0000' : '#ffff00';
    ctx.fillRect(300, 20, 200 * alertLevel, 10);
    ctx.strokeStyle = '#fff'; ctx.strokeRect(300, 20, 200, 10);

    ctx.fillStyle = Assets.COLORS.PRIMARY;
    ctx.font = 'bold 12px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText('ALERT LEVEL', 355, 45);
    ctx.fillText('LEVEL ' + level, 20, 50);

    engine.drawUI(ctx);
});
