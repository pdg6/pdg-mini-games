// Game Entities: Platforms, Fires, Coins, Goal
let platforms = [];
let movingPlatforms = [];
let fires = [];
let coins = [];
let goal = {};

function loadLevelEntities(levelNum) {
    const level = levels[(levelNum - 1) % levels.length];
    platforms = JSON.parse(JSON.stringify(level.platforms));
    movingPlatforms = JSON.parse(JSON.stringify(level.movingPlatforms));
    fires = JSON.parse(JSON.stringify(level.fires));
    coins = level.coins.map(c => ({ ...c, collected: false, bobOffset: Math.random() * Math.PI * 2 }));
    goal = { ...level.goal };
    return level.playerStart;
}

function updateMovingPlatforms() {
    movingPlatforms.forEach(p => {
        p.x += p.speed * p.direction;
        if (p.x >= p.endX) p.direction = -1;
        else if (p.x <= p.startX) p.direction = 1;
    });
}

function getAllPlatforms() {
    return [...platforms, ...movingPlatforms];
}

// Drawing functions for entities
function drawPlatforms(ctx) {
    [...platforms, ...movingPlatforms].forEach(p => {
        ctx.shadowColor = '#666';
        ctx.shadowBlur = 5;
        
        const gradient = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.height);
        gradient.addColorStop(0, '#555');
        gradient.addColorStop(1, '#333');
        ctx.fillStyle = gradient;
        ctx.fillRect(p.x, p.y, p.width, p.height);
        
        // Highlight
        ctx.fillStyle = '#777';
        ctx.fillRect(p.x, p.y, p.width, 3);
        
        // Brick pattern
        ctx.fillStyle = '#444';
        for (let i = 0; i < p.width; i += 16) {
            ctx.fillRect(p.x + i, p.y + 6, 8, 4);
        }
        ctx.shadowBlur = 0;
    });
}

function drawFires(ctx) {
    fires.forEach(f => {
        ctx.shadowColor = '#ff4400';
        ctx.shadowBlur = 20;
        
        const time = performance.now() * 0.005;
        
        for (let i = 0; i < 3; i++) {
            const offset = Math.sin(time + i) * 3;
            const height = f.height + 10 + Math.sin(time * 2 + i) * 5;
            
            ctx.fillStyle = i === 0 ? '#ff2200' : i === 1 ? '#ff6600' : '#ffcc00';
            ctx.beginPath();
            ctx.moveTo(f.x, f.y + f.height);
            
            for (let x = 0; x <= f.width; x += 8) {
                const flameHeight = height - Math.sin(time * 3 + x * 0.1) * 8;
                ctx.lineTo(f.x + x + offset, f.y + f.height - flameHeight + i * 8);
            }
            
            ctx.lineTo(f.x + f.width, f.y + f.height);
            ctx.closePath();
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    });
}

function drawCoins(ctx) {
    const time = performance.now() * 0.003;
    
    coins.forEach(c => {
        if (c.collected) return;
        
        const bob = Math.sin(time + c.bobOffset) * 3;
        const scale = 0.8 + Math.sin(time * 2 + c.bobOffset) * 0.2;
        
        ctx.shadowColor = '#ffcc00';
        ctx.shadowBlur = 10;
        
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.ellipse(c.x + 10, c.y + 10 + bob, 10 * scale, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Shine
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(c.x + 7, c.y + 7 + bob, 3, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
    });
}

function drawGoal(ctx) {
    const time = performance.now() * 0.003;
    
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 15 + Math.sin(time) * 5;
    
    const gradient = ctx.createLinearGradient(goal.x, goal.y, goal.x, goal.y + goal.height);
    gradient.addColorStop(0, '#00ff00');
    gradient.addColorStop(1, '#009900');
    ctx.fillStyle = gradient;
    ctx.fillRect(goal.x, goal.y, goal.width, goal.height);
    
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#000';
    ctx.font = 'bold 10px "Press Start 2P", monospace';
    ctx.fillText('EXIT', goal.x + 5, goal.y + 35);
    
    // Animated arrow
    ctx.fillStyle = '#fff';
    const arrowOffset = Math.sin(time * 3) * 3;
    ctx.font = '14px monospace';
    ctx.fillText('\u2191', goal.x + 18, goal.y + 20 + arrowOffset);
}
