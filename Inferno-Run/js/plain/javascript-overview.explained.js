// ============================================================
// JAVASCRIPT OVERVIEW — How the Language Actually Works
// ============================================================
// This file explains JavaScript from the ground up, using examples
// from Inferno Run to show how each concept appears in a real game.
// Read this BEFORE the other .explained.js files.
// ============================================================


// ============================================================
// 1. WHAT IS JAVASCRIPT?
// ============================================================
//
// JavaScript is the programming language of the web browser.
// When you open a webpage, three technologies work together:
//
//   HTML  → The structure (what's on the page: buttons, text, images)
//   CSS   → The style (how it looks: colors, sizes, positions)
//   JS    → The behavior (what it DOES: react to clicks, animate, calculate)
//
// In Inferno Run:
//   index.html creates the <canvas> element (a drawable rectangle)
//   style.css makes it look right (centered, dark background)
//   *.js files make the game WORK (physics, input, rendering)
//
// JavaScript runs TOP TO BOTTOM, one line at a time.
// But it can also respond to EVENTS (key presses, timers, clicks)
// which makes it feel like things happen simultaneously.


// ============================================================
// 2. VARIABLES — Storing Information
// ============================================================
// A variable is a named container that holds a value.
// JavaScript has three ways to create variables:

const GRAVITY = 0.6;    // "const" = constant. Can NEVER be reassigned.
                         // Use for values that shouldn't change.
                         // GRAVITY = 1.0 would throw an error.

let lives = 3;           // "let" = can be reassigned later.
                         // Use for values that WILL change.
                         // lives = 2 is perfectly fine.

var oldStyle = "avoid";  // "var" = the old way (pre-2015). Avoid using it.
                         // It has confusing scoping rules. Always use const or let.

// RULE OF THUMB: Use "const" by default. Switch to "let" only when
// you KNOW the value needs to change. Never use "var".

// --- NAMING CONVENTIONS ---
// camelCase for regular variables:  currentLevel, coinsCollected, playerSpeed
// UPPER_SNAKE_CASE for constants:   GRAVITY, MAX_SPEED, DASH_DURATION
// PascalCase for classes/constructors: Engine, AudioManager


// ============================================================
// 3. DATA TYPES — What Variables Can Hold
// ============================================================

// JavaScript has 7 primitive types + objects:

// --- NUMBERS ---
// JavaScript has ONE number type (no int vs float distinction).
const score = 100;           // Integer (whole number)
const gravity = 0.6;         // Decimal (floating point)
const negative = -13;        // Negative number
// All three are the same type: "number"

// --- STRINGS ---
// Text, wrapped in quotes. Three styles, all equivalent:
const single = 'hello';          // Single quotes
const double = "hello";          // Double quotes
const template = `hello`;        // Backticks (template literal) — the most powerful

// Template literals allow EMBEDDING EXPRESSIONS with ${}:
const level = 3;
const message = `You are on level ${level}`;  // "You are on level 3"
// This is used in the game's UI: `LEVEL: ${currentLevel}`

// --- BOOLEANS ---
// true or false. Used for yes/no decisions.
const isGrounded = true;
const isDashing = false;

// --- NULL and UNDEFINED ---
const empty = null;        // "null" = intentionally empty. "I set this to nothing."
let notYet;                // "undefined" = not yet assigned. "This has no value yet."
// In the game: gamepadIndex = null means "no gamepad connected" (intentional).

// --- TYPEOF ---
// The "typeof" operator tells you a value's type:
// typeof 42         → "number"
// typeof "hello"    → "string"
// typeof true       → "boolean"
// typeof undefined  → "undefined"
// typeof null       → "object"  (this is a famous JS bug from 1995, never fixed)


// ============================================================
// 4. OPERATORS — Doing Things With Values
// ============================================================

