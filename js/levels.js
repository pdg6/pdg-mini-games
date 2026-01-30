// Level Data
const levels = [
    {
        platforms: [
            { x: 0, y: 570, width: 800, height: 30 },
            { x: 150, y: 480, width: 120, height: 20 },
            { x: 350, y: 400, width: 120, height: 20 },
            { x: 550, y: 320, width: 120, height: 20 },
            { x: 350, y: 240, width: 120, height: 20 },
            { x: 100, y: 160, width: 150, height: 20 },
        ],
        movingPlatforms: [
            { x: 600, y: 160, width: 100, height: 20, startX: 600, endX: 700, speed: 1, direction: 1 }
        ],
        fires: [
            { x: 200, y: 545, width: 100, height: 25 },
            { x: 500, y: 545, width: 80, height: 25 },
        ],
        coins: [
            { x: 200, y: 450 }, { x: 400, y: 370 }, { x: 600, y: 290 },
            { x: 400, y: 210 }, { x: 160, y: 130 },
        ],
        goal: { x: 730, y: 100, width: 50, height: 60 },
        playerStart: { x: 50, y: 500 }
    },
    {
        platforms: [
            { x: 0, y: 570, width: 200, height: 30 },
            { x: 280, y: 570, width: 240, height: 30 },
            { x: 600, y: 570, width: 200, height: 30 },
            { x: 100, y: 470, width: 80, height: 20 },
            { x: 300, y: 450, width: 80, height: 20 },
            { x: 500, y: 430, width: 80, height: 20 },
            { x: 650, y: 350, width: 100, height: 20 },
            { x: 450, y: 280, width: 100, height: 20 },
            { x: 200, y: 220, width: 100, height: 20 },
            { x: 0, y: 140, width: 120, height: 20 },
        ],
        movingPlatforms: [
            { x: 200, y: 380, width: 80, height: 20, startX: 200, endX: 350, speed: 1.5, direction: 1 },
            { x: 350, y: 140, width: 80, height: 20, startX: 350, endX: 500, speed: 2, direction: 1 }
        ],
        fires: [
            { x: 200, y: 545, width: 80, height: 25 },
            { x: 520, y: 545, width: 80, height: 25 },
            { x: 680, y: 325, width: 50, height: 25 },
        ],
        coins: [
            { x: 130, y: 440 }, { x: 330, y: 420 }, { x: 530, y: 400 },
            { x: 490, y: 250 }, { x: 240, y: 190 }, { x: 50, y: 110 },
        ],
        goal: { x: 550, y: 80, width: 50, height: 60 },
        playerStart: { x: 50, y: 500 }
    },
    {
        platforms: [
            { x: 0, y: 570, width: 150, height: 30 },
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
            { x: 150, y: 480, width: 70, height: 20, startX: 150, endX: 230, speed: 2, direction: 1 },
            { x: 480, y: 340, width: 70, height: 20, startX: 480, endX: 550, speed: 2.5, direction: 1 },
            { x: 250, y: 100, width: 80, height: 20, startX: 250, endX: 400, speed: 1.5, direction: 1 }
        ],
        fires: [
            { x: 150, y: 545, width: 100, height: 25 },
            { x: 300, y: 545, width: 100, height: 25 },
            { x: 450, y: 545, width: 100, height: 25 },
            { x: 600, y: 545, width: 100, height: 25 },
            { x: 720, y: 315, width: 60, height: 25 },
        ],
        coins: [
            { x: 280, y: 490 }, { x: 430, y: 430 }, { x: 580, y: 370 },
            { x: 740, y: 310 }, { x: 580, y: 230 }, { x: 380, y: 170 }, { x: 180, y: 120 },
        ],
        goal: { x: 30, y: 40, width: 50, height: 60 },
        playerStart: { x: 50, y: 500 }
    }
];
