// ============================================================
// LEVELS.JS — The Blueprint of Every Stage
// ============================================================
// This file contains NO logic — only DATA.
// It's an array of objects that describe where every platform,
// fire, coin, and goal is placed in each level.
// The game engine reads this data and builds the level from it.
// This separation of DATA from CODE is a key design principle.
// ============================================================


// "const" because the level data never changes at runtime.
// It's a CONSTANT ARRAY of OBJECTS. Each object IS a level.
// Array syntax: [ item1, item2, item3 ]
// Object syntax: { key: value, key: value }
const levels = [

    // ==========================
    // LEVEL 1 — The Tutorial
    // ==========================
    // Teaches: jumping, avoiding fire, collecting coins, reaching the goal.
    // Design: Full ground floor, gentle stepping-stone platforms going up.
    {
        // --- PLATFORMS ---
        // Each platform is an object with: x, y, width, height
        // Coordinate system reminder:
        //   (0, 0) = top-left corner of the screen
        //   x increases going RIGHT
        //   y increases going DOWN (opposite of math class!)
        //   So y=570 is near the BOTTOM of the 600px-tall screen.
        platforms: [
            { x: 0, y: 570, width: 800, height: 30 },     // Full-width ground floor
            { x: 150, y: 480, width: 120, height: 20 },   // Step 1: slightly above ground
            { x: 350, y: 400, width: 120, height: 20 },   // Step 2: higher, shifted right
            { x: 550, y: 320, width: 120, height: 20 },   // Step 3: higher still
            { x: 350, y: 240, width: 120, height: 20 },   // Step 4: back to center
            { x: 100, y: 160, width: 150, height: 20 },   // Step 5: near the top-left
        ],
        // The platforms create a zigzag path upward:
        //   Ground → lower-left → center → right → center → upper-left
        // This teaches the player to look upward for the next platform.

        // --- MOVING PLATFORMS ---
        // These have extra properties beyond static platforms:
        //   startX, endX — the left and right bounds of movement
        //   speed — how many pixels the platform moves per frame
        //   direction — 1 (moving right) or -1 (moving left), flips at bounds
        movingPlatforms: [
            { x: 600, y: 160, width: 100, height: 20, startX: 600, endX: 700, speed: 1, direction: 1 }
            // This platform slides between x=600 and x=700 at speed 1.
            // It's near the goal, teaching timing for the level's final jump.
        ],

        // --- FIRES ---
        // Lethal on contact (unless dashing). Positioned on the ground floor.
        fires: [
            { x: 200, y: 545, width: 100, height: 25 },   // Fire patch 1 (left-center)
            { x: 500, y: 545, width: 80, height: 25 },    // Fire patch 2 (right-center)
        ],
        // y=545 + height=25 = 570, which lines up with the ground at y=570.
        // The fires sit flush on the ground, creating "don't touch" zones.

        // --- COINS ---
        // Each coin only needs x, y. Size is always 20x20 (hardcoded in collision checks).
        // The "collected" and "bob" properties are added dynamically when the level loads.
        coins: [
            { x: 200, y: 450 }, { x: 400, y: 370 }, { x: 600, y: 290 },
            { x: 400, y: 210 }, { x: 160, y: 130 },
        ],
        // Coins are placed near each platform, acting as BREADCRUMBS
        // that guide the player along the intended path upward.

        // --- GOAL ---
        // The exit gate. Touch it to complete the level.
        goal: { x: 730, y: 100, width: 50, height: 60 },
        // Top-right corner. The player climbs from bottom-left to top-right.

        // --- PLAYER START ---
        // Where the player spawns when the level loads or they die and respawn.
        playerStart: { x: 50, y: 500 }
        // Bottom-left, safely on the ground floor.
    },

    // ==========================
    // LEVEL 2 — Gaps and Speed
    // ==========================
    // Teaches: jumping across gaps, faster moving platforms, elevated fire.
    // Design: The ground floor has GAPS. Falling through = death.
    {
        platforms: [
            // The ground is split into THREE sections with deadly gaps between them.
            { x: 0, y: 570, width: 200, height: 30 },     // Left section
            { x: 280, y: 570, width: 240, height: 30 },   // Center section (gap: 280-200=80px)
            { x: 600, y: 570, width: 200, height: 30 },   // Right section (gap: 600-520=80px)

            // Higher platforms — more spread out than Level 1
            { x: 100, y: 470, width: 80, height: 20 },
            { x: 300, y: 450, width: 80, height: 20 },
            { x: 500, y: 430, width: 80, height: 20 },
            { x: 650, y: 350, width: 100, height: 20 },
            { x: 450, y: 280, width: 100, height: 20 },
            { x: 200, y: 220, width: 100, height: 20 },
            { x: 0, y: 140, width: 120, height: 20 },
        ],

        movingPlatforms: [
            // Faster than Level 1's platform (speed 1.5 and 2 vs speed 1)
            { x: 200, y: 380, width: 80, height: 20, startX: 200, endX: 350, speed: 1.5, direction: 1 },
            { x: 350, y: 140, width: 80, height: 20, startX: 350, endX: 500, speed: 2, direction: 1 }
        ],

        fires: [
            { x: 200, y: 545, width: 80, height: 25 },    // Ground fire
            { x: 520, y: 545, width: 80, height: 25 },    // Ground fire
            { x: 680, y: 325, width: 50, height: 25 },    // ELEVATED fire — new!
            // This fire sits on a platform at y=350, teaching that fire can appear ANYWHERE.
        ],

        coins: [
            { x: 130, y: 440 }, { x: 330, y: 420 }, { x: 530, y: 400 },
            { x: 490, y: 250 }, { x: 240, y: 190 }, { x: 50, y: 110 },
        ],
        // 6 coins (1 more than Level 1). More challenge = more reward.

        goal: { x: 550, y: 80, width: 50, height: 60 },
        playerStart: { x: 50, y: 500 }
    },

    // ==========================
    // LEVEL 3 — The Gauntlet
    // ==========================
    // Teaches: precision, patience, mastering all mechanics.
    // Design: Minimal ground, small platforms, maximum fire coverage.
    {
        platforms: [
            // Only 150px of ground! The floor is almost entirely gone.
            { x: 0, y: 570, width: 150, height: 30 },

            // Small platforms (70-80px wide) in a steep climbing path.
            // Compare to Level 1's 120-150px platforms — much less margin for error.
            { x: 250, y: 520, width: 80, height: 20 },
            { x: 400, y: 460, width: 80, height: 20 },
            { x: 550, y: 400, width: 80, height: 20 },
            { x: 700, y: 340, width: 100, height: 20 },
            { x: 550, y: 260, width: 80, height: 20 },
            { x: 350, y: 200, width: 80, height: 20 },
            { x: 150, y: 150, width: 80, height: 20 },
            { x: 0, y: 100, width: 100, height: 20 },
        ],

        movingPlatforms: [
            // Three moving platforms (most of any level), all faster than Level 1.
            { x: 150, y: 480, width: 70, height: 20, startX: 150, endX: 230, speed: 2, direction: 1 },
            { x: 480, y: 340, width: 70, height: 20, startX: 480, endX: 550, speed: 2.5, direction: 1 },
            { x: 250, y: 100, width: 80, height: 20, startX: 250, endX: 400, speed: 1.5, direction: 1 }
            // The last one covers a wide range (150px travel distance), requiring patience.
        ],

        fires: [
            // FIVE fire patches — the most dangerous level.
            // Four of them cover the ground from x=150 to x=700.
            // The ground is essentially a DEATH ZONE.
            { x: 150, y: 545, width: 100, height: 25 },
            { x: 300, y: 545, width: 100, height: 25 },
            { x: 450, y: 545, width: 100, height: 25 },
            { x: 600, y: 545, width: 100, height: 25 },
            { x: 720, y: 315, width: 60, height: 25 },    // Elevated fire near a platform
        ],

        coins: [
            { x: 280, y: 490 }, { x: 430, y: 430 }, { x: 580, y: 370 },
            { x: 740, y: 310 }, { x: 580, y: 230 }, { x: 380, y: 170 }, { x: 180, y: 120 },
        ],
        // 7 coins — highest reward for the hardest level.

        goal: { x: 30, y: 40, width: 50, height: 60 },
        // Top-LEFT corner. The player starts bottom-left, goes RIGHT and UP,
        // then must cross back LEFT at the top. A satisfying full-screen journey.

        playerStart: { x: 50, y: 500 }
    }
];

// ============================================================
// DESIGN PATTERN: Data-Driven Levels
// ============================================================
// Notice that this file has NO functions, NO if statements, NO loops.
// It's pure DATA — just numbers describing where things go.
//
// The game engine (game.js) reads this data and brings it to life.
// This separation has huge benefits:
//
// 1. EASY TO EDIT: Anyone can add a level by copying the pattern
//    and changing numbers. No coding knowledge needed.
//
// 2. EASY TO EXTEND: Want 100 levels? Just add more objects to the array.
//    No code changes needed in the engine.
//
// 3. MODDABLE: Players could edit this file to create custom levels.
//
// 4. TESTABLE: You can validate level data without running the game
//    (e.g., check that all platforms are within canvas bounds).
//
// This pattern is used in nearly every game, from indie to AAA.
// Professional games often use level editors that export this kind of data.
// ============================================================
