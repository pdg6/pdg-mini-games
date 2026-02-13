// ============================================================
// GAME.JS — The Heart of Inferno Run
// ============================================================
// This is the main file that ties everything together.
// It creates the game engine, defines the player, runs the physics,
// handles collisions, draws everything, and manages game state.
//
// The architecture follows the GAME LOOP pattern:
//   1. setup()  — called ONCE to initialize
//   2. update() — called EVERY FRAME to process logic
//   3. draw()   — called EVERY FRAME to render visuals
// This loop runs ~60 times per second, creating the illusion of motion.
// ============================================================


// --- ENGINE SETUP ---

// The Engine class (from shared library) handles:
//   - The game loop (calling update/draw 60 times per second)
//   - Input state (which keys are pressed)
//   - Particle spawning and rendering
//   - Screen shake effects
//   - Menu/gameover overlay drawing
// It's initialized with the ID of the HTML <canvas> element.
const engine = new Engine('gameCanvas');
engine.gameName = 'Inferno-Run';


// ============================================================
// GAME STATE VARIABLES
// ============================================================
// These track the overall progress of the game session.
// "let" is used because they all CHANGE during gameplay.

let currentLevel = 1;    // Which level the player is on (1-indexed)
let coinsCollected = 0;  // Running score total across levels
let lives = 3;           // Deaths remaining before game over


// ============================================================
// ENTITY LISTS
// ============================================================
// These arrays hold all the objects in the CURRENT level.
// They get refilled every time loadLevel() is called.
// Empty arrays [] are the initial state before any level loads.

let platforms = [];         // Static ground/platforms the player stands on
let movingPlatforms = [];   // Platforms that slide back and forth
let fires = [];             // Deadly fire hazards
let coins = [];             // Collectible score items

// The goal gate. Initialized with zeroed-out dimensions.
// Gets real values when a level loads.
let goal = { x: 0, y: 0, width: 0, height: 0 };


// ============================================================
// THE PLAYER OBJECT
// ============================================================
// This object holds ALL of the player's state.
// It's a plain JavaScript object (not a class) — simple and direct.

const player = {
    x: 0, y: 0,              // Position (top-left corner of the player rectangle)
    width: 28, height: 32,   // Size in pixels (roughly human proportioned for a small sprite)

    vx: 0, vy: 0,            // Velocity: how fast the player is moving each frame
                              // vx = horizontal (positive=right, negative=left)
                              // vy = vertical (positive=down, negative=up)

    grounded: false,          // Is the player standing on a solid surface?
                              // Controls whether jumping is allowed.

    jumping: false,           // Is the player currently in a jump arc?
    facing: 1,                // Direction the sprite faces: 1=right, -1=left

    trail: [],                // Array of {x, y, life} objects for the dash visual trail.
                              // Each point fades out over time (life: 1→0).

    isDashing: false,         // Is the player currently performing a dash?
    dashTime: 0,              // Timestamp (ms) when the current dash started.
    lastDashTime: 0,          // Timestamp of the most recent dash (for cooldown).
    touchingWall: 0,          // 0=no wall, 1=wall to right, -1=wall to left
    dashDirection: 1          // Which way the dash moves: 1=right, -1=left
};
// Why "const" for an object we modify? Because "const" only prevents REASSIGNING
// the variable (player = somethingElse). Modifying properties (player.x = 5) is fine.
// This is one of JavaScript's most confusing but important distinctions.


// ============================================================
// PHYSICS CONSTANTS
// ============================================================
// Local copies of physics values. See constants.explained.js for details.
const GRAVITY = 0.6;
const JUMP_FORCE = -13;     // Negative = upward
const MAX_SPEED = 6;
const ACCEL = 0.5;          // Horizontal acceleration per frame
const FRICTION = 0.85;      // Speed multiplier when no input (1=no friction, 0=instant stop)
const DASH_SPEED = 15;      // Speed during dash (2.5x faster than normal max)
const DASH_DURATION = 150;  // How long a dash lasts (ms)
const DASH_COOLDOWN = 500;  // Time between dashes (ms)


