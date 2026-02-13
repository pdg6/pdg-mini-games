// ============================================================
// RENDERING.JS — Painting the Night Sky Background
// ============================================================
// This file creates the visual backdrop: a dark gradient sky with
// twinkling stars. It demonstrates procedural generation, the
// Canvas 2D API, random number usage, and value clamping.
// None of this affects gameplay — it's purely aesthetic.
// ============================================================


// --- STATE ---

// An array that holds all star objects. Starts empty, filled by initStars().
// Each star: { x: number, y: number, size: number, brightness: number }
let stars = [];


// ============================================================
// INITIALIZATION — Creating the Star Field
// ============================================================

// Generate 100 randomly placed stars across the canvas.
// Called once at startup.
function initStars(canvasWidth, canvasHeight) {
    // Reset to empty array. If called again (e.g., on resize), old stars are discarded.
    stars = [];

    // Create exactly 100 stars using a standard for loop.
    for (let i = 0; i < 100; i++) {
        stars.push({
            // Math.random() returns a number from 0 (inclusive) to 1 (exclusive).
            // Multiplying by canvasWidth gives a range of 0 to 799.99...
            // This places the star at a random x position across the full screen width.
            x: Math.random() * canvasWidth,

            // Same for vertical position.
            y: Math.random() * canvasHeight,

            // Star radius in pixels. Range: 0.5 to 2.5.
            // "Math.random() * 2" gives 0 to 2, then "+ 0.5" shifts to 0.5 to 2.5.
            // Small range creates a mix: tiny distant stars and slightly larger close ones.
            size: Math.random() * 2 + 0.5,

            // How bright/opaque the star is. Range: 0 to 1.
            // 0 = invisible, 1 = fully bright.
            // This initial random value gives each star a different starting brightness.
            brightness: Math.random()
        });
    }

    // PROCEDURAL GENERATION: We didn't hand-place 100 stars.
    // The algorithm creates them randomly, so every session has a unique sky.
    // This is the simplest form of procedural generation — the same technique
    // used to create galaxies in No Man's Sky or worlds in Minecraft.
}


// ============================================================
// UPDATE — Making Stars Twinkle
// ============================================================

// Slightly randomize each star's brightness every frame.
// Called once per frame in the game loop.
function updateStars() {
    // .forEach() iterates over every element in the array.
    // "s" is the current star (short variable names are common in tight loops).
    stars.forEach(s => {
        // Add a small random value between -0.05 and +0.05 to brightness.
        // (Math.random() - 0.5) gives -0.5 to 0.5.
        // Multiplying by 0.1 narrows it to -0.05 to 0.05.
        // This creates a subtle, random flicker each frame.
        s.brightness += (Math.random() - 0.5) * 0.1;

        // CLAMPING: Force brightness to stay within the range [0.3, 1].
        // Math.max(0.3, value) ensures the value is at LEAST 0.3.
        //   If value is 0.1, Math.max(0.3, 0.1) returns 0.3.
        //   If value is 0.5, Math.max(0.3, 0.5) returns 0.5.
        // Math.min(1, value) ensures the value is at MOST 1.
        //   If value is 1.2, Math.min(1, 1.2) returns 1.
        //   If value is 0.8, Math.min(1, 0.8) returns 0.8.
        // Combined: clamp(value, min, max) = Math.max(min, Math.min(max, value))
        s.brightness = Math.max(0.3, Math.min(1, s.brightness));
        // Minimum 0.3 means stars never fully disappear — they always glow faintly.
        // Maximum 1 means they never exceed full opacity.
    });
}


// ============================================================
// DRAWING — Painting the Background
// ============================================================

// Render the gradient sky and all stars onto the canvas.
// This is drawn FIRST every frame, before platforms, player, etc.
// Everything else is painted ON TOP of this background.
// This layering is called "draw order" or "painter's algorithm".
function drawBackground(ctx, canvasWidth, canvasHeight) {

    // --- GRADIENT SKY ---

    // createLinearGradient(x0, y0, x1, y1) defines a gradient line.
    // (0, 0) to (0, canvasHeight) = vertical gradient from top to bottom.
    const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);

    // addColorStop(position, color) adds a color at a position (0 to 1).
    // position 0 = top of gradient, 0.5 = middle, 1 = bottom.
    gradient.addColorStop(0, '#0a0015');    // Top: very dark purple-black (deep space)
    gradient.addColorStop(0.5, '#150520');  // Middle: slightly lighter purple
    gradient.addColorStop(1, '#1a0a10');    // Bottom: dark reddish-brown (fire glow)
    // The reddish tint at the bottom subtly hints at the fire hazards below.
    // Color design like this creates atmosphere without the player consciously noticing.

    // Fill the entire canvas with the gradient.
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    // fillRect(x, y, width, height) draws a filled rectangle.
    // Starting at (0,0) with full canvas dimensions covers everything.

    // --- STARS ---

    stars.forEach(s => {
        // Build an rgba color string for white with variable opacity.
        // 'rgba(red, green, blue, alpha)' — alpha controls transparency.
        // s.brightness * 0.8 caps the brightest star at 80% opacity,
        // keeping stars subtle so they don't overpower the scene.
        ctx.fillStyle = 'rgba(255, 255, 255, ' + (s.brightness * 0.8) + ')';

        // Drawing a circle on canvas requires 3 steps:
        // 1. beginPath() — start a new shape
        // 2. arc() — define the circle
        // 3. fill() — color it in
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        // arc(centerX, centerY, radius, startAngle, endAngle)
        // 0 to Math.PI * 2 = 0 to 2π radians = full 360° circle.
        // If you used Math.PI instead, you'd get a semicircle.
        ctx.fill();
    });
}

// ============================================================
// KEY CANVAS API CONCEPTS USED IN THIS FILE
// ============================================================
//
// ctx.fillStyle = color
//   Sets the color used by fillRect() and fill().
//   Can be a hex string (#ff0000), rgb/rgba string, or a gradient object.
//
// ctx.fillRect(x, y, width, height)
//   Draws a filled rectangle immediately (no beginPath needed).
//
// ctx.beginPath()
//   Starts a new shape. Required before arc(), lineTo(), etc.
//   Without it, shapes connect to previous paths.
//
// ctx.arc(x, y, radius, startAngle, endAngle)
//   Adds a circle (or arc) to the current path. Does NOT draw it yet.
//
// ctx.fill()
//   Fills the current path with the current fillStyle.
//
// ctx.createLinearGradient(x0, y0, x1, y1)
//   Creates a gradient object that can be used as a fillStyle.
//   The gradient line goes from (x0,y0) to (x1,y1).
//
// gradient.addColorStop(position, color)
//   Adds a color at a position along the gradient (0 = start, 1 = end).
// ============================================================
