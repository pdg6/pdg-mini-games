// Input Handling - Keyboard, Gamepad, Touch, Rebindable Keys
const keys = {};
const smoothedInput = { x: 0, y: 0 };
let gamepadIndex = null;
let touchControls = { left: false, right: false, jump: false, dash: false };

// Default key bindings (rebindable)
let keyBindings = {
    moveLeft: ['ArrowLeft', 'KeyA'],
    moveRight: ['ArrowRight', 'KeyD'],
    jump: ['Space', 'ArrowUp', 'KeyW'],
    dash: ['ShiftLeft', 'ShiftRight', 'KeyE']
};

// Load saved bindings from localStorage
function loadKeyBindings() {
    const saved = localStorage.getItem('infernoRunKeyBindings');
    if (saved) {
        try {
            keyBindings = JSON.parse(saved);
        } catch (e) {
            console.warn('Failed to load key bindings');
        }
    }
}

// Save bindings to localStorage
function saveKeyBindings() {
    localStorage.setItem('infernoRunKeyBindings', JSON.stringify(keyBindings));
}

// Rebind a key
function rebindKey(action, newKey, slot = 0) {
    if (keyBindings[action]) {
        keyBindings[action][slot] = newKey;
        saveKeyBindings();
    }
}

// Check if an action is pressed (checks all bound keys)
function isActionPressed(action) {
    const bindings = keyBindings[action];
    if (!bindings) return false;
    return bindings.some(key => keys[key]);
}

function initInput() {
    loadKeyBindings();
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);
    initTouchControls();
}

function handleKeyDown(e) {
    // Prevent default for game keys
    if (e.code === 'Space' || e.code.startsWith('Arrow')) {
        e.preventDefault();
    }
    keys[e.code] = true;
    
    // Trigger game state changes
    if (typeof onKeyDown === 'function') {
        onKeyDown(e.code);
    }
    
    // Set jump buffer time
    if (isActionPressed('jump') && gameState === 'playing') {
        player.jumpBufferTime = performance.now();
    }
    
    // Trigger dash
    if (isActionPressed('dash') && gameState === 'playing') {
        player.dashBufferTime = performance.now();
    }
}

function handleKeyUp(e) {
    keys[e.code] = false;
}

// ============ GAMEPAD SUPPORT ============
function handleGamepadConnected(e) {
    console.log('Gamepad connected:', e.gamepad.id);
    gamepadIndex = e.gamepad.index;
}

function handleGamepadDisconnected(e) {
    console.log('Gamepad disconnected');
    if (gamepadIndex === e.gamepad.index) {
        gamepadIndex = null;
    }
}

function applyDeadzone(value) {
    if (Math.abs(value) < GAMEPAD_DEADZONE) return 0;
    // Rescale to 0-1 range after deadzone
    const sign = Math.sign(value);
    return sign * (Math.abs(value) - GAMEPAD_DEADZONE) / (1 - GAMEPAD_DEADZONE);
}

function pollGamepad() {
    if (gamepadIndex === null) return null;
    
    const gamepads = navigator.getGamepads();
    const gp = gamepads[gamepadIndex];
    if (!gp) return null;
    
    const input = {
        moveX: applyDeadzone(gp.axes[0]),
        moveY: applyDeadzone(gp.axes[1]),
        jump: gp.buttons[0]?.pressed || gp.buttons[1]?.pressed, // A or B
        dash: gp.buttons[2]?.pressed || gp.buttons[4]?.pressed || gp.buttons[5]?.pressed, // X or shoulder
        start: gp.buttons[9]?.pressed,
        dpadLeft: gp.buttons[14]?.pressed,
        dpadRight: gp.buttons[15]?.pressed,
        dpadUp: gp.buttons[12]?.pressed
    };
    
    // D-pad overrides stick
    if (input.dpadLeft) input.moveX = -1;
    if (input.dpadRight) input.moveX = 1;
    
    return input;
}

// ============ TOUCH CONTROLS ============
function initTouchControls() {
    // Only show on touch devices
    if (!('ontouchstart' in window)) return;
    
    createTouchUI();
}

function createTouchUI() {
    const touchUI = document.createElement('div');
    touchUI.id = 'touch-controls';
    touchUI.innerHTML = `
        <div class="touch-left">
            <button id="touch-left" class="touch-btn">◀</button>
            <button id="touch-right" class="touch-btn">▶</button>
        </div>
        <div class="touch-right">
            <button id="touch-dash" class="touch-btn touch-small">DASH</button>
            <button id="touch-jump" class="touch-btn touch-large">JUMP</button>
        </div>
    `;
    document.getElementById('game-container').appendChild(touchUI);
    
    // Add touch event listeners
    setupTouchButton('touch-left', 'left');
    setupTouchButton('touch-right', 'right');
    setupTouchButton('touch-jump', 'jump');
    setupTouchButton('touch-dash', 'dash');
}

function setupTouchButton(id, action) {
    const btn = document.getElementById(id);
    if (!btn) return;
    
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchControls[action] = true;
        btn.classList.add('active');
        
        if (action === 'jump' && gameState === 'playing') {
            player.jumpBufferTime = performance.now();
        }
        if (action === 'dash' && gameState === 'playing') {
            player.dashBufferTime = performance.now();
        }
        if (action === 'jump' && gameState === 'start') {
            onKeyDown('Space');
        }
    });
    
    btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        touchControls[action] = false;
        btn.classList.remove('active');
    });
    
    btn.addEventListener('touchcancel', (e) => {
        touchControls[action] = false;
        btn.classList.remove('active');
    });
}

// ============ INPUT AGGREGATION ============
function getAggregatedInput() {
    const gamepad = pollGamepad();
    
    let rawX = 0;
    let jump = false;
    let dash = false;
    
    // Keyboard input
    if (isActionPressed('moveLeft')) rawX -= 1;
    if (isActionPressed('moveRight')) rawX += 1;
    jump = isActionPressed('jump');
    dash = isActionPressed('dash');
    
    // Gamepad input (overrides if present)
    if (gamepad) {
        if (Math.abs(gamepad.moveX) > GAMEPAD_MOVE_THRESHOLD || gamepad.dpadLeft || gamepad.dpadRight) {
            rawX = gamepad.moveX;
        }
        jump = jump || gamepad.jump;
        dash = dash || gamepad.dash;
        
        // Handle game state with gamepad
        if (gamepad.start || gamepad.jump) {
            if (gameState === 'start') {
                onKeyDown('Space');
            }
            if (gameState === 'win') {
                onKeyDown('Space');
            }
        }
    }
    
    // Touch input
    if (touchControls.left) rawX -= 1;
    if (touchControls.right) rawX += 1;
    jump = jump || touchControls.jump;
    dash = dash || touchControls.dash;
    
    // Input smoothing (lerp towards target)
    smoothedInput.x += (rawX - smoothedInput.x) * INPUT_SMOOTHING;
    
    // Clamp small values to zero to prevent drift
    if (Math.abs(smoothedInput.x) < 0.01) smoothedInput.x = 0;
    
    return {
        moveX: smoothedInput.x,
        rawMoveX: rawX,
        jump: jump,
        dash: dash
    };
}
