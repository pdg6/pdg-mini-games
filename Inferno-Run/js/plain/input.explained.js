// ============================================================
// INPUT.JS — How the Game Listens to the Player
// ============================================================
// This file handles ALL player input: keyboard, gamepad, and touch.
// It translates physical button presses into game actions.
// The key insight: the game never checks individual keys directly.
// Instead, it checks "actions" like "jump" or "dash" that can be
// bound to ANY key. This makes controls customizable.
// ============================================================


// --- STATE TRACKING ---

// An object used as a dictionary/map. Every key code becomes a property.
// When the spacebar is held down: keys["Space"] = true
// When released: keys["Space"] = false
// This lets the game check any key's current state at any time.
// JavaScript objects can use any string as a property name,
// making them perfect for key-code lookups.
const keys = {};

// The smoothed directional input. Instead of snapping instantly from 0 to 1,
// this gradually moves toward the target using linear interpolation (lerp).
// x: horizontal input (-1 = left, 0 = none, 1 = right)
// y: vertical input (not currently used but available for future features)
const smoothedInput = { x: 0, y: 0 };

// Which gamepad is connected. null = no gamepad.
// Browsers assign each gamepad an index (0, 1, 2...) when plugged in.
// "let" is used instead of "const" because this value CHANGES when
// gamepads connect or disconnect.
let gamepadIndex = null;

// Tracks which virtual touch buttons are being pressed on mobile.
// Each property is a boolean: true = finger is on that button, false = not.
let touchControls = { left: false, right: false, jump: false, dash: false };


// --- KEY BINDINGS ---
// Maps game actions to lists of keyboard key codes.
// Using an array (list) per action allows MULTIPLE keys for the same action.
// For example, "jump" can be triggered by Space, ArrowUp, OR W.

let keyBindings = {
    moveLeft: ['ArrowLeft', 'KeyA'],          // Arrow key OR WASD
    moveRight: ['ArrowRight', 'KeyD'],
    jump: ['Space', 'ArrowUp', 'KeyW'],       // 3 keys for jump!
    dash: ['ShiftLeft', 'ShiftRight', 'KeyE'] // Either shift or E
};
// Why "let" instead of "const"? Because the entire object gets REPLACED
// when loading saved bindings. "const" would prevent that reassignment.
// Note: even with "const", you CAN modify properties inside an object —
// "const" only prevents reassigning the variable itself.


// --- PERSISTENCE: Saving and Loading Bindings ---

// Load custom key bindings from the browser's localStorage.
// localStorage persists even after closing the browser — it's saved to disk.
function loadKeyBindings() {
    // localStorage.getItem returns a STRING or null if the key doesn't exist.
    const saved = localStorage.getItem('infernoRunKeyBindings');

    if (saved) {
        // "try...catch" handles errors gracefully.
        // If the saved data is corrupted (invalid JSON), the game won't crash.
        // Instead, it silently falls back to the default bindings.
        try {
            // JSON.parse converts a JSON string back into a JavaScript object.
            // Example: '{"jump":["KeyJ"]}' → { jump: ["KeyJ"] }
            keyBindings = JSON.parse(saved);
        } catch (e) {
            // "e" is the error object. We log a warning but keep running.
            console.warn('Failed to load key bindings');
        }
    }
}

// Save current bindings to localStorage so they survive page reloads.
function saveKeyBindings() {
    // JSON.stringify converts a JavaScript object into a JSON string.
    // This is the reverse of JSON.parse above.
    localStorage.setItem('infernoRunKeyBindings', JSON.stringify(keyBindings));
}


// --- REBINDING ---

// Change one of the keys bound to an action.
// Parameters:
//   action: string — which action to modify (e.g., "jump")
//   newKey: string — the new key code (e.g., "KeyJ")
//   slot: number — which position in the array to replace (default: 0 = primary key)
// The "= 0" is a DEFAULT PARAMETER. If you call rebindKey("jump", "KeyJ"),
// slot automatically becomes 0.
function rebindKey(action, newKey, slot = 0) {
    // Guard clause: if the action doesn't exist, do nothing.
    // This prevents crashes if someone passes an invalid action name.
    if (keyBindings[action]) {
        // Array bracket notation: access and modify a specific index.
        // keyBindings["jump"][0] = "KeyJ" would make J the primary jump key.
        keyBindings[action][slot] = newKey;
        saveKeyBindings();
    }
}


