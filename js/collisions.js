// Collision Detection
function checkCollisions(gameState, canvas, callbacks) {
    if (gameState !== 'playing') return;
    
    const allPlatforms = getAllPlatforms();
    
    // Platform collisions
    allPlatforms.forEach(p => {
        if (player.x < p.x + p.width &&
            player.x + player.width > p.x &&
            player.y < p.y + p.height &&
            player.y + player.height > p.y) {
            
            const overlapTop = (player.y + player.height) - p.y;
            const overlapBottom = (p.y + p.height) - player.y;
            const overlapLeft = (player.x + player.width) - p.x;
            const overlapRight = (p.x + p.width) - player.x;
            const minOverlap = Math.min(overlapTop, overlapBottom, overlapLeft, overlapRight);
            
            if (minOverlap === overlapTop && player.dy > 0) {
                player.y = p.y - player.height;
                player.dy = 0;
                player.jumping = false;
                player.grounded = true;
                player.lastGroundedTime = performance.now();
                if (p.speed) player.x += p.speed * p.direction;
            } else if (minOverlap === overlapBottom && player.dy < 0) {
                player.y = p.y + p.height;
                player.dy = 0;
            } else if (minOverlap === overlapLeft) {
                player.x = p.x - player.width;
                player.dx = 0;
                // Wall touch detection (right side of player touching left side of platform)
                if (!player.grounded && player.dy > 0) {
                    player.touchingWall = 1;
                }
            } else if (minOverlap === overlapRight) {
                player.x = p.x + p.width;
                player.dx = 0;
                // Wall touch detection (left side of player touching right side of platform)
                if (!player.grounded && player.dy > 0) {
                    player.touchingWall = -1;
                }
            }
        }
    });
    
    // Fire collisions (dash grants brief invincibility)
    const dashInvincible = player.isDashing;
    fires.forEach(f => {
        if (!dashInvincible &&
            player.x < f.x + f.width - 5 &&
            player.x + player.width > f.x + 5 &&
            player.y < f.y + f.height &&
            player.y + player.height > f.y + 5) {
            callbacks.onDeath();
        }
    });
    
    // Coin collisions
    coins.forEach(c => {
        if (!c.collected &&
            player.x < c.x + 20 &&
            player.x + player.width > c.x &&
            player.y < c.y + 20 &&
            player.y + player.height > c.y) {
            c.collected = true;
            callbacks.onCoinCollect();
            playSound('coin');
            spawnParticle(c.x + 10, c.y + 10, 'coin');
        }
    });
    
    // Goal collision
    if (player.x < goal.x + goal.width &&
        player.x + player.width > goal.x &&
        player.y < goal.y + goal.height &&
        player.y + player.height > goal.y) {
        callbacks.onWin();
    }
    
    // Boundary collisions
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    if (player.y > canvas.height) callbacks.onDeath();
}