// --- MATH ---
const a = 10 + 3;    // 13   Addition
const b = 10 - 3;    // 7    Subtraction
const c = 10 * 3;    // 30   Multiplication
const d = 10 / 3;    // 3.33 Division
const e = 10 % 3;    // 1    Modulo (remainder after division)
                      // Used in the game: levels[(num - 1) % levels.length]
                      // When num=4 and length=3: (4-1) % 3 = 0 → wraps to first level

// --- SHORTHAND ---
let x = 10;
x += 5;    // Same as: x = x + 5    → x is now 15
x -= 3;    // Same as: x = x - 3    → x is now 12
x *= 2;    // Same as: x = x * 2    → x is now 24
x /= 4;    // Same as: x = x / 4    → x is now 6
x++;       // Same as: x = x + 1    → x is now 7
x--;       // Same as: x = x - 1    → x is now 6

// In the game: lives-- (lose a life), currentLevel++ (advance a level),
// player.vx *= FRICTION (slow down), engine.score += 100 (gain points)

// --- COMPARISON (returns true or false) ---
// ===  strict equal (checks value AND type)
// !==  strict not equal
// >    greater than
// <    less than
// >=   greater than or equal
// <=   less than or equal
//
// WARNING: Use === not ==
// ==  does "type coercion" (converts types to match), causing surprises:
//   "5" == 5    → true  (string "5" is converted to number 5)
//   "5" === 5   → false (string is not a number — correct!)

// --- LOGICAL (combining conditions) ---
// &&   AND — both sides must be true
// ||   OR  — at least one side must be true
// !    NOT — flips true↔false
//
// Game example:
// if (player.grounded && engine.justPressed('Space'))
//   → "if the player IS grounded AND the space key WAS just pressed"
//
// jump = jump || gamepad.jump
//   → "jump is true if EITHER keyboard jump OR gamepad jump is pressed"
//
// if (!player.isDashing) killPlayer()
//   → "if the player is NOT dashing, kill them"


// ============================================================
// 5. OBJECTS — Grouping Related Data Together
// ============================================================
// An object is a collection of key-value pairs (properties).
// Think of it as a labeled filing cabinet where each drawer has a name.

const player_example = {
    x: 50,               // Position
    y: 500,
    width: 28,            // Size
    height: 32,
    vx: 0,                // Velocity
    vy: 0,
    grounded: false,      // State flags
    isDashing: false,
    facing: 1             // Direction
};

// ACCESS properties with dot notation or bracket notation:
// player.x          → 50        (dot — most common)
// player["x"]       → 50        (brackets — needed for dynamic keys)
// keys[e.code]      → true/false (bracket, because e.code is a variable)

// MODIFY properties:
// player.x = 100;                // Set to a specific value
// player.vx += 0.5;              // Add to existing value
// player.grounded = true;         // Change a boolean

// NESTED OBJECTS:
const goal_example = { x: 730, y: 100, width: 50, height: 60 };
// This is a flat object. But objects can contain other objects:
const nested = { position: { x: 50, y: 100 }, size: { w: 28, h: 32 } };
// Access: nested.position.x → 50

// SPREAD OPERATOR (...) — copies all properties from one object to another:
const copy = { ...goal_example };
// copy is a NEW object with the same x, y, width, height values.
// Changing copy.x does NOT affect goal_example.x.
// Used in the game: goal = { ...level.goal }


// ============================================================
// 6. ARRAYS (LISTS) — Ordered Collections
// ============================================================
// An array holds multiple values in a numbered sequence.
// Arrays are zero-indexed: the first item is at position 0.

const fruits = ['apple', 'banana', 'cherry'];
// fruits[0] → 'apple'   (first item)
// fruits[1] → 'banana'  (second item)
// fruits[2] → 'cherry'  (third item)
// fruits.length → 3     (how many items)

// --- COMMON ARRAY METHODS ---

// .push(item) — add to the END
fruits.push('date');    // ['apple', 'banana', 'cherry', 'date']

// .pop() — remove from the END (and return it)
fruits.pop();           // returns 'date', array is now ['apple', 'banana', 'cherry']

