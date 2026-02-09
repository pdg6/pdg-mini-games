const engine = new Engine('gameCanvas');
engine.gameName = 'pixel-puzzle';
engine.loadHighScore();

const levels = [
    { map: ["XXXXXX","X P  X","X B  X","X  G X","XXXXXX"] },
    { map: ["XXXXXX","X P  X","X B X","X   X","XXGXXX"] },
    { map: ["XXXXXXXX","X  P   X","X XXX  X","X B    X","X    G X","XXXXXXXX"] },
    { map: ["XXXXXXXX","X P    X","X XXXX X","X B    X","X   XXXX","XXXG   X","XXXXXXXX"] },
    { map: ["XXXXXXXXX","X    P  X","XX XXX  X","X  B    X","X XXX X X","X     G X","XXXXXXXXX"] },
    { map: ["XXXXXXXXXX","X    P   X","X  XXXXX X","X  B     X","X XXXX X X","X      X X","XXXXXXGX X","X        X","XXXXXXXXXX"] }
];
let levelIndex = 0;
let grid = [];
let player = {x:0, y:0};
let box = {x:0, y:0};
let goal = {x:0, y:0};
let moves = 0;
let moveHistory = [];
const TILE = 50;
let OFFSET_X = 200;
let OFFSET_Y = 150;

function loadLevel(idx) {
    if (idx >= levels.length) { idx = 0; engine.score += 1000; }
    levelIndex = idx;
    const map = levels[idx].map;
    grid = [];
    for(let y=0; y<map.length; y++) {
        let row = [];
        for(let x=0; x<map[y].length; x++) {
            let char = map[y][x];
            if (char === 'P') { player = {x,y}; char = ' '; }
            if (char === 'B') { box = {x,y}; char = ' '; }
            if (char === 'G') { goal = {x,y}; char = ' '; }
            row.push(char);
        }
        grid.push(row);
    }
    moves = 0;
    moveHistory = [];
    // Center the level
    OFFSET_X = Math.floor((800 - grid[0].length * TILE) / 2);
    OFFSET_Y = Math.floor((600 - grid.length * TILE) / 2);
}

function drawBlock3D(ctx, x, y, size, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    ctx.strokeRect(x, y, size, size);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(x, y, size, size/2);
}

engine.start(() => { loadLevel(0); }, (dt) => {
    let dx = 0, dy = 0;
    if (engine.justPressed('ArrowUp') || engine.justPressed('KeyW')) { dy = -1; }
    else if (engine.justPressed('ArrowDown') || engine.justPressed('KeyS')) { dy = 1; }
    else if (engine.justPressed('ArrowLeft') || engine.justPressed('KeyA')) { dx = -1; }
    else if (engine.justPressed('ArrowRight') || engine.justPressed('KeyD')) { dx = 1; }
    
    // Undo with Z
    if (engine.justPressed('KeyZ') && moveHistory.length > 0) {
        const prev = moveHistory.pop();
        player.x = prev.px; player.y = prev.py;
        box.x = prev.bx; box.y = prev.by;
        moves--;
        return;
    }
    
    // Restart level with R
    if (engine.justPressed('KeyR')) {
        loadLevel(levelIndex);
        return;
    }
    
    if (dx === 0 && dy === 0) return;

    let nx = player.x + dx, ny = player.y + dy;
    
    // Bounds check
    if (ny < 0 || ny >= grid.length || nx < 0 || nx >= grid[ny].length) return;
    if (grid[ny][nx] === 'X') return;
    
    // Save state for undo
    const prevState = { px: player.x, py: player.y, bx: box.x, by: box.y };
    
    if (nx === box.x && ny === box.y) {
        let bx = box.x + dx, by = box.y + dy;
        // Bounds check for box
        if (by < 0 || by >= grid.length || bx < 0 || bx >= grid[by].length) return;
        if (grid[by][bx] !== 'X') {
            moveHistory.push(prevState);
            box.x = bx; box.y = by;
            player.x = nx; player.y = ny;
            moves++;
            if (box.x === goal.x && box.y === goal.y) {
                engine.score += Math.max(10, 200 - moves * 5);
                engine.spawnParticle(OFFSET_X + box.x*TILE + 25, OFFSET_Y + box.y*TILE + 25, '#00ff00', 20);
                setTimeout(() => loadLevel(levelIndex + 1), 500);
            }
        }
    } else {
        moveHistory.push(prevState);
        player.x = nx; player.y = ny;
        moves++;
    }
}, (ctx) => {
    // Draw Grid
    for(let y=0; y<grid.length; y++) {
        for(let x=0; x<grid[y].length; x++) {
            let px = OFFSET_X + x * TILE;
            let py = OFFSET_Y + y * TILE;
            if (grid[y][x] === 'X') {
                drawBlock3D(ctx, px, py, TILE, '#555');
            } else {
                ctx.fillStyle = '#111';
                ctx.fillRect(px, py, TILE, TILE);
                ctx.strokeStyle = '#222';
                ctx.strokeRect(px, py, TILE, TILE);
            }
        }
    }
    // Goal
    let gx = OFFSET_X + goal.x * TILE;
    let gy = OFFSET_Y + goal.y * TILE;
    ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
    ctx.fillRect(gx+5, gy+5, TILE-10, TILE-10);
    ctx.strokeStyle = '#00ff00';
    ctx.setLineDash([5, 5]);
    ctx.lineDashOffset = -engine.lastTime / 10;
    ctx.strokeRect(gx+5, gy+5, TILE-10, TILE-10);
    ctx.setLineDash([]);

    // Box
    let boxOnGoal = box.x === goal.x && box.y === goal.y;
    drawBlock3D(ctx, OFFSET_X + box.x*TILE+2, OFFSET_Y + box.y*TILE+2, TILE-4, boxOnGoal ? '#00ff00' : '#ff00ff');
    
    // Player - Robot Face
    let px = OFFSET_X + player.x * TILE;
    let py = OFFSET_Y + player.y * TILE;
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.roundRect(px + 5, py + 5, TILE - 10, TILE - 10, 10);
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(px + 15, py + 18, 5, 8);
    ctx.fillRect(px + 30, py + 18, 5, 8);
    
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'left';
    ctx.fillText('LEVEL ' + (levelIndex + 1) + '/' + levels.length, 20, 30);
    ctx.fillText('MOVES: ' + moves, 20, 50);
    ctx.fillStyle = '#666';
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText('Z=UNDO  R=RESTART', 20, 590);
});