// ============================================================
// SETUP — Called Once at Game Start
// ============================================================

function setup() {
    loadLevel(currentLevel);       // Build the first level
    engine.score = coinsCollected; // Sync the score display
}


// ============================================================
// LEVEL LOADING — Building a Level from Data
// ============================================================

function loadLevel(num) {
    // Get the level data from the levels array (defined in levels.js).
    // "(num - 1)" because arrays are 0-indexed but our levels are 1-indexed.
    // "% levels.length" wraps around: level 4 → index 0, level 5 → index 1, etc.
    // The MODULO operator (%) returns the remainder of division.
    const level = levels[(num - 1) % levels.length];

    // --- DEEP COPY ---
    // JSON.parse(JSON.stringify(data)) creates a completely independent copy.
    // Why? Because JavaScript objects are passed by REFERENCE.
    // Without deep copy: platforms = level.platforms would make BOTH variables
    // point to the SAME data. Moving a platform would corrupt the original level data,
    // making it impossible to replay the level correctly after death.
    //
    // JSON.stringify converts the object to a text string: '[{"x":0,"y":570,...}]'
    // JSON.parse converts the text back to a NEW object with no connection to the original.
    // This is a common trick but has limitations: it can't copy functions, dates, or undefined.
    platforms = JSON.parse(JSON.stringify(level.platforms));
    movingPlatforms = JSON.parse(JSON.stringify(level.movingPlatforms));
    fires = JSON.parse(JSON.stringify(level.fires));

    // --- SPREAD OPERATOR AND MAP ---
    // .map() creates a NEW array by transforming each element.
    // "c => ({...})" is an arrow function that returns an object for each coin.
    // The SPREAD OPERATOR "...c" copies all properties from the original coin (x, y).
    // Then we add new properties: collected (false) and bob (random animation offset).
    coins = level.coins.map(c => ({ ...c, collected: false, bob: Math.random() * Math.PI * 2 }));
    // Math.PI * 2 = full circle in radians. Random offset means coins bob out of sync.

    // Copy the goal with spread (shallow copy is fine here — it's a flat object).
    goal = { ...level.goal };

    // Reset player to the level's starting position.
    player.x = level.playerStart.x;
    player.y = level.playerStart.y;
    player.vx = 0;    // Stop all movement
    player.vy = 0;
    player.trail = []; // Clear dash trail
    player.isDashing = false;
}


// ============================================================
// UPDATE — Called Every Frame (~60fps). The Game's Brain.
// ============================================================