// .forEach(fn) — do something with EACH item (doesn't create a new array)
fruits.forEach(fruit => {
    // This function runs once for each item.
    // "fruit" is automatically set to the current item.
    console.log(fruit);
});
// Output: 'apple', 'banana', 'cherry'

// .map(fn) — transform each item into something new (creates a NEW array)
const upper = fruits.map(f => f.toUpperCase());
// upper = ['APPLE', 'BANANA', 'CHERRY']
// In the game: coins = level.coins.map(c => ({ ...c, collected: false }))

// .filter(fn) — keep only items that pass a test (creates a NEW array)
const long = fruits.filter(f => f.length > 5);
// long = ['banana', 'cherry'] (only items longer than 5 characters)
// In the game: player.trail = player.trail.filter(t => t.life > 0)

// .some(fn) — returns true if ANY item passes the test
const hasApple = fruits.some(f => f === 'apple');  // true
// In the game: bindings.some(key => keys[key]) checks if ANY bound key is pressed

// .find(fn) — returns the FIRST item that passes the test (or undefined)
const found = fruits.find(f => f.startsWith('b'));  // 'banana'

// --- SPREAD WITH ARRAYS ---
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
const combined = [...arr1, ...arr2];  // [1, 2, 3, 4, 5, 6]
// In the game: [...platforms, ...movingPlatforms] combines both lists for collision checks

// --- DESTRUCTURING ---
const [first, second, third] = fruits;
// first = 'apple', second = 'banana', third = 'cherry'


// ============================================================
// 7. FUNCTIONS — Reusable Blocks of Code
// ============================================================
// A function is a named recipe. Define it once, use it anywhere.

// --- FUNCTION DECLARATION (traditional) ---
function addNumbers(a, b) {
    return a + b;
}
// "a" and "b" are PARAMETERS — placeholders for values.
// "return" sends a value back to the caller.
// addNumbers(3, 4) → 7

// --- ARROW FUNCTION (modern shorthand) ---
const multiply = (a, b) => a * b;
// Same thing, shorter syntax. The result of the expression IS the return value.
// multiply(3, 4) → 12

// When an arrow function has ONE parameter, parentheses are optional:
const double = n => n * 2;      // double(5) → 10

// When the body has MULTIPLE lines, use curly braces + explicit return:
const calculate = (a, b) => {
    const sum = a + b;
    const product = a * b;
    return { sum, product };     // Return an object
};

// --- DEFAULT PARAMETERS ---
function rebindKey(action, newKey, slot = 0) {
    // "slot = 0" means: if no slot is provided, use 0.
    // rebindKey("jump", "KeyJ")     → slot is 0
    // rebindKey("jump", "KeyJ", 2)  → slot is 2
}

// --- CALLBACKS ---
// Functions can be passed as arguments to other functions.
// This is a CALLBACK — "call this function back when you're ready."
//
// In the game, engine.start(setup, update, draw) passes THREE functions
// to the engine. The engine calls them at the right times:
//   setup()  — once at startup
//   update() — every frame for logic
//   draw()   — every frame for rendering
//
// Callbacks are how JavaScript handles asynchronous operations:
//   "I don't know WHEN this will happen, but WHEN it does, run this function."

// --- HIGHER-ORDER FUNCTIONS ---
// A function that takes a function as an argument OR returns a function.
// .forEach(), .map(), .filter(), .some() are all higher-order functions.
// addEventListener('keydown', handleKeyDown) is also one — it stores
// handleKeyDown and calls it later when a key is pressed.


// ============================================================
// 8. CONDITIONALS — Making Decisions
// ============================================================

// --- IF / ELSE IF / ELSE ---
if (lives <= 0) {
    // This block runs ONLY if lives is 0 or less.
    console.log("Game over");
} else if (lives === 1) {
    // This runs ONLY if the first condition was false AND lives is exactly 1.
    console.log("Last life!");
} else {
    // This runs if NONE of the above conditions were true.
    console.log("Keep going");
}

