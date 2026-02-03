// Physics constants
const GRAVITY = 0.6;
const JUMP_FORCE = -13;
const SPEED = 4;
const MAX_SPEED = 6;
const FRICTION = 0.85;
const COYOTE_TIME = 100;
const JUMP_BUFFER = 100;

// Air control - reduced acceleration while airborne
const GROUND_ACCELERATION = 0.5;
const AIR_ACCELERATION = 0.25;
const AIR_FRICTION = 0.95;

// Dash ability
const DASH_SPEED = 15;
const DASH_DURATION = 150; // ms
const DASH_COOLDOWN = 500; // ms

// Wall jump/slide
const WALL_SLIDE_SPEED = 2;
const WALL_JUMP_FORCE_X = 8;
const WALL_JUMP_FORCE_Y = -12;
const WALL_CLING_TIME = 150; // ms to stick to wall before sliding

// Gamepad
const GAMEPAD_DEADZONE = 0.15;
const GAMEPAD_MOVE_THRESHOLD = 0.5;

// Input smoothing
const INPUT_SMOOTHING = 0.3;

// Canvas dimensions
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
