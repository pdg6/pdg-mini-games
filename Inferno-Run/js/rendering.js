// Background and Stars Rendering
let stars = [];

function initStars(canvasWidth, canvasHeight) {
    stars = [];
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * canvasWidth,
            y: Math.random() * canvasHeight,
            size: Math.random() * 2 + 0.5,
            brightness: Math.random()
        });
    }
}

function updateStars() {
    stars.forEach(s => {
        s.brightness += (Math.random() - 0.5) * 0.1;
        s.brightness = Math.max(0.3, Math.min(1, s.brightness));
    });
}

function drawBackground(ctx, canvasWidth, canvasHeight) {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    gradient.addColorStop(0, '#0a0015');
    gradient.addColorStop(0.5, '#150520');
    gradient.addColorStop(1, '#1a0a10');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw stars
    stars.forEach(s => {
        ctx.fillStyle = 'rgba(255, 255, 255, ' + (s.brightness * 0.8) + ')';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
    });
}