// --- GUARD CLAUSES ---
// An early "return" that exits the function immediately.
// This avoids deep nesting and makes code easier to read.
function processInput(gameState) {
    if (gameState !== 'playing') return;  // Guard: exit early if not playing
    // ... rest of the logic only runs during gameplay
}
// In the game: "if (engine.state !== 'PLAY') return;" at the top of update()

// --- TERNARY OPERATOR ---
// A compact if/else that RETURNS a value.
// condition ? valueIfTrue : valueIfFalse
const status = lives > 0 ? "alive" : "dead";
// If lives > 0, status = "alive". Otherwise, status = "dead".
// In the game: const count = type === 'death' ? 20 : type === 'coin' ? 8 : 3;
// (Nested ternaries — read as: "if death→20, else if coin→8, else→3")

// --- TRUTHY AND FALSY ---
// JavaScript treats some values as "false" even though they're not the boolean false.
// FALSY values: false, 0, "" (empty string), null, undefined, NaN
// TRUTHY values: everything else (including "0", "false", [], {})
//
// This matters in conditions:
// if (gamepadIndex)  → false when gamepadIndex is null OR 0
// if (keys[e.code])  → false when the key is undefined (never pressed)
//
// The "!" operator flips truthy/falsy:
// !null      → true    (null is falsy, flip to true)
// !true      → false
// !"hello"   → false   (non-empty string is truthy, flip to false)
// !0         → true    (0 is falsy, flip to true)


// ============================================================
// 9. LOOPS — Repeating Actions
// ============================================================

// --- FOR LOOP (classic) ---
for (let i = 0; i < 10; i++) {
    // Runs 10 times. i goes: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9.
    // Three parts: initialize; condition; increment
    // The loop continues AS LONG AS the condition is true.
}
// In the game: for(let i=0; i<8; i++) engine.spawnSpark(...)
// Creates 8 spark particles.

// --- WHILE LOOP ---
let count = 5;
while (count > 0) {
    count--;  // MUST modify the condition variable, or infinite loop!
}
// In the game: while (fi--) { ... } loops backward through particles.
// "fi--" returns the current value THEN decrements.
// When fi reaches 0, it returns 0 (falsy), ending the loop.

// --- FOR...OF (modern, for arrays) ---
const items = [10, 20, 30];
for (const item of items) {
    // item = 10, then 20, then 30
    // Cleaner than a classic for loop when you don't need the index.
}

// --- .forEach() (array method) ---
items.forEach((item, index) => {
    // item = the value, index = the position (0, 1, 2)
    // Most common loop style in the game codebase.
});

// --- WHEN TO USE WHICH ---
// .forEach()  → Iterating over an array, no early exit needed
// for loop    → Need the index, or need to break/continue
// while loop  → Unknown number of iterations (keep going until condition fails)
// for...of    → Clean array iteration, supports break/continue


// ============================================================
// 10. SCOPE — Where Variables Live
// ============================================================
//
// SCOPE determines which parts of the code can see a variable.

// --- GLOBAL SCOPE ---
// Variables declared outside any function are GLOBAL.
// Any code anywhere can access them.
// In the game: player, platforms, fires, coins, engine are all global.
// This works fine for small games but becomes problematic in large projects.

// --- FUNCTION SCOPE ---
// Variables declared inside a function are LOCAL to that function.
function exampleScope() {
    const localVar = "only visible inside this function";
    // localVar exists here
}
// localVar does NOT exist out here — it would throw an error.

// --- BLOCK SCOPE (let/const) ---
// Variables declared with let/const inside { } are scoped to that block.
if (true) {
    const blockVar = "only inside this if block";
    let alsoBlockScoped = "same here";
}
// blockVar and alsoBlockScoped don't exist out here.

// This is WHY "var" is avoided. "var" ignores block scope:
if (true) {
    var leaky = "I escape the block!";
}
// "leaky" is accessible here. This causes surprising bugs.


