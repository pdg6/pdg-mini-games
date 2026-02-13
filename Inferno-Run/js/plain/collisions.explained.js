// ============================================================
// COLLISIONS.JS — How Objects Interact in the Game World
// ============================================================
// This file answers the question: "Is the player touching anything?"
// It uses AABB (Axis-Aligned Bounding Box) collision detection —
// the simplest and most common method in 2D games.
// Every object is treated as a rectangle, and we check if rectangles overlap.
// ============================================================


// The master collision function. Called every single frame.
// Parameters:
//   gameState — string: "playing", "start", "win", etc.
//   canvas    — the HTML canvas element (we need its width/height for boundaries)
//   callbacks — an object containing functions to call when events happen:
//               { onDeath: function, onCoinCollect: function, onWin: function }
//               This is the CALLBACK PATTERN — instead of hardcoding what happens
//               on death, we let the caller decide by passing in a function.
function checkCollisions(gameState, canvas, callbacks) {
    // GUARD CLAUSE: Exit immediately if the game isn't active.
    // This prevents collisions from triggering on menus or game-over screens.
    // "return" with no value exits the function and returns "undefined".
    if (gameState !== 'playing') return;

    // getAllPlatforms() returns both static and moving platforms combined.
    // We check collisions against ALL of them.
    const allPlatforms = getAllPlatforms();


    // ========================================
    // PLATFORM COLLISIONS
    // ========================================

    // .forEach() calls the provided function once for each item in the array.
    // "p" is the current platform being checked.
    // This is equivalent to a for loop but reads more naturally.
    allPlatforms.forEach(p => {

        // --- THE AABB OVERLAP TEST ---
        // Two rectangles overlap if and only if ALL FOUR of these are true:
        //   1. Player's left edge  < Platform's right edge  (player isn't fully to the right)
        //   2. Player's right edge > Platform's left edge   (player isn't fully to the left)
        //   3. Player's top edge   < Platform's bottom edge (player isn't fully below)
        //   4. Player's bottom edge > Platform's top edge   (player isn't fully above)
        //
        // If ANY one of these is false, the rectangles DON'T overlap.
        // "&&" means AND — all conditions must be true.
        if (player.x < p.x + p.width &&
            player.x + player.width > p.x &&
            player.y < p.y + p.height &&
            player.y + player.height > p.y) {

            // --- COLLISION RESOLUTION: Which side did we hit? ---
            // We calculate how deeply the player overlaps the platform from each side.
            // The SMALLEST overlap tells us which side the collision came from.
            // This technique is called "minimum penetration depth" or "minimum translation vector".

            const overlapTop = (player.y + player.height) - p.y;     // How far player's bottom penetrates platform's top
            const overlapBottom = (p.y + p.height) - player.y;       // How far platform's bottom penetrates player's top
            const overlapLeft = (player.x + player.width) - p.x;    // How far player's right penetrates platform's left
            const overlapRight = (p.x + p.width) - player.x;        // How far platform's right penetrates player's left

            // Math.min returns the smallest of the four values.
            const minOverlap = Math.min(overlapTop, overlapBottom, overlapLeft, overlapRight);

            // Now resolve based on which side had the smallest overlap.

            if (minOverlap === overlapTop && player.dy > 0) {
                // LANDED ON TOP: Player was falling (dy > 0) and hit the platform's top edge.
                // Snap the player to sit exactly on top of the platform.
                player.y = p.y - player.height;
                player.dy = 0;                    // Stop falling
                player.jumping = false;           // No longer in a jump
                player.grounded = true;           // Can jump again
                player.lastGroundedTime = performance.now(); // For coyote time

                // MOVING PLATFORM: If this platform has a speed property,
                // move the player along with it so they don't slide off.
                if (p.speed) player.x += p.speed * p.direction;
            }
            else if (minOverlap === overlapBottom && player.dy < 0) {
                // HIT CEILING: Player was moving up (dy < 0) and hit the platform's bottom.
                // "Bonked their head" — push them below the platform and stop upward movement.
                player.y = p.y + p.height;
                player.dy = 0;
            }
            else if (minOverlap === overlapLeft) {
                // HIT LEFT WALL: Player ran into the platform's left edge.
                // Push them out to the left of the platform.
                player.x = p.x - player.width;
                player.dx = 0;

                // WALL DETECTION for wall-sliding/wall-jumping:
                // Only triggers if: airborne (!grounded) AND falling (dy > 0)
                // touchingWall = 1 means "there's a wall to my RIGHT"
                if (!player.grounded && player.dy > 0) {
                    player.touchingWall = 1;
                }
            }
            else if (minOverlap === overlapRight) {
                // HIT RIGHT WALL: Player ran into the platform's right edge.
                // Push them out to the right.
                player.x = p.x + p.width;
                player.dx = 0;

                // touchingWall = -1 means "there's a wall to my LEFT"
                if (!player.grounded && player.dy > 0) {
                    player.touchingWall = -1;
                }
            }
        }
    });


    // ========================================
    // FIRE COLLISIONS
    // ========================================

    // The dash makes the player temporarily invincible to fire.
    // This is stored in a descriptive variable for readability.
    const dashInvincible = player.isDashing;

    fires.forEach(f => {
        // Notice the "-5" and "+5" adjustments to the hitbox.
        // This makes the fire's collision area SMALLER than its visual.
        // The player can visually overlap the flames slightly without dying.
        // This is called a "forgiving hitbox" — a common game design trick.
        // Without it, players feel cheated ("I wasn't even touching it!").
        if (!dashInvincible &&
            player.x < f.x + f.width - 5 &&    // 5px smaller on right
            player.x + player.width > f.x + 5 && // 5px smaller on left
            player.y < f.y + f.height &&
            player.y + player.height > f.y + 5) { // 5px smaller on top
            callbacks.onDeath(); // Call the death handler (passed in by the caller)
        }
    });


    // ========================================
    // COIN COLLISIONS
    // ========================================

    coins.forEach(c => {
        // The "!" operator means NOT. !c.collected = "if NOT collected".
        // Once a coin is collected, we skip it forever.
        // The coin stays in the array but is flagged — simpler than removing it.
        if (!c.collected &&
            player.x < c.x + 20 &&          // Coins are 20x20 pixels
            player.x + player.width > c.x &&
            player.y < c.y + 20 &&
            player.y + player.height > c.y) {
            c.collected = true;              // Flag as collected
            callbacks.onCoinCollect();       // Trigger score increase
            playSound('coin');               // Audio feedback
            spawnParticle(c.x + 10, c.y + 10, 'coin'); // Visual feedback at coin center
            // "+10" centers the particle on the 20px coin (20/2 = 10)
        }
    });


    // ========================================
    // GOAL COLLISION
    // ========================================

    // The goal is the exit gate. Touching it in any way wins the level.
    // No forgiving hitbox here — the full rectangle counts.
    if (player.x < goal.x + goal.width &&
        player.x + player.width > goal.x &&
        player.y < goal.y + goal.height &&
        player.y + player.height > goal.y) {
        callbacks.onWin();
    }


    // ========================================
    // BOUNDARY COLLISIONS (Screen Edges)
    // ========================================

    // Prevent walking off the left edge of the screen.
    if (player.x < 0) player.x = 0;

    // Prevent walking off the right edge.
    // player.width is subtracted because player.x is the LEFT edge of the player.
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Falling off the BOTTOM of the screen = death.
    // There's no invisible floor — the void below is lethal.
    // Note: there's no TOP boundary check. The player can jump off the top of the screen.
    if (player.y > canvas.height) callbacks.onDeath();
}