// --- ACTION CHECKING ---

// Check if ANY key bound to an action is currently pressed.
// This is the function the game calls — never raw key checks.
// Returns: true or false (a boolean).
function isActionPressed(action) {
    const bindings = keyBindings[action]; // Get the array of key codes
    if (!bindings) return false;          // If action doesn't exist, return false

    // .some() is an array method that returns true if ANY element passes the test.
    // It takes a callback function (an arrow function here: key => keys[key]).
    // For each key code in the bindings array, it checks if keys[key] is true.
    // As soon as one matches, it stops checking (short-circuit evaluation).
    // This is more efficient than checking every key when you only need one match.
    return bindings.some(key => keys[key]);
}


// --- INITIALIZATION ---

// Set up all input listeners. Called ONCE when the game starts.
// "Event listeners" are functions the browser calls when something happens.
function initInput() {
    loadKeyBindings();

    // addEventListener attaches a function to a browser event.
    // 'keydown' fires when ANY key is pressed.
    // 'keyup' fires when ANY key is released.
    // The browser passes an Event object to the handler function.
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);
    initTouchControls();
}


// --- KEYBOARD EVENT HANDLERS ---

function handleKeyDown(e) {
    // "e" is the KeyboardEvent object provided by the browser.
    // e.code is the PHYSICAL key location (e.g., "Space", "KeyA", "ArrowLeft").
    // e.code is better than e.key for games because it doesn't change with
    // keyboard layout (QWERTY vs AZERTY).

    // Prevent the browser's DEFAULT behavior for game keys.
    // Without this, pressing Space scrolls the page, and arrows scroll too.
    // e.code.startsWith('Arrow') checks if the string begins with "Arrow"
    // — matching ArrowUp, ArrowDown, ArrowLeft, ArrowRight.
    if (e.code === 'Space' || e.code.startsWith('Arrow')) {
        e.preventDefault();
    }

    // Mark this key as "pressed" in our keys dictionary.
    // Using bracket notation because e.code is a dynamic string.
    // keys.Space wouldn't work if the key name has special characters.
    keys[e.code] = true;

    // "typeof" checks the type of a variable. If onKeyDown is defined as
    // a function elsewhere, call it. This is a CALLBACK pattern — other parts
    // of the game can define onKeyDown to react to key presses.
    if (typeof onKeyDown === 'function') {
        onKeyDown(e.code);
    }

    // JUMP BUFFER: Record WHEN the jump key was pressed.
    // performance.now() returns a high-precision timestamp in milliseconds.
    // Later, when the player lands, the game checks:
    //   "Was jump pressed within the last 100ms? If so, jump immediately."
    if (isActionPressed('jump') && gameState === 'playing') {
        player.jumpBufferTime = performance.now();
    }

    // DASH BUFFER: Same concept for dashing.
    if (isActionPressed('dash') && gameState === 'playing') {
        player.dashBufferTime = performance.now();
    }
}

function handleKeyUp(e) {
    // Simply mark the key as released. That's all we need.
    keys[e.code] = false;
}


// ============================================================
// GAMEPAD SUPPORT
// ============================================================

function handleGamepadConnected(e) {
    // e.gamepad is the Gamepad object with id, index, buttons, axes.
    console.log('Gamepad connected:', e.gamepad.id);
    gamepadIndex = e.gamepad.index;
}

function handleGamepadDisconnected(e) {
    console.log('Gamepad disconnected');
    // Only clear our stored index if it matches the disconnected gamepad.
    // This matters when multiple gamepads are connected.
    if (gamepadIndex === e.gamepad.index) {
        gamepadIndex = null;
    }
}

