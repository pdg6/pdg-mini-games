const Assets = {
    // Unified Color Palette (Neon Retro)
    COLORS: {
        PRIMARY: '#00ffcc',    // Cyan-ish (default player)
        SECONDARY: '#ff0055',  // Magenta (default enemy)
        TERTIARY: '#00ffff',   // Electric Blue (effects)
        HIGHLIGHT: '#ffcc00',  // Gold (powerups/scores)
        DANGER: '#ff4400',     // Orange-Red (hazards)
        VOID: '#050505',       // Deep Black (background)
        NEUTRAL: '#ffffff',    // White (high contrast)
        STEALTH: '#222222',    // Dark Gray (walls/shadows)

        // Lowercase aliases (used by multiple games)
        primary: '#00ffcc',
        secondary: '#ff0055',
        tertiary: '#00ffff',
        highlight: '#ffcc00',
        danger: '#ff4400',
        accent: '#ffcc00',     // Accent color (alias for highlight)
        neutral: '#ffffff'
    },

    // Global Constants
    PHYSICS: {
        GRAVITY: 0.6,
        FRICTION: 0.98,
        TERMINAL_VELOCITY: 15
    },

    // UI Styles
    FONTS: {
        DEFAULT: '"Press Start 2P", cursive',
        MONO: 'monospace'
    },

    // Centralized Player Rendering
    renderPlayer(ctx, x, y, width, height, options = {}) {
        const { 
            rotation = 0, 
            opacity = 1, 
            state = 'idle', 
            velocity = { x: 0, y: 0 },
            grounded = true 
        } = options;
        
        ctx.save();
        
        // --- CUSTOM ANIMATION LOGIC: Squish and Stretch ---
        let scaleX = 1;
        let scaleY = 1;
        const time = Date.now() / 1000;
        
        if (!grounded) {
            // Stretch when in air based on vertical velocity
            const stretch = Math.min(Math.abs(velocity.y) * 0.02, 0.3);
            scaleY = 1 + stretch;
            scaleX = 1 - stretch;
        } else if (state === 'moving') {
            // Subtle "breathing" / bobbing when moving
            scaleY = 1 + Math.sin(time * 15) * 0.05;
            scaleX = 1 - Math.sin(time * 15) * 0.05;
        } else {
            // Idle pulse
            scaleY = 1 + Math.sin(time * 4) * 0.02;
        }

        ctx.translate(x + width/2, y + height/2);
        ctx.rotate(rotation);
        ctx.scale(scaleX, scaleY);
        ctx.globalAlpha = opacity;

        // --- CYBERPUNK AESTHETIC ---
        
        // Outer Glow (Neon Aura)
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.COLORS.PRIMARY;
        
        // Layered Body (Metal Shell)
        ctx.fillStyle = this.COLORS.STEALTH;
        ctx.beginPath();
        ctx.roundRect(-width/2, -height/2, width, height, 4);
        ctx.fill();
        
        // Neon Trim
        ctx.strokeStyle = this.COLORS.PRIMARY;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Animated Cyber-Visor (Glitch Effect)
        ctx.shadowBlur = 0;
        const glitch = Math.random() > 0.95 ? (Math.random() - 0.5) * 4 : 0;
        
        ctx.fillStyle = '#000';
        ctx.fillRect(-width/2 + 3 + glitch, -height/4, width - 6, height/3);
        
        // Visor Data Line
        ctx.fillStyle = this.COLORS.TERTIARY;
        const scanPos = (time * 50) % (width - 10);
        ctx.fillRect(-width/2 + 5 + scanPos, -height/4 + 2, 2, height/3 - 4);
        
        // Side Power Cells
        ctx.fillStyle = state === 'moving' ? this.COLORS.HIGHLIGHT : this.COLORS.PRIMARY;
        ctx.fillRect(-width/2 - 2, -height/4, 2, height/2);
        ctx.fillRect(width/2, -height/4, 2, height/2);

        // Under-glow for Engines
        if (!grounded || state === 'moving') {
            const flicker = Math.random() * 5;
            ctx.shadowBlur = 10 + flicker;
            ctx.shadowColor = this.COLORS.HIGHLIGHT;
            ctx.fillStyle = this.COLORS.HIGHLIGHT;
            ctx.beginPath();
            ctx.arc(0, height/2, 4 + flicker, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
};

// Make it available to the engine if desired, or just global
if (typeof window !== 'undefined') {
    window.Assets = Assets;
}
