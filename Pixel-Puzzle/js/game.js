const engine = new Engine('gameCanvas');
engine.gameName = 'pixel-puzzle';
engine.loadHighScore();

const levels = [
    { map: ["XXXXXX","X P  X","X B  X","X  G X","XXXXXX"], name: "BOOT SECTOR" },
    { map: ["XXXXXXX","X P   X","X B X X","X   X X","XXGXXXX"], name: "DATA CORE" },
    { map: ["XXXXXXXX","X  P   X","X XXX  X","X B    X","X    G X","XXXXXXXX"], name: "LOGIC GATE" },
    { map: ["XXXXXXXX","X P    X","X XXXX X","X B    X","X   XXXX","XXXG   X","XXXXXXXX"], name: "FIREWALL" },
    { map: ["XXXXXXXXX","X    P  X","XX XXX  X","X  B    X","X XXX X X","X     G X","XXXXXXXXX"], name: "ENCRYPTION" },
    { map: ["XXXXXXXXXX","X    P   X","X  XXXXX X","X  B     X","X XXXX X X","X      X X","XXXXXXGX X","X        X","XXXXXXXXXX"], name: "QUANTUM LOCK" }
];

let levelIndex = 0;
let grid = [];
let playerGrid = {x:0, y:0};
let boxGrid = {x:0, y:0};
let goalGrid = {x:0, y:0};
let moves = 0;
let moveHistory = [];
const TILE = 50;
let OFFSET_X = 200;
let OFFSET_Y = 150;
let glitchTimer = 0;

function loadLevel(idx) {
    if (idx >= levels.length) { 
        engine.state = 'GAMEOVER'; 
        return; 
    }
    levelIndex = idx;
    const map = levels[idx].map;
    grid = [];
    for(let y=0; y<map.length; y++) {
        let row = [];
        for(let x=0; x<map[y].length; x++) {
            let char = map[y][x];
            if (char === 'P') { playerGrid = {x,y}; char = ' '; }
            if (char === 'B') { boxGrid = {x,y}; char = ' '; }
            if (char === 'G') { goalGrid = {x,y}; char = ' '; }
            row.push(char);
        }
        grid.push(row);
    }
    moves = 0;
    moveHistory = [];
    OFFSET_X = Math.floor((800 - grid[0].length * TILE) / 2);
    OFFSET_Y = Math.floor((600 - grid.length * TILE) / 2);
    playSound('levelup');
}

engine.start(() => { loadLevel(0); }, (dt) => {
    let dx = 0, dy = 0;
    if (engine.justPressed('ArrowUp') || engine.justPressed('KeyW')) { dy = -1; }
    else if (engine.justPressed('ArrowDown') || engine.justPressed('KeyS')) { dy = 1; }
    else if (engine.justPressed('ArrowLeft') || engine.justPressed('KeyA')) { dx = -1; }
    else if (engine.justPressed('ArrowRight') || engine.justPressed('KeyD')) { dx = 1; }
    
    if (engine.justPressed('KeyZ') && moveHistory.length > 0) {
        const prev = moveHistory.pop();
        playerGrid.x = prev.px; playerGrid.y = prev.py;
        boxGrid.x = prev.bx; boxGrid.y = prev.by;
        moves--;
        playSound('shoot');
        return;
    }
    
    if (engine.justPressed('KeyR')) {
        loadLevel(levelIndex);
        return;
    }
    
    if (dx === 0 && dy === 0) return;

    let nx = playerGrid.x + dx, ny = playerGrid.y + dy;
    if (ny < 0 || ny >= grid.length || nx < 0 || nx >= grid[ny].length) return;
    if (grid[ny][nx] === 'X') return;
    
    const prevState = { px: playerGrid.x, py: playerGrid.y, bx: boxGrid.x, by: boxGrid.y };
    
    if (nx === boxGrid.x && ny === boxGrid.y) {
        let bx = boxGrid.x + dx, by = boxGrid.y + dy;
        if (by < 0 || by >= grid.length || bx < 0 || bx >= grid[by].length) return;
        if (grid[by][bx] !== 'X') {
            moveHistory.push(prevState);
            boxGrid.x = bx; boxGrid.y = by;
            playerGrid.x = nx; playerGrid.y = ny;
            moves++;
            playSound('jump');
            if (boxGrid.x === goalGrid.x && boxGrid.y === goalGrid.y) {
                engine.score += Math.max(10, 200 - moves * 5);
                setTimeout(() => loadLevel(levelIndex + 1), 500);
            }
        }
    } else {
        moveHistory.push(prevState);
        playerGrid.x = nx; playerGrid.y = ny;
        moves++;
        playSound('shoot');
    }
}, (ctx) => {
    glitchTimer += 0.05;
    
    // Background Grid
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for(let i=0; i<800; i+=25) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,600); ctx.stroke(); }
    for(let i=0; i<600; i+=25) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(800,i); ctx.stroke(); }

    // Draw Level Name
    ctx.fillStyle = Assets.COLORS.primary;
    ctx.font = 'bold 24px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(`${levels[levelIndex].name}`, 400, 40);
    ctx.font = '14px Courier New';
    ctx.fillText(`MOVES: ${moves} | LEVEL: ${levelIndex + 1}/${levels.length}`, 400, 65);

    // Draw Grid
    grid.forEach((row, y) => {
        row.forEach((cell, x) => {
            const px = OFFSET_X + x * TILE;
            const py = OFFSET_Y + y * TILE;
            if (cell === 'X') {
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(px+2, py+2, TILE-4, TILE-4);
                ctx.strokeStyle = Assets.COLORS.primary;
                ctx.lineWidth = 2;
                ctx.strokeRect(px+4, py+4, TILE-8, TILE-8);
                if (Math.random() > 0.98) {
                    ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
                    ctx.fillRect(px+4, py+4 + Math.random()*TILE, TILE-8, 2);
                }
            }
        });
    });

    // Goal
    const gx = OFFSET_X + goalGrid.x * TILE;
    const gy = OFFSET_Y + goalGrid.y * TILE;
    ctx.strokeStyle = Assets.COLORS.accent;
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(gx+5, gy+5, TILE-10, TILE-10);
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255, 0, 255, 0.1)';
    ctx.fillRect(gx+5, gy+5, TILE-10, TILE-10);

    // Box
    const bx = OFFSET_X + boxGrid.x * TILE;
    const by = OFFSET_Y + boxGrid.y * TILE;
    ctx.fillStyle = Assets.COLORS.secondary;
    ctx.shadowBlur = 10; ctx.shadowColor = Assets.COLORS.secondary;
    ctx.fillRect(bx+8, by+8, TILE-16, TILE-16);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
    ctx.strokeRect(bx+10, by+10, TILE-20, TILE-20);
    ctx.shadowBlur = 0;

    // Player
    const playerScreenX = OFFSET_X + playerGrid.x * TILE + TILE/2;
    const playerScreenY = OFFSET_Y + playerGrid.y * TILE + TILE/2;
    ctx.save();
    ctx.translate(playerScreenX, playerScreenY);
    Assets.renderPlayer(ctx, 0, 0, 30, 30, { vx: 0, vy: 0 });
    ctx.restore();

    // Controls Help
    ctx.fillStyle = '#666';
    ctx.font = '12px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText("WASD: MOVE | Z: UNDO | R: RESTART", 20, 580);
});
