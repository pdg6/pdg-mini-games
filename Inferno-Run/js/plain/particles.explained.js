// ============================================================
// PARTICLES.JS — Visual Effects That Make the Game Feel Alive
// ============================================================
// Particles are tiny shapes that move, shrink, and fade away.
// They provide visual FEEDBACK: explosions on death, sparkles on
// coin pickup, flickering flames on fire hazards.
// They have ZERO effect on gameplay — purely cosmetic "juice".
// This file demonstrates arrays, loops, randomness, and optimization.
// ============================================================


// --- STATE ---

// Two separate particle arrays because they render differently.
// "let" because these get reassigned to [] when cleared.
let particles = [];      // General particles: death, coin, movement
let fireParticles = [];  // Fire-specific particles: floating embers


// ============================================================
// SPAWNING — Creating New Particles
// ============================================================

// Creates a burst of particles at a given location.
// Called when: player dies, coin collected, player jumps/dashes.
function spawnParticle(x, y, type) {

    // TERNARY OPERATOR: condition ? valueIfTrue : valueIfFalse
    // This is a compact if/else on one line.
    // Nested ternaries read as: "if death → 20, else if coin → 8, else → 3"
    const count = type === 'death' ? 20 : type === 'coin' ? 8 : 3;
    // Death = big explosion (20 particles)
    // Coin  = medium sparkle (8 particles)
    // Other = subtle dust (3 particles)

    // Standard for loop: initialize i=0, run while i<count, increment i after each iteration.
    for (let i = 0; i < count; i++) {

        // .push() adds an item to the END of an array.
        // We're pushing an OBJECT LITERAL — a new object defined inline with { }.
        particles.push({
            x, y,
            // SHORTHAND PROPERTY: "x, y" is the same as "x: x, y: y"
            // When the property name matches the variable name, you can omit the colon.

            // Math.random() returns a decimal between 0 (inclusive) and 1 (exclusive).
            // (Math.random() - 0.5) shifts the range to -0.5 to 0.5 (centered on zero).
            // Multiplying by 10 or 4 widens the spread.
            // Death particles spread wider (±5) than coin particles (±2).
            dx: (Math.random() - 0.5) * (type === 'death' ? 10 : 4),
            dy: (Math.random() - 0.5) * (type === 'death' ? 10 : 4) - 2,
            // The "- 2" bias makes particles tend to shoot upward initially.

            life: 1,
            // Life goes from 1 (fully alive) to 0 (dead).
            // This value is also used as the particle's OPACITY (transparency).
            // At life=1, fully visible. At life=0.5, half transparent. At life=0, invisible.

            decay: 0.02 + Math.random() * 0.02,
            // Each frame, life decreases by this amount.
            // Random decay (0.02 to 0.04) means particles die at different times.
            // This looks more natural than all particles vanishing simultaneously.

            size: type === 'death' ? 4 + Math.random() * 4 : 3 + Math.random() * 2,
            // Death: 4-8 pixels. Others: 3-5 pixels.

            color: type === 'death' ? '#ff4400' : type === 'coin' ? '#ffcc00' : '#00ffcc'
            // Death: orange-red (fire colored)
            // Coin: gold (coin colored)
            // Other: cyan (player trail colored)
            // Hex colors: #RRGGBB where each pair is 00-FF (0-255)
        });
    }
}


// ============================================================
// FIRE PARTICLES — Floating Embers Above Flames
// ============================================================