// Filter out tiny accidental stick movements (stick "drift").
// Raw input: -1.0 (full left) to 1.0 (full right), with 0 = centered.
// But sticks are never perfectly centered — they might read 0.02 at rest.
function applyDeadzone(value) {
    // Math.abs() returns the absolute value (removes the negative sign).
    // If the stick is barely moved (within the deadzone), treat it as zero.
    if (Math.abs(value) < GAMEPAD_DEADZONE) return 0;

    // Rescale so that the output smoothly starts from 0 after the deadzone.
    // Without rescaling, there'd be a sudden jump from 0 to 0.15.
    // Math.sign() returns -1, 0, or 1 to preserve the direction.
    const sign = Math.sign(value);
    return sign * (Math.abs(value) - GAMEPAD_DEADZONE) / (1 - GAMEPAD_DEADZONE);
    // Example: if value = 0.6 and deadzone = 0.15:
    //   (0.6 - 0.15) / (1 - 0.15) = 0.45 / 0.85 ≈ 0.53
}

// Read the current state of the connected gamepad.
// Unlike keyboard events (which push data to us), gamepads must be POLLED.
// We have to actively ask "what are the buttons doing right now?" each frame.
function pollGamepad() {
    if (gamepadIndex === null) return null; // No gamepad connected

    // navigator.getGamepads() returns an array of all connected gamepads.
    // We access ours by its stored index.
    const gamepads = navigator.getGamepads();
    const gp = gamepads[gamepadIndex];
    if (!gp) return null; // Gamepad disconnected between frames

    // Build an input object from the gamepad's current state.
    const input = {
        // gp.axes[0] = left stick horizontal: -1 (left) to 1 (right)
        // gp.axes[1] = left stick vertical: -1 (up) to 1 (down)
        moveX: applyDeadzone(gp.axes[0]),
        moveY: applyDeadzone(gp.axes[1]),

        // gp.buttons[n].pressed = true/false
        // The "?." is OPTIONAL CHAINING — if gp.buttons[0] is undefined,
        // it returns undefined instead of crashing with "Cannot read property 'pressed'".
        // "||" means OR — either button triggers the action.
        jump: gp.buttons[0]?.pressed || gp.buttons[1]?.pressed, // A or B button
        dash: gp.buttons[2]?.pressed || gp.buttons[4]?.pressed || gp.buttons[5]?.pressed, // X or shoulder bumpers
        start: gp.buttons[9]?.pressed,  // Start/Menu button

        // D-pad buttons (indices 12-15 are standard for most gamepads)
        dpadLeft: gp.buttons[14]?.pressed,
        dpadRight: gp.buttons[15]?.pressed,
        dpadUp: gp.buttons[12]?.pressed
    };

    // D-pad OVERRIDES the analog stick.
    // If the player presses D-pad left, moveX becomes exactly -1
    // regardless of what the analog stick reads.
    if (input.dpadLeft) input.moveX = -1;
    if (input.dpadRight) input.moveX = 1;

    return input;
}


// ============================================================
// TOUCH CONTROLS (Mobile)
// ============================================================

function initTouchControls() {
    // 'ontouchstart' only exists on touch-capable devices.
    // The "in" operator checks if a property exists on an object.
    // On a desktop browser, this is false → no touch buttons appear.
    if (!('ontouchstart' in window)) return;

    createTouchUI();
}

function createTouchUI() {
    // document.createElement creates a new HTML element in memory.
    const touchUI = document.createElement('div');
    touchUI.id = 'touch-controls';

    // Template literals (backtick strings) allow multi-line strings and ${expressions}.
    // This creates the HTML structure for left/right arrows and jump/dash buttons.
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

    // Append the new element to the game container (makes it visible on screen).
    document.getElementById('game-container').appendChild(touchUI);

    // Wire up each button to its corresponding action.
    setupTouchButton('touch-left', 'left');
    setupTouchButton('touch-right', 'right');
    setupTouchButton('touch-jump', 'jump');
    setupTouchButton('touch-dash', 'dash');
}