function update(dt) {
    // "dt" = delta time (milliseconds since the last frame).
    // Used for frame-rate-independent movement, though this game
    // mostly uses fixed-step physics.

    // GUARD CLAUSE: Only run game logic during active gameplay.
    // Engine states: 'MENU', 'PLAY', 'GAMEOVER'
    if (engine.state !== 'PLAY') return;

    const now = performance.now();
    // performance.now() returns a high-resolution timestamp in milliseconds.
    // More precise than Date.now() — important for game timing.


    // --- DASH LOGIC ---

    // Can the player dash? Check if enough time has passed since the last dash.
    const canDash = (now - player.lastDashTime) > DASH_COOLDOWN;

    // engine.justPressed() returns true ONLY on the frame the key was first pressed.
    // This is different from engine.isDown() which returns true every frame the key is held.
    // "justPressed" prevents the dash from retriggering while holding the key.
    if (engine.justPressed('ShiftLeft') && canDash && !player.isDashing) {
        player.isDashing = true;
        player.dashTime = now;
        player.lastDashTime = now;
        player.dashDirection = player.facing; // Dash in the direction the player faces
        player.vy = 0;                       // Cancel vertical momentum during dash
        playSound('dash');

        // Spawn 8 spark particles at the player's center for visual feedback.
        // player.x+14 and player.y+16 approximate the center of the 28x32 sprite.
        for(let i=0; i<8; i++) engine.spawnSpark(player.x+14, player.y+16, Assets.COLORS.accent);
    }

    if (player.isDashing) {
        // Check if the dash is still within its duration.
        if (now - player.dashTime < DASH_DURATION) {
            // OVERRIDE normal physics: force constant horizontal speed.
            player.vx = DASH_SPEED * player.dashDirection;
            player.vy = 0; // Freeze vertically — no falling during dash.

            // Add a trail point for the visual afterimage effect.
            player.trail.push({ x: player.x + 14, y: player.y + 16, life: 1 });
        } else {
            // Dash expired. Return to normal movement.
            player.isDashing = false;
        }
    } else {
        // --- NORMAL HORIZONTAL MOVEMENT (only when NOT dashing) ---

        let inputX = 0;
        // Build input from left/right keys. Checking multiple keys per direction.
        if (engine.isDown('ArrowLeft') || engine.isDown('KeyA')) inputX--;
        if (engine.isDown('ArrowRight') || engine.isDown('KeyD')) inputX++;
        // If both directions held: -1 + 1 = 0 (cancel out, no movement).

        if (inputX !== 0) {
            // Player is pressing a direction: accelerate.
            // "+=" adds to the existing velocity (doesn't replace it).
            player.vx += inputX * ACCEL;
            player.facing = inputX; // Track which way the sprite faces.
        } else {
            // No input: apply friction to slow down.
            // "*=" multiplies the velocity by a fraction each frame.
            player.vx *= FRICTION;
        }

        // CLAMP velocity to the speed limit.
        // Math.max(-6, Math.min(6, vx)) ensures vx stays between -6 and 6.
        player.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, player.vx));

        // --- JUMPING ---
        // Three conditions must ALL be true (&&):
        //   1. Player is on the ground (grounded)
        //   2. One of the jump keys was JUST pressed or is held
        if (player.grounded && (engine.justPressed('Space') || engine.isDown('ArrowUp') || engine.isDown('KeyW'))) {
            player.vy = JUMP_FORCE; // Launch upward (negative = up)
            player.grounded = false; // No longer on ground
            playSound('jump');
            // Spawn dust particles at the player's feet (y+32 = bottom of 32px-tall sprite).
            for(let i=0; i<5; i++) engine.spawnSpark(player.x+14, player.y+32, Assets.COLORS.secondary);
        }

        // --- GRAVITY ---
        // Every frame, increase downward velocity.
        // This creates the parabolic arc of a jump:
        //   Frame 0: vy = -13 (moving up fast)
        //   Frame 1: vy = -12.4 (still up, but slower)
        //   ...
        //   Frame 21: vy ≈ 0 (peak of jump — momentarily weightless)
        //   Frame 22: vy = 0.6 (starting to fall)
        //   Frame 40: vy ≈ 11 (falling fast)
        player.vy += GRAVITY;
    }

    // --- MOVE AND COLLIDE ---
    // Movement and collision are done in TWO SEPARATE PASSES: horizontal then vertical.
    // This prevents diagonal movement from causing corner-clipping bugs.
    //
    // Pass 1: Move horizontally, then check/resolve horizontal collisions.
    player.x += player.vx;
    checkXCollisions();
    //
    // Pass 2: Move vertically, then check/resolve vertical collisions.
    player.y += player.vy;
    checkYCollisions();


    // --- MOVING PLATFORM UPDATES ---
    movingPlatforms.forEach(p => {
        // Move the platform in its current direction.
        p.x += p.speed * p.direction;

        // BOUNCE: Reverse direction at the bounds.
        if (p.x >= p.endX) p.direction = -1;      // Hit right bound → go left
        else if (p.x <= p.startX) p.direction = 1; // Hit left bound → go right
    });

    // --- TRIGGER CHECKS (Fire + Coins) ---
    checkTriggers();

    // --- GOAL CHECK ---
    // rectIntersect is a helper function (defined below) that checks AABB overlap.
    if (rectIntersect(player.x, player.y, player.width, player.height, goal.x, goal.y, goal.width, goal.height)) {
        winLevel();
    }

    // --- DEATH BY FALLING ---
    // If the player falls below the bottom of the screen, they die.
    if (player.y > engine.height) killPlayer();

    // --- TRAIL CLEANUP ---
    // Fade out trail points and remove dead ones.
    player.trail.forEach(t => t.life -= 0.05); // Each point loses 5% life per frame
    // .filter() creates a new array containing only elements that pass the test.
    // Elements where t.life > 0 are kept. Dead elements (life ≤ 0) are excluded.
    player.trail = player.trail.filter(t => t.life > 0);
}


