// ============================================================
// CONSTANTS.JS — The Fixed Rules of the Game World
// ============================================================
// Every value here is a "const" — a variable that NEVER changes
// during gameplay. These are the "laws of physics" for Inferno Run.
// Tweaking any single number here changes how the game feels.
// ============================================================


// --- PHYSICS ---

// Gravity pulls the player downward every frame.
// Each frame, the player's vertical speed (vy) increases by this amount.
// Higher = heavier, falls faster. Lower = floaty, falls slower.
// Try changing to 0.3 (moon gravity) or 1.2 (heavy gravity) to feel the difference.
const GRAVITY = 0.6;

// Jump force is NEGATIVE because the screen's Y-axis is flipped:
//   y = 0 is the TOP of the screen
//   y = 600 is the BOTTOM
// So moving UP means DECREASING y. A negative velocity moves the player upward.
// More negative = higher jump. -8 is a small hop. -18 is a huge leap.
const JUMP_FORCE = -13;

// Base movement speed when walking left/right (pixels per frame).
const SPEED = 4;

// The speed LIMIT. No matter how long you hold a direction key,
// the player's horizontal speed will never exceed this value.
// Without a cap, the player would accelerate forever.
// Math used: player.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, player.vx))
//   Math.min picks the smaller of vx and 6 (caps the top end)
//   Math.max picks the larger of vx and -6 (caps the bottom end)
const MAX_SPEED = 6;

// Friction slows the player when they stop pressing a direction key.
// Every frame without input: player.vx *= FRICTION
// Since 0.85 < 1, the speed shrinks each frame:
//   Frame 1: vx = 6.0
//   Frame 2: vx = 6.0 * 0.85 = 5.1
//   Frame 3: vx = 5.1 * 0.85 = 4.3
//   Frame 4: vx = 4.3 * 0.85 = 3.7  ... and so on until nearly 0.
// 1.0 = no friction (ice physics, slide forever)
// 0.0 = instant stop (feels robotic and stiff)
const FRICTION = 0.85;

// "Coyote time" is a beloved game-feel trick named after Wile E. Coyote,
// who runs off cliffs and hangs in the air before looking down and falling.
// After the player walks off a ledge, they can STILL JUMP for 100ms.
// Without this, players would constantly miss jumps at ledge edges
// because they pressed jump 1 frame too late. It feels unfair without it.
// How it works in code:
//   if (performance.now() - player.lastGroundedTime < COYOTE_TIME) { allow jump }
const COYOTE_TIME = 100; // milliseconds

// "Jump buffering" is the opposite of coyote time.
// If the player presses jump slightly BEFORE landing (while still in the air),
// the game remembers the press. When they land within 100ms, the jump fires.
// Without this, players who press jump 2 frames early would feel "my jump didn't work!"
// How it works in code:
//   if (performance.now() - player.jumpBufferTime < JUMP_BUFFER && player.grounded) { jump }
const JUMP_BUFFER = 100; // milliseconds


// --- AIR CONTROL ---
// These create a difference between ground movement and air movement.

// On the ground, pressing a direction adds 0.5 to your speed each frame.
// Snappy and responsive.
const GROUND_ACCELERATION = 0.5;

// In the air, pressing a direction only adds 0.25 per frame — HALF the ground value.
// This makes the player less maneuverable while airborne, which feels more realistic.
// The player must commit to a jump direction rather than freely steering mid-air.
const AIR_ACCELERATION = 0.25;

// In the air, friction is 0.95 instead of 0.85.
// This means the player retains MORE momentum while airborne.
// Ground: lose 15% speed per frame. Air: lose only 5% per frame.
// Combined effect: tight ground control + floaty air movement.
const AIR_FRICTION = 0.95;


// --- DASH ABILITY ---
// The dash is a burst of speed that also grants fire invincibility.

// During a dash, horizontal speed is set to exactly this value.
// 15 pixels/frame vs the normal max of 6 = 2.5x faster than running.
const DASH_SPEED = 15;

// The dash lasts 150ms (about 9 frames at 60fps). During this window:
//   - player.vx is forced to DASH_SPEED * dashDirection
//   - player.vy is forced to 0 (no falling during dash)
//   - fire collisions are ignored (invincibility)
const DASH_DURATION = 150; // milliseconds

// After using a dash, the player must wait 500ms before dashing again.
// This prevents spamming dash to be permanently invincible.
// In code: canDash = (performance.now() - player.lastDashTime) > DASH_COOLDOWN
const DASH_COOLDOWN = 500; // milliseconds


// --- WALL JUMP / WALL SLIDE ---
// When the player is airborne and pressed against a wall, special mechanics activate.

// While wall-sliding, the player falls at this speed instead of accelerating with gravity.
// Normal fall accelerates: 0.6, 1.2, 1.8, 2.4... (gets faster and faster)
// Wall slide is capped at 2 pixels/frame — a slow, controlled descent.
const WALL_SLIDE_SPEED = 2;

// When wall-jumping, the player is launched diagonally away from the wall.
// This horizontal force (8) pushes them AWAY from the wall.
const WALL_JUMP_FORCE_X = 8;

// The vertical force of a wall jump (-12). Slightly weaker than a normal jump (-13).
// Combined with the horizontal push, this creates a diagonal leap.
const WALL_JUMP_FORCE_Y = -12;

// When first touching a wall, the player "sticks" for 150ms before starting to slide.
// This brief pause gives the player time to press jump for a wall-jump.
const WALL_CLING_TIME = 150; // milliseconds


// --- GAMEPAD ---

// Analog sticks on controllers are imprecise. Even when untouched, they might report
// tiny values like 0.03 instead of exactly 0. The deadzone ignores all stick input
// below 15%, preventing "drift" (the player slowly walking without touching the stick).
// After the deadzone, the remaining range (0.15-1.0) is rescaled to (0-1.0)
// so movement starts smoothly from zero, not from 0.15.
const GAMEPAD_DEADZONE = 0.15;

// The player only starts moving when the stick is pushed past 50% of its range.
// This adds an extra layer of protection against accidental input.
const GAMEPAD_MOVE_THRESHOLD = 0.5;


// --- INPUT SMOOTHING ---

// Instead of instantly snapping between -1 (left) and 1 (right), the input value
// gradually transitions using linear interpolation ("lerp"):
//   smoothedInput.x += (rawInput - smoothedInput.x) * INPUT_SMOOTHING
// Each frame, the smoothed value moves 30% closer to the target.
// This prevents jarring direction changes when rapidly tapping keys.
// 0.0 = no smoothing (stuck in place), 1.0 = no smoothing (instant snap)
// 0.3 is a sweet spot for responsive but smooth movement.
const INPUT_SMOOTHING = 0.3;


// --- CANVAS SIZE ---

// The game world is 800 pixels wide and 600 pixels tall.
// All positions (platforms, coins, fires, goal) are defined within this space.
// (0,0) is the top-left corner. (800,600) is the bottom-right corner.
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