// ============================================================
// 11. THE EVENT SYSTEM — Reacting to Things
// ============================================================
//
// JavaScript in the browser is EVENT-DRIVEN.
// Instead of constantly checking "did the user press a key?",
// we say "when a key is pressed, run this function."
//
// addEventListener(eventName, callbackFunction)
//
// Common events:
//   'keydown'     — a key was pressed
//   'keyup'       — a key was released
//   'click'       — the mouse was clicked
//   'touchstart'  — a finger touched the screen
//   'touchend'    — a finger lifted from the screen
//   'load'        — the page finished loading
//
// How it works behind the scenes:
//   1. Your code registers event listeners.
//   2. The browser maintains an EVENT QUEUE.
//   3. When something happens (key press), the browser adds an event to the queue.
//   4. The browser's EVENT LOOP picks events from the queue and calls your listeners.
//
// This is why JavaScript is called "single-threaded but asynchronous."
// Only one piece of code runs at a time, but events are queued and processed in order.
//
// In the game:
//   window.addEventListener('keydown', handleKeyDown)
//   → "Whenever any key is pressed, call handleKeyDown with the event details."
//   The browser calls handleKeyDown, passing an event object with e.code, e.key, etc.


// ============================================================
// 12. THE GAME LOOP — The Heartbeat of Every Game
// ============================================================
//
// Games don't wait for events. They run a continuous loop:
//
//   function gameLoop() {
//       update();   // Process logic (physics, input, collisions)
//       draw();     // Render everything on screen
//       requestAnimationFrame(gameLoop);  // Schedule the next frame
//   }
//
// requestAnimationFrame(callback):
//   A browser API that says "call this function before the next screen repaint."
//   The screen typically repaints 60 times per second (60 FPS).
//   So update() and draw() each run ~60 times per second.
//
// Why not setInterval(gameLoop, 16)?
//   requestAnimationFrame is smarter:
//   - It pauses when the tab is hidden (saves CPU)
//   - It syncs with the monitor's refresh rate
//   - It provides a timestamp for frame-rate-independent movement
//
// In Inferno Run:
//   engine.start(setup, update, draw) sets up this loop internally.
//   The engine calls setup() once, then alternates update() and draw() forever.
//
// THE FRAME LIFECYCLE:
//   Frame 1: update() moves player by velocity → draw() paints player at new position
//   Frame 2: update() applies gravity, moves again → draw() paints at newer position
//   Frame 3: update() detects collision → draw() shows the result
//   ...60 times per second, this creates smooth, fluid animation.


// ============================================================
// 13. THE CANVAS API — Drawing Graphics
// ============================================================
//
// The <canvas> element is a rectangular area you can draw on with JavaScript.
// It's like a digital whiteboard that you erase and redraw 60 times per second.
//
// SETUP:
//   const canvas = document.getElementById('gameCanvas');
//   const ctx = canvas.getContext('2d');
//   // "ctx" is the rendering context — the object with all drawing methods.
//
// KEY CONCEPT: Canvas has NO memory of what you drew.
// It's just a grid of pixels. Once you draw a rectangle, the canvas doesn't know
// "there's a rectangle there." It just has colored pixels.
// That's why we CLEAR and REDRAW everything every frame.
//
// COMMON DRAWING METHODS:
//
//   ctx.fillStyle = '#ff0000';             // Set fill color (red)
//   ctx.fillRect(x, y, width, height);     // Draw filled rectangle
//
//   ctx.strokeStyle = '#00ff00';            // Set outline color (green)
//   ctx.strokeRect(x, y, width, height);    // Draw rectangle outline
//
//   ctx.beginPath();                        // Start a new shape
//   ctx.arc(x, y, radius, 0, Math.PI*2);   // Define a circle
//   ctx.fill();                             // Fill the circle
//
//   ctx.beginPath();
//   ctx.moveTo(x1, y1);                    // Move pen to start point
//   ctx.lineTo(x2, y2);                    // Draw line to next point
//   ctx.lineTo(x3, y3);                    // Draw line to third point
//   ctx.fill();                            // Fill the triangle
//
//   ctx.fillStyle = '#fff';
//   ctx.font = '16px Arial';
//   ctx.fillText('Hello', x, y);           // Draw text
//
//   ctx.globalAlpha = 0.5;                 // Set transparency (0-1)
//   ctx.shadowBlur = 10;                   // Glow effect radius
//   ctx.shadowColor = '#ff0000';           // Glow color
//
// COORDINATE SYSTEM:
//   (0, 0) is the TOP-LEFT corner.
//   X increases going RIGHT.
//   Y increases going DOWN (opposite of math class!).
//   (800, 600) is the bottom-right of an 800x600 canvas.


