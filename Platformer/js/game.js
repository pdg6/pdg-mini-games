const engine = new Engine('gameCanvas');
engine.gameName = 'neon-leap';
engine.loadHighScore();

class Terrain {
    constructor() {
        this.points = [];
        this.scroll = 0;
        this.segmentWidth = 80;
        this.lastY = 400;
        this.obstacles = [];
        this.beams = [];
        
        for(let i = 0; i < 15; i++) {
            this.generatePoint();
        }
    }

    generatePoint() {
        const dy = (Math.random() - 0.5) * 150; 
        this.lastY += dy;
        this.lastY = Math.max(200, Math.min(500, this.lastY));
        this.points.push(this.lastY);
    }

    update(speed, dt) {
        this.scroll += speed;
        
        this.obstacles.forEach(o => o.x -= speed);
        this.beams.forEach(b => b.x -= speed);
        this.obstacles = this.obstacles.filter(o => o.x > -100);
        this.beams = this.beams.filter(b => b.x > -100);

        if (this.scroll >= this.segmentWidth) {
            this.scroll -= this.segmentWidth;
            this.points.shift();
            this.generatePoint();
            
            if (Math.random() > 0.4) {
                this.obstacles.push({
                    x: 850,
                    y: this.points[this.points.length - 1],
                    w: 30, h: 60,
                    color: Assets.COLORS.secondary
                });
            }
            if (Math.random() > 0.7) {
                this.beams.push({
                    x: 880, y: Math.random() * 300 + 50,
                    w: 10, h: 40, color: Assets.COLORS.accent
                });
            }
        }
    }

    getY(x) {
        const index = Math.floor((x + this.scroll) / this.segmentWidth);
        const subX = (x + this.scroll) % this.segmentWidth;
        const p1 = this.points[index] || this.lastY;
        const p2 = this.points[index + 1] || p1;
        return p1 + (p2 - p1) * (subX / this.segmentWidth);
    }

    draw(ctx) {
        ctx.strokeStyle = Assets.COLORS.primary;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-20, this.points[0] - this.scroll);
        for(let i = 0; i < this.points.length; i++) {
            ctx.lineTo(i * this.segmentWidth - this.scroll, this.points[i]);
        }
        ctx.stroke();

        ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.lineTo(800, 600); ctx.lineTo(0, 600); ctx.closePath(); ctx.fill();

        this.obstacles.forEach(o => {
            ctx.fillStyle = o.color;
            ctx.fillRect(o.x - o.w/2, o.y - o.h, o.w, o.h);
            ctx.shadowBlur = 10; ctx.shadowColor = o.color;
            ctx.strokeStyle = '#fff'; ctx.strokeRect(o.x - o.w/2, o.y - o.h, o.w, o.h);
            ctx.shadowBlur = 0;
        });

        this.beams.forEach(b => {
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, b.y, b.w, b.h);
            ctx.shadowBlur = 15; ctx.shadowColor = b.color;
            ctx.fillRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
            ctx.shadowBlur = 0;
        });
    }
}

let terrain, player, speed, distance;

function resetGame() {
    terrain = new Terrain();
    player = { x: 100, y: 300, vy: 0, grounded: false, charRotation: 0 };
    speed = 5; distance = 0;
}

engine.start(() => { resetGame(); }, (dt) => {
    const factor = dt / 16.67;
    speed += 0.001 * factor;
    distance += speed * factor;
    engine.score = Math.floor(distance / 10);

    const groundY = terrain.getY(player.x);
    if (player.y >= groundY - 10) {
        player.y = groundY - 10;
        player.vy = 0; player.grounded = true;
        player.charRotation = 0;
    } else {
        player.vy += 0.6 * factor;
        player.grounded = false;
        player.charRotation += 0.1 * factor;
    }

    if (player.grounded && (engine.justPressed('Space') || engine.isDown('ArrowUp') || engine.isDown('KeyW'))) {
        player.vy = -12; player.grounded = false;
        playSound('jump');
        for(let i=0; i<5; i++) engine.spawnSpark(player.x, player.y, Assets.COLORS.primary);
    }

    player.y += player.vy * factor;
    terrain.update(speed, dt);

    terrain.obstacles.forEach(o => {
        if (Math.abs(player.x - o.x) < 25 && player.y > o.y - o.h) {
            engine.addShake(15); playSound('death');
            engine.state = 'GAMEOVER';
        }
    });

    terrain.beams.forEach(b => {
        if (player.x > b.x && player.x < b.x + b.w && player.y > b.y && player.y < b.y + b.h) {
            engine.addShake(15); playSound('death');
            engine.state = 'GAMEOVER';
        }
    });
    
    if (player.y > 650) { engine.state = 'GAMEOVER'; playSound('death'); }

}, (ctx) => {
    // Draw Background Parallax
    ctx.fillStyle = 'rgba(0, 255, 255, 0.05)';
    for(let i=0; i<5; i++) {
        const px = (-(distance * 0.2 + i * 200) % 1000) + 800;
        ctx.fillRect(px, 100, 50, 400);
    }

    terrain.draw(ctx);
    
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.charRotation);
    Assets.renderPlayer(ctx, 0, 0, 40, 40, { vx: speed, vy: player.vy });
    ctx.restore();

    engine.drawParticles(ctx);

    ctx.fillStyle = Assets.COLORS.PRIMARY;
    ctx.font = 'bold 16px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText(`DIST: ${Math.floor(distance)}m`, 20, 50);

    engine.drawUI(ctx);
});
