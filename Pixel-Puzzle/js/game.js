const engine = new Engine('gameCanvas');
const levels = [
    { map: ["XXXXXX","X P  X","X B  X","X  G X","XXXXXX"] },
    { map: ["XXXXXX","X P  X","X B X","X   X","XXGXXX"] },
    { map: ["XXXXXXXX","X  P   X","X XXX  X","X B    X","X    G X","XXXXXXXX"] }
];
let levelIndex = 0;
let grid = [];
let player = {x:0, y:0};
let box = {x:0, y:0};
let goal = {x:0, y:0};
const TILE = 50;
const OFFSET_X = 200;
const OFFSET_Y = 150;

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
}

function drawBlock3D(ctx, x, y, size, color, topColor) {
    // Front face
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);
    // Bevel
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    ctx.strokeRect(x, y, size, size);
    
    // Top Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(x, y, size, size/2);
}

engine.start(() => { loadLevel(0); }, (dt) => {
    let dx = 0, dy = 0;
    if (engine.isDown('ArrowUp') && !engine.keysPressed['ArrowUp']) { dy = -1; engine.keysPressed['ArrowUp'] = true; }
    else if (engine.isDown('ArrowDown') && !engine.keysPressed['ArrowDown']) { dy = 1; engine.keysPressed['ArrowDown'] = true; }
    else if (engine.isDown('ArrowLeft') && !engine.keysPressed['ArrowLeft']) { dx = -1; engine.keysPressed['ArrowLeft'] = true; }
    else if (engine.isDown('ArrowRight') && !engine.keysPressed['ArrowRight']) { dx = 1; engine.keysPressed['ArrowRight'] = true; }
    else return;

    let nx = player.x + dx, ny = player.y + dy;
    if (grid[ny][nx] === 'X') return;
    if (nx === box.x && ny === box.y) {
        let bx = box.x + dx, by = box.y + dy;
        if (grid[by][bx] !== 'X') {
            box.x = bx; box.y = by;
            player.x = nx; player.y = ny;
            if (box.x === goal.x && box.y === goal.y) {
                engine.spawnParticle(OFFSET_X + box.x*TILE + 25, OFFSET_Y + box.y*TILE + 25, '#00ff00', 20);
                setTimeout(() => loadLevel(levelIndex + 1), 500);
            }
        }
    } else { player.x = nx; player.y = ny; }
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
    drawBlock3D(ctx, OFFSET_X + box.x*TILE+2, OFFSET_Y + box.y*TILE+2, TILE-4, '#ff00ff');
    
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
    
    ctx.fillStyle = '#fff';
    ctx.fillText(LEVEL , 50, 50);
});