// ============================================================
// DRAW — Called Every Frame After Update. The Game's Eyes.
// ============================================================

function draw() {
    const ctx = engine.ctx;
    // "ctx" is the Canvas 2D Rendering Context. It provides ALL drawing methods:
    //   fillRect, strokeRect, fillText, arc, beginPath, fill, stroke, etc.

    // --- CLEAR THE SCREEN ---
    // Fill the entire canvas with a dark background color.
    // This erases last frame's drawing. Without this, frames would stack on top of each other.
    ctx.fillStyle = '#050510'; // Very dark blue-black
    ctx.fillRect(0, 0, engine.width, engine.height);

    // --- GOAL GATE (Neon Glow Effect) ---
    // Canvas "shadow" properties create glow effects around shapes.
    ctx.shadowBlur = 15;                      // How far the glow spreads
    ctx.shadowColor = Assets.COLORS.accent;   // Color of the glow
    ctx.strokeStyle = Assets.COLORS.accent;   // Color of the outline
    ctx.lineWidth = 4;                        // Thickness of the outline
    ctx.strokeRect(goal.x, goal.y, goal.width, goal.height); // Draw rectangle outline
    ctx.shadowBlur = 0;                       // Reset glow (otherwise it affects everything)

    // --- LEVEL ENTITIES (platforms, fires, coins) ---
    drawLevelEntities(ctx);

    // --- DASH TRAIL ---
    // Draw fading circles along the player's dash path.
    player.trail.forEach(t => {
        // TEMPLATE LITERAL: `text ${expression}` allows embedding variables in strings.
        // Math.max(0, t.life) prevents negative values (negative opacity would be invalid).
        ctx.fillStyle = `rgba(0, 255, 255, ${Math.max(0, t.life) * 0.5})`;
        ctx.beginPath();
        // Circle radius shrinks as the trail point dies (10 * life).
        // At life=1: radius=10. At life=0.5: radius=5. At life=0: radius=0 (invisible).
        ctx.arc(t.x, t.y, Math.max(0, 10 * t.life), 0, Math.PI*2);
        ctx.fill();
    });

    // --- PLAYER CHARACTER ---
    // Rendered by the shared Assets library, which draws the player sprite.
    Assets.renderPlayer(ctx, player.x, player.y, player.width, player.height, player.vx, player.vy);

    // --- ENGINE PARTICLES (sparks from jumps/dashes/deaths) ---
    engine.drawParticles(ctx);

    // --- HUD (Heads-Up Display) ---
    drawUI(ctx);
}


// ============================================================
// UI OVERLAY
// ============================================================

function drawUI(ctx) {
    // --- TEXT RENDERING ---
    ctx.fillStyle = '#fff';                  // White text
    ctx.font = 'bold 16px Courier New';      // Monospace font for a retro game feel
    // fillText(text, x, y) draws text at the specified position.
    ctx.fillText(`LEVEL: ${currentLevel}`, 20, 30);
    ctx.fillText(`SCORE: ${engine.score}`, 20, 55);

    // --- LIVES AS HEARTS ---
    ctx.fillStyle = Assets.COLORS.secondary; // Colored hearts
    let hearts = '';
    // Build a string of heart characters, one per remaining life.
    for(let i=0; i<lives; i++) hearts += '♥';
    // "+=" appends to a string. After 3 iterations: hearts = "♥♥♥"
    ctx.fillText(hearts, 20, 80);

    // --- SCREEN OVERLAYS ---
    // engine.drawOverlay() renders a centered text panel with title, subtitle, and prompt.
    if (engine.state === 'MENU') {
        engine.drawOverlay('INFERNO RUN', 'NAVIGATE THE FLAMES', 'PRESS SPACE TO START');
    } else if (engine.state === 'GAMEOVER') {
        engine.drawOverlay('GAME OVER', `FINAL SCORE: ${engine.score}`, 'PRESS SPACE TO RESTART');
    }
}