// ============================================================
// 14. HOW ALL THE FILES WORK TOGETHER
// ============================================================
//
// JavaScript files in a webpage execute in the order they're listed in HTML.
// In Inferno Run's index.html, the <script> tags load in this order:
//
//   1. constants.js   — Defines GRAVITY, MAX_SPEED, etc. (available to all later files)
//   2. levels.js      — Defines the levels array (needs no dependencies)
//   3. particles.js   — Defines particle functions (needs no dependencies)
//   4. rendering.js   — Defines background rendering (needs no dependencies)
//   5. input.js       — Defines input handling (uses constants from step 1)
//   6. collisions.js  — Defines collision detection (uses player, fires, coins)
//   7. game.js        — The main file: creates the player, loads levels, runs the loop
//
// Because game.js loads LAST, it can use everything defined in files 1-6.
// But files 1-6 can't use things defined in game.js (they load first).
//
// GLOBAL VARIABLES bridge the files:
//   constants.js defines GRAVITY → game.js uses GRAVITY in physics
//   levels.js defines levels[] → game.js reads levels[] to load stages
//   game.js defines player → collisions.js reads player position
//
// In modern JavaScript (ES Modules), you'd use import/export instead of globals.
// But for small games, globals work fine and keep things simple.
//
//
// THE EXECUTION FLOW:
//
//   Browser loads index.html
//     ↓
//   Browser finds <script> tags, loads .js files in order
//     ↓
//   constants.js, levels.js, etc. run top-to-bottom, defining variables and functions
//     ↓
//   game.js runs last:
//     1. Creates the Engine
//     2. Calls engine.start(setup, update, draw)
//         ↓
//     3. Engine calls setup() once
//         → setup() calls loadLevel(1)
//         → Level data is copied into platforms, fires, coins, goal
//         → Player is placed at the starting position
//         ↓
//     4. Engine begins the game loop (requestAnimationFrame)
//         ↓
//     5. Every frame (~16ms):
//         → Engine reads input (keyboard, gamepad, touch)
//         → Engine calls update(dt)
//             → Dash logic runs
//             → Player movement + gravity runs
//             → Collision detection runs (platforms, fire, coins, goal)
//             → Moving platforms update
//             → Boundary checks run
//         → Engine calls draw()
//             → Canvas is cleared
//             → Background, platforms, fires, coins are drawn
//             → Player is drawn
//             → Particles are drawn
//             → UI (score, lives, level) is drawn
//         → requestAnimationFrame schedules the next frame
//         ↓
//     6. Repeat step 5 forever (or until the tab is closed)


// ============================================================
// 15. COMMON PATTERNS USED IN THIS GAME
// ============================================================

// --- PATTERN: State Machine ---
// The game has discrete states: 'MENU', 'PLAY', 'GAMEOVER'.
// Different code runs depending on the current state.
// update() only processes physics during 'PLAY'.
// draw() shows different overlays for 'MENU' vs 'GAMEOVER'.
// State transitions happen on specific events:
//   MENU → PLAY:     player presses Space
//   PLAY → GAMEOVER: player loses all lives OR completes all levels
//   GAMEOVER → PLAY: player presses Space (restarts)