// Creates and updates fire particles. Called every frame.
function updateFireParticles(fires) {

    // --- SPAWN NEW FIRE PARTICLES ---
    fires.forEach(f => {
        // 40% chance per frame per fire to spawn a particle.
        // Math.random() < 0.4 is true ~40% of the time.
        // This randomness creates natural-looking flickering.
        if (Math.random() < 0.4) {
            fireParticles.push({
                x: f.x + Math.random() * f.width, // Random x within the fire's width
                y: f.y,                            // Start at the top of the fire
                dy: -1 - Math.random() * 2,        // Float upward (negative = up)
                dx: (Math.random() - 0.5) * 0.5,   // Tiny horizontal drift
                life: 1,
                size: 3 + Math.random() * 5         // 3-8 pixel radius
            });
        }
    });

    // --- UPDATE EXISTING FIRE PARTICLES ---

    // REVERSE LOOP: "let fi = fireParticles.length; while (fi--)"
    // This counts backward: if length=5, fi goes 4, 3, 2, 1, 0.
    // "fi--" decrements AFTER returning the value. When fi reaches 0,
    // it returns 0 (truthy), decrements to -1, and on the next check
    // returns -1 which is still truthy... actually "while(fi--)" stops
    // because when fi is 0, fi-- returns 0 which is FALSY. Loop ends.
    //
    // WHY BACKWARD? Because we remove dead particles during iteration.
    // Removing items while looping FORWARD causes index problems:
    //   Forward: [A, B, C] → remove B → [A, C] → index 2 skips C!
    //   Backward: [A, B, C] → remove B → [A, C] → index 0 still hits A. Safe!
    let fi = fireParticles.length;
    while (fi--) {
        const p = fireParticles[fi];

        // SEMICOLONS allow multiple statements on one line.
        // This is purely a style choice — saves vertical space.
        p.y += p.dy; p.x += p.dx;    // Move the particle
        p.life -= 0.03;               // Fade out
        p.size *= 0.97;               // Shrink by 3% each frame (compound decay)
        // After 50 frames: size = original * 0.97^50 ≈ original * 0.22 (78% smaller)

        if (p.life <= 0) {
            // --- SWAP-AND-POP REMOVAL (Performance Optimization) ---
            // The naive approach: fireParticles.splice(fi, 1)
            //   splice() removes an element and shifts all following elements left.
            //   For an array of 100 items, removing index 5 means moving 94 items. SLOW.
            //
            // Swap-and-pop approach:
            //   1. Copy the LAST element into the position of the dead element.
            //   2. Remove the last element with .pop() (which is instant).
            //   This is O(1) instead of O(n). Order doesn't matter for particles.
            fireParticles[fi] = fireParticles[fireParticles.length - 1];
            fireParticles.pop();
        }
    }
}


// ============================================================
// GENERAL PARTICLE UPDATE
// ============================================================

function updateParticles() {
    let pi = particles.length;
    while (pi--) {
        const p = particles[pi];

        p.x += p.dx;    // Move horizontally
        p.y += p.dy;    // Move vertically
        p.dy += 0.2;    // GRAVITY: particles fall downward (unlike fire particles)
                         // 0.2 is gentler than the player's 0.6 gravity, so particles
                         // float more gracefully — they're light debris, not a person.
        p.life -= p.decay; // Fade based on each particle's individual decay rate

        if (p.life <= 0) {
            // Same swap-and-pop removal as fire particles.
            particles[pi] = particles[particles.length - 1];
            particles.pop();
        }
    }
}


// ============================================================
// DRAWING — Rendering Particles on Screen
// ============================================================

// Draw general particles as colored SQUARES.
function drawParticles(ctx) {
    // "ctx" is the Canvas 2D rendering context — the object that provides
    // all drawing methods (fillRect, arc, fillStyle, etc.)

    particles.forEach(p => {
        ctx.fillStyle = p.color;      // Set the drawing color
        ctx.globalAlpha = p.life;     // Set transparency (1 = opaque, 0 = invisible)
        // As life decreases from 1→0, the particle fades out automatically.

        // fillRect(x, y, width, height) draws a filled rectangle.
        // "p.x - p.size/2" centers the square on the particle's position.
        // Without this offset, the square's top-left corner would be at (p.x, p.y).
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    });

    // CRITICAL: Reset globalAlpha to 1 after drawing!
    // If we forget this, EVERYTHING drawn after particles would be semi-transparent.
    // This is a common canvas bug. Always restore state after changing it.
    ctx.globalAlpha = 1;
}

// Draw fire particles as colored CIRCLES.
function drawFireParticles(ctx) {
    fireParticles.forEach(p => {
        // String concatenation to build an rgba() color string.
        // 'rgba(red, green, blue, alpha)' where alpha = transparency.
        // The green channel varies with life:
        //   life=1: rgba(255, 200, 0, 1) = bright yellow-orange
        //   life=0.5: rgba(255, 150, 0, 0.5) = dim orange
        //   life=0: rgba(255, 100, 0, 0) = invisible red
        // This creates a color shift from yellow → orange → red as particles die.
        ctx.fillStyle = 'rgba(255, ' + (100 + p.life * 100) + ', 0, ' + p.life + ')';

        // Drawing a circle requires the arc method + beginPath/fill:
        ctx.beginPath();
        // arc(centerX, centerY, radius, startAngle, endAngle)
        // 0 to Math.PI * 2 = full circle (2π radians = 360 degrees)
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill(); // Fill the circle with the current fillStyle

        // Why circles for fire and squares for general particles?
        // Circles look softer and more organic — fitting for fire.
        // Squares look sharper and more "digital" — fitting for game effects.
    });
}


// ============================================================
// CLEANUP
// ============================================================

// Remove ALL particles from both systems.
// Called when loading a new level to prevent leftover particles from the previous level.
function clearParticles() {
    particles = [];      // Replace the array with a new empty one.
    fireParticles = [];  // The old arrays become unreferenced and get garbage collected.
    // GARBAGE COLLECTION: JavaScript automatically frees memory that's no longer
    // referenced by any variable. We don't need to manually delete anything.
}