// Connect a touch button element to a game action.
function setupTouchButton(id, action) {
    const btn = document.getElementById(id);
    if (!btn) return; // Guard clause: button doesn't exist

    // Touch events are different from mouse events.
    // touchstart = finger placed on screen
    // touchend   = finger lifted from screen
    // touchcancel = touch interrupted (phone call, notification)

    btn.addEventListener('touchstart', (e) => {
        // Arrow function: (e) => { ... } is shorthand for function(e) { ... }
        // Arrow functions also inherit "this" from their parent scope.

        e.preventDefault(); // Prevent the browser from also firing a mouse click event

        touchControls[action] = true;        // Mark action as active
        btn.classList.add('active');          // Add CSS class for visual feedback

        // Same jump/dash buffering as keyboard input
        if (action === 'jump' && gameState === 'playing') {
            player.jumpBufferTime = performance.now();
        }
        if (action === 'dash' && gameState === 'playing') {
            player.dashBufferTime = performance.now();
        }
        // Allow starting the game from the title screen by tapping jump
        if (action === 'jump' && gameState === 'start') {
            onKeyDown('Space');
        }
    });

    btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        touchControls[action] = false;       // Mark action as inactive
        btn.classList.remove('active');       // Remove visual feedback
    });

    btn.addEventListener('touchcancel', (e) => {
        // touchcancel fires when the OS interrupts the touch (e.g., incoming call).
        // Always clean up to prevent stuck buttons.
        touchControls[action] = false;
        btn.classList.remove('active');
    });
}


// ============================================================
// INPUT AGGREGATION — The Most Important Function in This File
// ============================================================
// This is the ONLY function the game loop calls to get player input.
// It combines keyboard + gamepad + touch into one clean result object.
// The game never needs to know WHICH device the player is using.

function getAggregatedInput() {
    const gamepad = pollGamepad(); // Read gamepad (returns null if none)

    // Start with zero input and build up from all sources.
    let rawX = 0;      // Horizontal direction: -1, 0, or 1
    let jump = false;   // Is jump being requested?
    let dash = false;   // Is dash being requested?

    // --- Layer 1: Keyboard ---
    if (isActionPressed('moveLeft')) rawX -= 1;  // Subtract 1 = go left
    if (isActionPressed('moveRight')) rawX += 1;  // Add 1 = go right
    // If BOTH are held, they cancel out: -1 + 1 = 0 (no movement)
    jump = isActionPressed('jump');
    dash = isActionPressed('dash');

    // --- Layer 2: Gamepad (overrides keyboard if active) ---
    if (gamepad) {
        // Only use gamepad movement if the stick is pushed far enough
        // OR a D-pad button is pressed.
        if (Math.abs(gamepad.moveX) > GAMEPAD_MOVE_THRESHOLD || gamepad.dpadLeft || gamepad.dpadRight) {
            rawX = gamepad.moveX; // Analog value, not just -1/0/1
        }
        // "||" (OR) means: keep existing jump/dash if already true from keyboard.
        // This allows keyboard and gamepad to work simultaneously.
        jump = jump || gamepad.jump;
        dash = dash || gamepad.dash;

        // Let the gamepad start/restart the game from menu screens
        if (gamepad.start || gamepad.jump) {
            if (gameState === 'start') onKeyDown('Space');
            if (gameState === 'win') onKeyDown('Space');
        }
    }

    // --- Layer 3: Touch (adds to existing input) ---
    if (touchControls.left) rawX -= 1;
    if (touchControls.right) rawX += 1;
    jump = jump || touchControls.jump;
    dash = dash || touchControls.dash;

    // --- Input Smoothing (lerp) ---
    // Linear interpolation: move 30% of the way toward the target each frame.
    // Formula: current += (target - current) * rate
    // This creates smooth acceleration/deceleration of input.
    smoothedInput.x += (rawX - smoothedInput.x) * INPUT_SMOOTHING;

    // Clamp tiny values to zero to prevent the player from drifting
    // when smoothedInput is something like 0.003 (close to zero but not quite).
    if (Math.abs(smoothedInput.x) < 0.01) smoothedInput.x = 0;

    // Return a clean object with everything the game needs.
    // The game loop uses this return value to control the player.
    return {
        moveX: smoothedInput.x,  // Smoothed value (gradual transitions)
        rawMoveX: rawX,          // Raw value (instant, for direction checks)
        jump: jump,              // Boolean: should the player jump?
        dash: dash               // Boolean: should the player dash?
    };
}