// --- PATTERN: Entity-Component ---
// Every game object (platform, fire, coin, player) is a plain object
// with position (x, y), size (width, height), and type-specific properties.
// They're stored in arrays and processed with forEach loops.
// This is a simplified version of the Entity-Component pattern used in
// professional game engines like Unity and Unreal.

// --- PATTERN: Separation of Concerns ---
// Each .js file has ONE job:
//   constants.js  → configuration values
//   levels.js     → level layout data
//   input.js      → reading player input
//   collisions.js → detecting overlaps
//   particles.js  → visual effects
//   rendering.js  → background graphics
//   game.js       → tying everything together
// This makes the codebase easier to understand, debug, and modify.

// --- PATTERN: Deep Copy for Resettable State ---
// Level data is deep-copied when loading a level.
// The original data stays pristine so levels can be replayed.
// JSON.parse(JSON.stringify(data)) is the quick-and-dirty deep copy method.

// --- PATTERN: Swap-and-Pop for Fast Array Removal ---
// When removing items from a large array during iteration:
//   Slow: array.splice(index, 1)           — O(n), shifts all elements
//   Fast: array[i] = array[last]; array.pop() — O(1), instant
// Used in particles.js where hundreds of particles may need removal per frame.

// --- PATTERN: Delta Time ---
// The update function receives "dt" (time since last frame in milliseconds).
// Multiplying movement by dt makes the game run at the same speed
// regardless of frame rate. Without it:
//   60 FPS: player moves 6px × 60 = 360px per second
//   30 FPS: player moves 6px × 30 = 180px per second (HALF speed!)
// With dt: player moves 6 * dt pixels per frame, which totals the same per second.
// (This game uses fixed-step physics so dt isn't heavily used, but the concept matters.)


// ============================================================
// 16. JAVASCRIPT QUIRKS TO KNOW
// ============================================================

// --- typeof null === "object" ---
// This is a bug from JavaScript's first implementation in 1995.
// null SHOULD return "null" but returns "object" instead. Never fixed.

// --- Floating Point Math ---
// 0.1 + 0.2 === 0.30000000000000004  (not 0.3!)
// Computers store decimals in binary, which can't perfectly represent
// some base-10 fractions. This rarely matters in games but is
// important for financial calculations.

// --- === vs == ---
// Always use === (strict equality). == does type coercion:
// "" == false   → true  (WAT?)
// [] == false   → true  (WAT?)
// "" == []      → true  (WAT?!)
// These all make sense when you understand the coercion rules,
// but === avoids the confusion entirely.

// --- Semicolons ---
// JavaScript can usually guess where you meant to put semicolons.
// But sometimes it guesses wrong. Most codebases use them explicitly.
// The game uses semicolons after every statement.

// --- "this" keyword ---
// The meaning of "this" depends on HOW a function is called, not where it's defined.
// Arrow functions inherit "this" from their parent scope.
// Regular functions get "this" from the call site.
// In the game, arrow functions in forEach/map/filter avoid "this" confusion.


// ============================================================
// SUMMARY: THE BIG PICTURE
// ============================================================
//
// JavaScript is a language that:
//   1. Runs in the browser (no installation needed)
//   2. Is event-driven (responds to user actions)
//   3. Uses the Canvas API for graphics (draw shapes, text, images)
//   4. Has a game loop that updates and draws 60 times per second
//   5. Stores data in variables, objects, and arrays
//   6. Makes decisions with if/else and comparisons
//   7. Repeats actions with loops (for, while, forEach)
//   8. Organizes code into reusable functions
//   9. Splits responsibilities across multiple files
//
// Every line of code in Inferno Run uses these concepts.
// Start with constants.explained.js (simplest),
// then levels.explained.js (data structures),
// then rendering.explained.js (canvas drawing),
// then particles.explained.js (arrays and loops),
// then input.explained.js (events and callbacks),
// then collisions.explained.js (conditionals and math),
// then game.explained.js (putting it all together).
