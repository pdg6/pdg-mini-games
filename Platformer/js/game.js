const engine = new Engine('gameCanvas');
engine.gameName = 'alpine-rush';
engine.loadHighScore();

class Terrain {
    constructor() {
        this.points = [];
        this.scroll = 0;
        this.segmentWidth = 50;
        this.lastY = 300;
        this.obstacles = [];
        this.clouds = [];
        this.spawnTimer = 0;
        
        // Initial terrain
        for(let i = 0; i < 20; i++) {
            this.generatePoint();
        }
    }

    generatePoint() {
        // Bias towards going down (skiing!)
        const dy = (Math.random() - 0.35) * 60; 
        this.lastY += dy;
        this.lastY = Math.max(150, Math.min(550, this.lastY));
        this.points.push(this.lastY);
    }

    update(speed, dt) {
        this.scroll += speed;
        
        // Background clouds
        if (Math.random() > 0.98) {
            this.clouds.push({
                x: 850,
                y: Math.random() * 200,
                s: 0.5 + Math.random(),
                w: 60 + Math.random() * 40
            });
        }
        this.clouds.forEach(c => c.x -= speed * 0.3);
        this.clouds = this.clouds.filter(c => c.x > -150);

        // Move obstacles with terrain
        this.obstacles.forEach(o => o.x -= speed);
        this.obstacles = this.obstacles.filter(o => o.x > -100);

        if (this.scroll >= this.segmentWidth) {
            this.scroll -= this.segmentWidth;
            this.points.shift();
            this.generatePoint();
            
            // Try spawn obstacle at the new point (far right)
            this.spawnTimer++;
            if (this.spawnTimer > 3 && Math.random() > 0.6) {
                const type = Math.random() > 0.5 ? 'tree' : 'rock';
                this.obstacles.push({
                    x: 850,
                    y: this.points[this.points.length - 1],
                    type: type,
                    w: type === 'tree' ? 30 : 40,
                    h: type === 'tree' ? 50 : 30
                });
                this.spawnTimer = 0;
            }
        }
    }

    getY(x) {
        const index = Math.floor((x + this.scroll) / this.segmentWidth);
        const nextIndex = index + 1;
        const subX = (x + this.scroll) % this.segmentWidth;
        
        const p1 = this.points[index] || this.lastY;
        const p2 = this.points[nextIndex] || this.lastY;
        
        return p1 + (p2 - p1) * (subX / this.segmentWidth);
    }

    draw(ctx) {
        // Clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.clouds.forEach(c => {
            ctx.beginPath();
            ctx.ellipse(c.x, c.y, c.w/2, 20, 0, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw snow ground
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(0, 600);
        for(let i = 0; i < this.points.length; i++) {
            ctx.lineTo(i * this.segmentWidth - this.scroll, this.points[i]);
        }
        ctx.lineTo(1000, 600);
        ctx.lineTo(0, 600);
        ctx.closePath();
        ctx.fill();

        // Terrain outline
        ctx.strokeStyle = '#d0efff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw obstacles
        this.obstacles.forEach(o => {
            if (o.type === 'tree') {
                ctx.fillStyle = '#2d5a27';
                ctx.beginPath();
                ctx.moveTo(o.x, o.y);
                ctx.lineTo(o.x - 15, o.y + 10);
                ctx.lineTo(o.x + 15, o.y + 10);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(o.x, o.y - 15);
                ctx.lineTo(o.x - 20, o.y + 5);
                ctx.lineTo(o.x + 20, o.y + 5);
                ctx.fill();
                ctx.fillStyle = '#4a2d1d';
                ctx.fillRect(o.x - 4, o.y + 10, 8, 10);
            } else {
                ctx.fillStyle = '#888';
                ctx.beginPath();
                ctx.arc(o.x, o.y, 15, 0, Math.PI, true);
                ctx.fill();
            }
        });
    }
}

class Player extends Entity {
    constructor() {
        super(150, 200, 24, 32, '#ff4400');
        this.vy = 0;
        this.grounded = false;
        this.rotation = 0;
        this.jumpForce = -12;
        this.gravity = 0.6;
        this.maxFall = 15;
    }

    update(dt, terrain) {
        const factor = dt / 16.67;
        
        // Gravity
        this.vy += this.gravity * factor;
        if (this.vy > this.maxFall) this.vy = this.maxFall;
        
        this.y += this.vy * factor;

        const groundY = terrain.getY(this.x + this.width / 2);
        
        if (this.y + this.height > groundY) {
            // Check if we hit ground hard at bad angle
            if (this.vy > 12 && Math.abs(this.rotation) > 1) {
                this.dead = true;
            }

            this.y = groundY - this.height;
            this.vy = 0;
            this.grounded = true;
            
            // Calculate slope angle
            const nextY = terrain.getY(this.x + this.width / 2 + 10);
            const targetRotation = Math.atan2(nextY - groundY, 10);
            this.rotation += (targetRotation - this.rotation) * 0.3 * factor;
            
            // Particle effect
            if (Math.random() > 0.7) {
                engine.spawnParticle(this.x, this.y + this.height, '#fff', 1, 1);
            }
        } else {
            this.grounded = false;
            // Air rotation (flips!)
            if (engine.keys['ArrowLeft'] || engine.keys['KeyA']) this.rotation -= 0.15 * factor;
            if (engine.keys['ArrowRight'] || engine.keys['KeyD']) this.rotation += 0.15 * factor;
        }

        // Jump
        if (this.grounded && (engine.justPressed('Space') || engine.justPressed('ArrowUp') || engine.justPressed('KeyW'))) {
            this.vy = this.jumpForce;
            this.grounded = false;
            engine.spawnParticle(this.x, this.y + this.height, '#fff', 8, 2);
        }
        
        // Collision with obstacles
        terrain.obstacles.forEach(o => {
            const dx = (this.x + this.width/2) - o.x;
            const dy = (this.y + this.height/2) - o.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 25) {
                this.dead = true;
            }
        });
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        
        // Skis
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-20, 16);
        ctx.lineTo(20, 16);
        ctx.stroke();
        
        // Body (Jacket)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(-12, -16, 24, 28, 5);
        ctx.fill();
        
        // Helmet
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(0, -14, 10, 0, Math.PI*2);
        ctx.fill();
        
        // Goggles
        ctx.fillStyle = '#000';
        ctx.fillRect(2, -16, 8, 4);
        
        ctx.restore();
    }
}

let player;
let terrain;
let gameSpeed = 5;
let distance = 0;

engine.start(() => {
    player = new Player();
    terrain = new Terrain();
    gameSpeed = 5;
    distance = 0;
}, (dt) => {
    const factor = dt / 16.67;
    
    // Increase speed over time
    gameSpeed += 0.001 * factor;
    distance += gameSpeed * factor;
    engine.score = Math.floor(distance / 10);
    
    terrain.update(gameSpeed * factor, dt);
    player.update(dt, terrain);
    
    if (player.dead) {
        engine.addShake(15);
        engine.spawnParticle(player.x, player.y, '#ff4400', 20, 5);
        engine.state = 'GAMEOVER';
    }
}, (ctx) => {
    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, 600);
    sky.addColorStop(0, '#87ceeb');
    sky.addColorStop(1, '#e0faff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 800, 600);
    
    terrain.draw(ctx);
    player.draw(ctx);
    
    // Controls help
    if (engine.score < 50) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.font = '10px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('SPACE to Jump | ARROWS to Flip', 400, 100);
    }
});