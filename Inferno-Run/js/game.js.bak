// Main Game Controller
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const levelBanner = document.getElementById('level-banner');
const scoreDisplay = document.getElementById('score');
const levelDisplay = document.getElementById('level-display');
const heartsDisplay = document.querySelector('.heart');

// Game State
let gameState = 'start';
let currentLevel = 1;
let score = 0;
let lives = 3;
let screenShake = 0;
let lastTime = 0;
let deltaTime = 0;

// Initialize game
function init() {
    initStars(canvas.width, canvas.height);
    loadLevel(currentLevel);
    initInput();
}

function loadLevel(levelNum) {
    const playerStart = loadLevelEntities(levelNum);
    resetPlayer(playerStart);
    clearParticles();
}

// Input callback
function onKeyDown(code) {
    if (gameState === 'start' && code === 'Space') {
        initAudio();
        gameState = 'playing';
        overlay.classList.add('hidden');
        showLevelBanner();
    }
    
    if (gameState === 'dead' && code === 'KeyR') {
        if (lives > 0) {
            loadLevel(currentLevel);
            gameState = 'playing';
            overlay.classList.add('hidden');
        } else {
            lives = 3; score = 0; currentLevel = 1;
            updateUI(); loadLevel(1);
            gameState = 'playing';
            overlay.classList.add('hidden');
            showLevelBanner();
        }
    }
    
    if (gameState === 'win' && code === 'Space') {
        currentLevel++;
        if (currentLevel > levels.length) {
            currentLevel = 1; score = 0; lives = 3;
        }
        loadLevel(currentLevel);
        updateUI();
        gameState = 'playing';
        overlay.classList.add('hidden');
        showLevelBanner();
    }
}

// Collision callbacks
const collisionCallbacks = {
    onDeath: killPlayer,
    onCoinCollect: () => {
        score += 100;
        updateUI();
    },
    onWin: winLevel
};

function killPlayer() {
    if (gameState !== 'playing') return;
    lives--;
    screenShake = 15;
    playSound('death');
    spawnParticle(player.x + player.width / 2, player.y + player.height / 2, 'death');
    gameState = 'dead';
    updateUI();
    
    setTimeout(() => {
        if (lives > 0) {
            overlay.innerHTML = '<h2 style="color: #ff4400;">YOU DIED</h2>' +
                '<p>Lives remaining: <span class="heart">' + '\u2665'.repeat(lives) + '</span></p>' +
                '<p class="blink" style="margin-top: 30px; color: #fff;">PRESS R TO RETRY</p>';
        } else {
            overlay.innerHTML = '<h1 style="color: #ff4400;">GAME OVER</h1>' +
                '<h2>FINAL SCORE: ' + score + '</h2>' +
                '<p class="blink" style="margin-top: 30px; color: #fff;">PRESS R TO RESTART</p>';
        }
        overlay.classList.remove('hidden');
    }, 500);
}

function winLevel() {
    gameState = 'win';
    score += 500;
    playSound('levelup');
    updateUI();
    
    if (currentLevel >= levels.length) {
        overlay.innerHTML = '<h1>VICTORY!</h1>' +
            '<h2>FINAL SCORE: ' + score + '</h2>' +
            '<p>You conquered all ' + levels.length + ' levels!</p>' +
            '<p class="blink" style="margin-top: 40px; color: #fff;">PRESS SPACE TO PLAY AGAIN</p>';
    } else {
        overlay.innerHTML = '<h2 style="color: #00ffcc;">LEVEL COMPLETE!</h2>' +
            '<p>Score: ' + score + '</p>' +
            '<p class="blink" style="margin-top: 30px; color: #fff;">PRESS SPACE FOR NEXT LEVEL</p>';
    }
    overlay.classList.remove('hidden');
}

function showLevelBanner() {
    levelBanner.textContent = 'LEVEL ' + currentLevel;
    levelBanner.style.opacity = 1;
    setTimeout(() => levelBanner.style.opacity = 0, 1500);
}

function updateUI() {
    scoreDisplay.textContent = score;
    levelDisplay.textContent = 'LEVEL ' + currentLevel;
    heartsDisplay.innerHTML = '\u2665'.repeat(lives) + '\u2661'.repeat(3 - lives);
}

// Main game loop
function gameLoop(timestamp) {
    deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    // Screen shake effect
    if (screenShake > 0) {
        ctx.save();
        ctx.translate(
            (Math.random() - 0.5) * screenShake,
            (Math.random() - 0.5) * screenShake
        );
        screenShake *= 0.9;
        if (screenShake < 0.5) screenShake = 0;
    }
    
    // Update
    updateStars();
    updateMovingPlatforms();
    updatePlayer(gameState, keys);
    checkCollisions(gameState, canvas, collisionCallbacks);
    updateFireParticles(fires);
    updateParticles();
    
    // Render
    drawBackground(ctx, canvas.width, canvas.height);
    drawPlatforms(ctx);
    drawFires(ctx);
    drawFireParticles(ctx);
    drawCoins(ctx);
    drawGoal(ctx);
    drawPlayer(ctx);
    drawParticles(ctx);
    
    if (screenShake > 0) ctx.restore();
    
    requestAnimationFrame(gameLoop);
}

// Start the game
init();
updateUI();
requestAnimationFrame(gameLoop);
