// Particle Systems
let particles = [];
let fireParticles = [];

function spawnParticle(x, y, type) {
    const count = type === 'death' ? 20 : type === 'coin' ? 8 : 3;
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            dx: (Math.random() - 0.5) * (type === 'death' ? 10 : 4),
            dy: (Math.random() - 0.5) * (type === 'death' ? 10 : 4) - 2,
            life: 1,
            decay: 0.02 + Math.random() * 0.02,
            size: type === 'death' ? 4 + Math.random() * 4 : 3 + Math.random() * 2,
            color: type === 'death' ? '#ff4400' : type === 'coin' ? '#ffcc00' : '#00ffcc'
        });
    }
}

function updateFireParticles(fires) {
    fires.forEach(f => {
        if (Math.random() < 0.4) {
            fireParticles.push({
                x: f.x + Math.random() * f.width,
                y: f.y,
                dy: -1 - Math.random() * 2,
                dx: (Math.random() - 0.5) * 0.5,
                life: 1,
                size: 3 + Math.random() * 5
            });
        }
    });
    
    for (let i = fireParticles.length - 1; i >= 0; i--) {
        const p = fireParticles[i];
        p.y += p.dy; p.x += p.dx;
        p.life -= 0.03; p.size *= 0.97;
        if (p.life <= 0) fireParticles.splice(i, 1);
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.dx; p.y += p.dy;
        p.dy += 0.2; p.life -= p.decay;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function drawParticles(ctx) {
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    });
    ctx.globalAlpha = 1;
}

function drawFireParticles(ctx) {
    fireParticles.forEach(p => {
        ctx.fillStyle = 'rgba(255, ' + (100 + p.life * 100) + ', 0, ' + p.life + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

function clearParticles() {
    particles = [];
    fireParticles = [];
}