// ============================================================
// COLLISION FUNCTIONS (Split X and Y)
// ============================================================
// Separating horizontal and vertical collision checks prevents
// diagonal clipping bugs where the player gets stuck in corners.

function checkXCollisions() {
    // SPREAD SYNTAX in arrays: [...arr1, ...arr2] concatenates two arrays.
    // This creates a temporary combined array of ALL platforms.
    [...platforms, ...movingPlatforms].forEach(p => {
        if (rectIntersect(player.x, player.y, player.width, player.height, p.x, p.y, p.width, p.height)) {
            // Player overlaps a platform horizontally.
            if (player.vx > 0) player.x = p.x - player.width; // Moving right → push left
            else if (player.vx < 0) player.x = p.x + p.width; // Moving left → push right
            player.vx = 0; // Stop horizontal movement
        }
    });
}

function checkYCollisions() {
    // Assume NOT grounded until a platform proves otherwise.
    // This is reset every frame so the player becomes ungrounded
    // the moment they walk off a ledge.
    player.grounded = false;

    [...platforms, ...movingPlatforms].forEach(p => {
        if (rectIntersect(player.x, player.y, player.width, player.height, p.x, p.y, p.width, p.height)) {
            if (player.vy > 0) {
                // FALLING DOWN → landed on top of platform.
                player.y = p.y - player.height;
                player.grounded = true;
                player.vy = 0;
                // If it's a moving platform, carry the player with it.
                if (p.speed) player.x += p.speed * p.direction;
            } else if (player.vy < 0) {
                // MOVING UP → bonked head on bottom of platform.
                player.y = p.y + p.height;
                player.vy = 0;
            }
        }
    });
}


// ============================================================
// TRIGGER COLLISIONS (Fire + Coins)
// ============================================================

function checkTriggers() {
    fires.forEach(f => {
        // The "+4" and "-8" shrink the player's hitbox for fire checks.
        // This makes fire collisions more FORGIVING than platform collisions.
        // The player can visually graze flames without dying.
        if (rectIntersect(player.x+4, player.y+4, player.width-8, player.height-8, f.x, f.y, f.width, f.height)) {
            // Dashing grants INVINCIBILITY through fire — a core mechanic.
            if (!player.isDashing) killPlayer();
        }
    });

    coins.forEach(c => {
        // Skip already-collected coins. The coin stays in the array but is ignored.
        if (!c.collected && rectIntersect(player.x, player.y, player.width, player.height, c.x, c.y, 20, 20)) {
            c.collected = true;      // Flag as collected
            engine.score += 100;     // "+=" adds 100 to the existing score
            playSound('coin');
            // Spawn 10 sparkle particles at the coin's center (10 = half of 20px size).
            for(let i=0; i<10; i++) engine.spawnSpark(c.x+10, c.y+10, Assets.COLORS.secondary);
        }
    });
}


// ============================================================
// DEATH AND VICTORY
// ============================================================

function killPlayer() {
    lives--;                 // "--" decrements by 1. Same as: lives = lives - 1
    engine.shake = 15;       // Trigger screen shake (intensity 15)
    playSound('death');
    // Death explosion: 20 red particles burst from the player's center.
    for(let i=0; i<20; i++) engine.spawnSpark(player.x+14, player.y+16, Assets.COLORS.primary);

    if (lives <= 0) {
        // GAME OVER: No lives remaining.
        engine.state = 'GAMEOVER';
        // Reset everything for a fresh start when the player continues.
        lives = 3;
        currentLevel = 1;
        coinsCollected = 0;
    } else {
        // Still have lives: reload the same level (respawn).
        loadLevel(currentLevel);
    }
}

function winLevel() {
    playSound('levelup');
    coinsCollected = engine.score; // Preserve score for next level
    currentLevel++;                // "++" increments by 1

    if (currentLevel > levels.length) {
        // Completed ALL levels — victory!
        // The game treats this as "game over" but it's really a win.
        engine.state = 'GAMEOVER';
    } else {
        // More levels to go. Load the next one.
        loadLevel(currentLevel);
    }
}


