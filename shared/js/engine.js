class Engine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.lastTime = 0;
        this.keys = {};
        this.keysPressed = {};
        
        // Game Loop State
        this.state = 'MENU'; // MENU, PLAY, GAMEOVER
        this.score = 0;
        this.highScore = 0;
        
        // Systems
        this.shake = 0;
        this.particles = [];
        this.gameName = '';

        window.addEventListener('keydown', e => {
            this.keys[e.code] = true;
            // Prevent scrolling
            if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
        });
        window.addEventListener('keyup', e => {
            this.keys[e.code] = false;
            this.keysPressed[e.code] = false;
        });

        // Mouse/Touch
        this.mouse = { x: 0, y: 0, down: false };
        this.canvas.addEventListener('mousemove', e => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        this.canvas.addEventListener('mousedown', () => this.mouse.down = true);
        this.canvas.addEventListener('mouseup', () => this.mouse.down = false);
    }

    // Check if key is currently held
    isDown(code) { return this.keys[code]; }

    // Check if key was just pressed (one-shot). Automatically consumes the press.
    justPressed(code) {
        if (this.keys[code] && !this.keysPressed[code]) {
            this.keysPressed[code] = true;
            return true;
        }
        return false;
    }

    // Load high score for current game from localStorage
    loadHighScore() {
        const key = 'highScore_' + (this.gameName || 'default');
        this.highScore = parseInt(localStorage.getItem(key)) || 0;
    }

    // Save high score
    saveHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            const key = 'highScore_' + (this.gameName || 'default');
            localStorage.setItem(key, this.highScore);
        }
    }

    start(setup, update, draw) {
        setup();
        
        const loop = (timeStamp) => {
            const dt = Math.min((timeStamp - this.lastTime), 50); // Cap dt
            this.lastTime = timeStamp;

            this.updateScreenShake(dt);
            
            // Global State Management
            if (this.state === 'MENU') {
                if (this.keys['Space'] || this.mouse.down) {
                    this.state = 'PLAY';
                    this.score = 0;
                    this.particles = [];
                    setup(); // Reset game
                    this.keys['Space'] = false; // Prevent instant jump
                }
            } else if (this.state === 'GAMEOVER') {
                this.saveHighScore();
                if (this.keys['Space'] || this.mouse.down) {
                    this.state = 'MENU';
                    this.keys['Space'] = false;
                }
            } else {
                update(dt);
            }

            // Update Particles
            this.updateParticles(dt);

            // Drawing
            this.ctx.clearRect(0, 0, this.width, this.height);
            this.ctx.save();
            
            // Apply Shake
            if (this.shake > 0) {
                const dx = (Math.random() - 0.5) * this.shake;
                const dy = (Math.random() - 0.5) * this.shake;
                this.ctx.translate(dx, dy);
            }

            draw(this.ctx);
            // Draw Particles
            this.drawParticles(this.ctx);
            
            this.ctx.restore();

            // UI Overlay
            this.drawUI(this.ctx);

            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    addShake(amount) {
        this.shake = amount;
    }

    updateScreenShake(dt) {
        if (this.shake > 0) {
            this.shake -= dt * 0.5;
            if (this.shake < 0) this.shake = 0;
        }
    }

    spawnParticle(x, y, color, count = 5, speed = 2) {
        for(let i=0; i<count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const vel = Math.random() * speed;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * vel,
                vy: Math.sin(angle) * vel,
                life: 1.0,
                color,
                size: Math.random() * 3 + 1
            });
        }
    }

    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    drawParticles(ctx) {
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        ctx.globalAlpha = 1.0;
    }

    drawUI(ctx) {
        ctx.textAlign = 'center';
        ctx.font = '16px "Press Start 2P"';
        
        if (this.state === 'MENU') {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, 0, this.width, this.height);
            ctx.fillStyle = '#fff';
            ctx.fillText("PRESS SPACE TO START", this.width/2, this.height/2);
            ctx.font = '10px "Press Start 2P"';
            ctx.fillStyle = '#888';
            ctx.fillText("Arrow Keys to Move", this.width/2, this.height/2 + 30);
            if (this.highScore > 0) {
                ctx.fillStyle = '#ffcc00';
                ctx.fillText("BEST: " + this.highScore, this.width/2, this.height/2 + 55);
            }
        } else if (this.state === 'GAMEOVER') {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, 0, this.width, this.height);
            ctx.fillStyle = '#ff0044';
            ctx.fillText("GAME OVER", this.width/2, this.height/2 - 30);
            ctx.fillStyle = '#fff';
            ctx.fillText("SCORE: " + this.score, this.width/2, this.height/2 + 10);
            if (this.highScore > 0) {
                ctx.font = '12px "Press Start 2P"';
                ctx.fillStyle = '#ffcc00';
                ctx.fillText("BEST: " + this.highScore, this.width/2, this.height/2 + 35);
            }
            ctx.font = '10px "Press Start 2P"';
            ctx.fillStyle = '#888';
            ctx.fillText("Press Space to Retry", this.width/2, this.height/2 + 60);
        } else {
            // HUD
            ctx.textAlign = 'right';
            ctx.fillStyle = '#fff';
            ctx.font = '12px "Press Start 2P"';
            ctx.fillText(this.score, this.width - 20, 30);
        }
    }
}

class Entity {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.vx = 0;
        this.vy = 0;
        this.dead = false;
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update(dt) {
        this.x += this.vx;
        this.y += this.vy;
    }

    collidesWith(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }
}