// ============================================================
// UTILITY: Rectangle Intersection Test (AABB)
// ============================================================

// The most used function in any 2D game. Checks if two rectangles overlap.
// Parameters: x1,y1,w1,h1 = first rectangle. x2,y2,w2,h2 = second rectangle.
// Returns: true if they overlap, false if they don't.
function rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
    // Four conditions, ALL must be true for overlap:
    //   rect2's left edge < rect1's right edge   (not too far right)
    //   rect2's right edge > rect1's left edge    (not too far left)
    //   rect2's top edge < rect1's bottom edge    (not too far below)
    //   rect2's bottom edge > rect1's top edge    (not too far above)
    return x2 < x1 + w1 && x2 + w2 > x1 && y2 < y1 + h1 && y2 + h2 > y1;
}


// ============================================================
// ENTITY RENDERING — Drawing Platforms, Fires, Coins
// ============================================================

function drawLevelEntities(ctx) {

    // --- PLATFORMS ---
    [...platforms, ...movingPlatforms].forEach(p => {
        // Dark body
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(p.x, p.y, p.width, p.height);
        // Subtle border
        ctx.strokeStyle = '#444466';
        ctx.lineWidth = 1;
        ctx.strokeRect(p.x, p.y, p.width, p.height);
        // Neon top edge — a 2px bright strip along the top of the platform.
        // This makes platforms visible against the dark background.
        ctx.fillStyle = Assets.COLORS.primary;
        ctx.fillRect(p.x, p.y, p.width, 2);
    });

    // --- FIRES ---
    fires.forEach(f => {
        const t = performance.now() * 0.01; // Slow time value for animation
        ctx.fillStyle = Assets.COLORS.primary;
        ctx.shadowBlur = 10;
        ctx.shadowColor = Assets.COLORS.primary;

        // Draw 3 overlapping triangles with oscillating heights.
        for(let i=0; i<3; i++) {
            // Math.sin() returns a value between -1 and 1, creating a smooth wave.
            // Adding "i" offsets each triangle's wave, so they flicker independently.
            const h = f.height + Math.sin(t + i) * 10;

            // TRIANGLE: 3 points connected to form a shape.
            ctx.beginPath();
            ctx.moveTo(f.x, f.y + f.height);                  // Bottom-left corner
            ctx.lineTo(f.x + f.width/2, f.y + f.height - h);  // Top center (peak)
            ctx.lineTo(f.x + f.width, f.y + f.height);        // Bottom-right corner
            ctx.fill();
            // The peak height oscillates, making the flame "dance".
        }
        ctx.shadowBlur = 0; // Reset glow
    });

    // --- COINS ---
    coins.forEach(c => {
        if (c.collected) return; // EARLY RETURN: skip drawing collected coins.
        // "return" inside .forEach() is like "continue" in a for loop — skip this iteration.

        // Bobbing animation: float up and down using a sine wave.
        const bob = Math.sin(performance.now() * 0.005 + c.bob) * 5;
        // performance.now() * 0.005 makes the wave cycle slowly.
        // "* 5" makes the bob ±5 pixels (gentle float).
        // c.bob (random offset) means each coin bobs at a different phase.

        ctx.fillStyle = Assets.COLORS.secondary;
        ctx.shadowBlur = 5;
        ctx.shadowColor = Assets.COLORS.secondary;
        ctx.beginPath();
        // Draw a circle at the coin's position + bob offset.
        // c.x + 10, c.y + 10 = center of the 20x20 coin.
        ctx.arc(c.x + 10, c.y + 10 + bob, 8, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });
}


// ============================================================
// START THE GAME
// ============================================================

// This single line kicks off the entire game.
// engine.start() registers setup, update, and draw as callbacks,
// then begins the game loop using requestAnimationFrame.
// requestAnimationFrame tells the browser to call a function
// before the next screen repaint (~60 times per second).
engine.start(setup, update, draw);
