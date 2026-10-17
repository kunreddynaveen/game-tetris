const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const levelElement = document.getElementById('level');

const nextCanvas = document.getElementById('next-canvas');
const nextContext = nextCanvas.getContext('2d');
const holdCanvas = document.getElementById('hold-canvas');
const holdContext = holdCanvas.getContext('2d');

const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlaySubtitle = document.getElementById('overlay-subtitle');
const leaderboardContainer = document.getElementById('leaderboard-container');
const leaderboardList = document.getElementById('leaderboard-list');
const restartBtn = document.getElementById('btn-restart');

const COLS = 10;
const ROWS = 20;

context.scale(24, 24);
nextContext.scale(18, 18);
holdContext.scale(18, 18);

let isPaused = false;
let isGameOver = false;

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

let arena = createMatrix(COLS, ROWS);

// FIX: Hardcoded absolute values for every single grid cell matrix to prevent invisible blocks
// A foolproof string-mapped piece directory that will never format incorrectly
const SHAPES = (function() {
    const blueprints = {
        'I': ['0000', '1111', '0000', '0000'],
        'L': ['002',  '222',  '000'],
        'J': ['300',  '333',  '000'],
        'O': ['44',   '44'],
        'Z': ['550',  '055',  '000'],
        'S': ['066',  '660',  '000'],
        'T': ['070',  '777',  '000']
    };
    
    const directory = {};
    for (const key in blueprints) {
        directory[key] = blueprints[key].map(rowString => 
            rowString.split('').map(char => parseInt(char, 10))
        );
    }
    return directory;
})();


const COLORS = [
    null, '#FF0D72', '#0DC2FF', '#0DFF72',
    '#F538FF', '#FF8E0D', '#FFE138', '#3877FF'
];

const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    type: null,
    score: 0,
    level: 1
};

let nextPieceType = null;
let holdPieceType = null;
let hasHeldThisTurn = false;

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

// ==========================================
// 🎲 TRUE 7-BAG RANDOMIZER ENGINE
// ==========================================
let tetrisBag = [];

function generateNewBag() {
    const pieces = ['I', 'L', 'J', 'O', 'Z', 'S', 'T'];
    for (let i = pieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = pieces[i];
        pieces[i] = pieces[j];
        pieces[j] = temp;
    }
    tetrisBag = pieces;
}

function getRandomPieceType() {
    if (tetrisBag.length === 0) {
        generateNewBag();
    }
    return tetrisBag.pop();
}

// ==========================================
// 💾 PERSISTENCE LEADERBOARD ENGINE
// ==========================================
function loadScores() {
    const scores = localStorage.getItem('tetris_scores');
    return scores ? JSON.parse(scores) : [];
}

function saveScore(newScore) {
    let scores = loadScores();
    scores.push(newScore);
    scores.sort((a, b) => b - a);
    scores = scores.slice(0, 5); 
    localStorage.setItem('tetris_scores', JSON.stringify(scores));
    return scores;
}

function updateHighScoreDisplay() {
    const scores = loadScores();
    highScoreElement.innerText = scores.length > 0 ? scores[0] : 0;
}

function playerReset() {
    if (!nextPieceType) {
        nextPieceType = getRandomPieceType();
    }
    
    player.type = nextPieceType;
    player.matrix = SHAPES[player.type];
    player.pos.y = 0;
    player.pos.x = Math.floor(COLS / 2) - Math.floor(player.matrix[0].length / 2);

    nextPieceType = getRandomPieceType();
    hasHeldThisTurn = false;

    if (collide(arena, player)) {
        triggerGameOver();
    }
    
    drawSidePanels();
}

function playerHold() {
    if (isPaused || isGameOver || hasHeldThisTurn) return;

    const currentType = player.type;
    
    if (!holdPieceType) {
        holdPieceType = currentType;
        player.type = nextPieceType;
        player.matrix = SHAPES[player.type];
        nextPieceType = getRandomPieceType();
    } else {
        const temp = holdPieceType;
        holdPieceType = currentType;
        player.type = temp;
        player.matrix = SHAPES[player.type];
    }

    player.pos.y = 0;
    player.pos.x = Math.floor(COLS / 2) - Math.floor(player.matrix[0].length / 2);

    hasHeldThisTurn = true;
    dropCounter = 0;
    
    if (collide(arena, player)) {
        triggerGameOver();
    }
    
    drawSidePanels();
}

function drawSidePanels() {
    nextContext.fillStyle = '#111';
    nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (nextPieceType) {
        const matrix = SHAPES[nextPieceType];
        const offsetX = (4 - matrix[0].length) / 2;
        const offsetY = (4 - matrix.length) / 2;
        drawMiniMatrix(nextContext, matrix, { x: offsetX, y: offsetY }, nextPieceType);
    }

    holdContext.fillStyle = '#111';
    holdContext.fillRect(0, 0, holdCanvas.width, holdCanvas.height);
    if (holdPieceType) {
        const matrix = SHAPES[holdPieceType];
        const offsetX = (4 - matrix[0].length) / 2;
        const offsetY = (4 - matrix.length) / 2;
        drawMiniMatrix(holdContext, matrix, { x: offsetX, y: offsetY }, holdPieceType);
    }
}

function drawMiniMatrix(ctx, matrix, offset, type) {
    const valIndex = 'ILJOZST'.indexOf(type) + 1;
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = COLORS[valIndex];
                ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function getGhostPosition() {
    const ghostPos = { x: player.pos.x, y: player.pos.y };
    const dummyPlayer = { pos: ghostPos, matrix: player.matrix };
    while (!collide(arena, dummyPlayer)) {
        ghostPos.y++;
    }
    ghostPos.y--;
    return ghostPos;
}

function triggerGameOver() {
    isGameOver = true;
    overlayTitle.innerText = "GAME OVER";
    overlaySubtitle.innerText = `Current Game Score: ${player.score}`;
    
    const topScores = saveScore(player.score);
    updateHighScoreDisplay();

    leaderboardList.innerHTML = '';
    let foundCurrentRunHighlight = false;

    topScores.forEach((scoreVal, index) => {
        const li = document.createElement('li');
        if (scoreVal === player.score && !foundCurrentRunHighlight) {
            li.classList.add('current-run');
            li.innerHTML = `<div><span>#${index + 1} You</span> <span>${scoreVal}</span></div>`;
            foundCurrentRunHighlight = true;
        } else {
            li.innerHTML = `<div><span>#${index + 1} Record</span> <span>${scoreVal}</span></div>`;
        }
        leaderboardList.appendChild(li);
    });

    leaderboardContainer.classList.remove('hidden');
    restartBtn.classList.remove('hidden');
    overlay.classList.remove('hidden');
}

function resetGame() {
    arena.forEach(row => row.fill(0));
    player.score = 0;
    player.level = 1;
    nextPieceType = null;
    holdPieceType = null;
    hasHeldThisTurn = false;
    tetrisBag = [];
    isGameOver = false;
    isPaused = false;
    
    leaderboardContainer.classList.add('hidden');
    restartBtn.classList.add('hidden');
    overlay.classList.add('hidden');
    
    updateSpeed();
    updateStatus();
    playerReset();
}

function togglePause() {
    if (isGameOver) return;
    isPaused = !isPaused;
    if (isPaused) {
        overlayTitle.innerText = "PAUSED";
        overlaySubtitle.innerText = "Tap anywhere or press 'P' to resume";
        leaderboardContainer.classList.add('hidden');
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
        lastTime = performance.now();
    }
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] &&
                    arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function arenaSweep() {
    let linesCleared = 0;
    
    for (let y = arena.length - 1; y >= 0; --y) {
        let isRowFull = true;
        
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                isRowFull = false;
                break;
            }
        }
        
        if (isRowFull) {
            arena.splice(y, 1);
            arena.unshift(new Array(COLS).fill(0));
            ++y; 
            linesCleared++;
        }
    }

    if (linesCleared > 0) {
        // Classic fixed array setup securely written out
        const lineValues = [40, 100, 300, 1200];
        player.score += lineValues[linesCleared] * player.level;
    }

    const currentLevel = Math.floor(player.score / 500) + 1;
    if (currentLevel !== player.level) {
        player.level = currentLevel;
        updateSpeed();
    }
}

function updateSpeed() {
    dropInterval = Math.max(100, 1000 - (player.level - 1) * 100);
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = COLORS[value];
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function drawGhostMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
context.fillStyle = "rgba(255, 255, 255, 0.08)";
context.fillRect(x + offset.x, y + offset.y, 1, 1);
context.lineWidth = 0.04;
context.strokeStyle = "rgba(255, 255, 255, 0.3)";
context.strokeRect(x + offset.x, y + offset.y, 1, 1);
}
});
});
}
function drawGrid() {
context.lineWidth = 0.03;
context.strokeStyle = '#252525';
for (let y = 0; y < arena.length; y++) {
for (let x = 0; x < arena[y].length; x++) {
context.strokeRect(x, y, 1, 1);
}
}
}
function draw() {
context.fillStyle = '#111';
context.fillRect(0, 0, COLS, ROWS);
drawGrid();
drawMatrix(arena, { x: 0, y: 0 });
if (!isGameOver && !isPaused && player.matrix) {
const ghostPos = getGhostPosition();
drawGhostMatrix(player.matrix, ghostPos);
}
if (player.matrix) {
drawMatrix(player.matrix, player.pos);
}
}
function update(time = 0) {
if (isPaused || isGameOver) {
requestAnimationFrame(update);
return;
}
const deltaTime = time - lastTime;
lastTime = time;
dropCounter += deltaTime;
if (dropCounter > dropInterval) {
playerDrop();
}
draw();
requestAnimationFrame(update);
}
function playerDrop() {
if (isPaused || isGameOver) return;
player.pos.y++;
if (collide(arena, player)) {
player.pos.y--;
merge(arena, player);
playerReset();
arenaSweep();
updateStatus();
}
dropCounter = 0;
}
function playerHardDrop() {
if (isPaused || isGameOver) return;
while (!collide(arena, player)) {
player.pos.y++;
}
player.pos.y--;
merge(arena, player);
playerReset();
arenaSweep();
updateStatus();
dropCounter = 0;
}
function playerMove(dir) {
if (isPaused || isGameOver) return;
player.pos.x += dir;
if (collide(arena, player)) {
player.pos.x -= dir;
}
}
function rotate(matrix, dir) {
for (let y = 0; y < matrix.length; ++y) {
for (let x = 0; x < y; ++x) {
[matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
}
}
if (dir > 0) {
matrix.forEach(row => row.reverse());
} else {
matrix.reverse();
}
}
function playerRotate(dir) {
if (isPaused || isGameOver) return;
const pos = player.pos.x;
let offset = 1;
rotate(player.matrix, dir);
while (collide(arena, player)) {
player.pos.x += offset;
offset = -(offset + (offset > 0 ? 1 : -1));
if (offset > player.matrix.length) {
rotate(player.matrix, -dir);
player.pos.x = pos;
return;
}
}
}
function updateStatus() {
scoreElement.innerText = player.score;
levelElement.innerText = player.level;
}
// Controls
document.addEventListener('keydown', event => {
if (event.key.toLowerCase() === 'p') {
togglePause();
return;
}
if (isPaused || isGameOver) return;
if (event.key === 'ArrowLeft') playerMove(-1);
else if (event.key === 'ArrowRight') playerMove(1);
else if (event.key === 'ArrowDown') playerDrop();
else if (event.key === 'ArrowUp') playerRotate(1);
else if (event.key.toLowerCase() === 'c' || event.key === 'Shift') {
playerHold();
}
else if (event.key === ' ') {
event.preventDefault();
playerHardDrop();
}
});
function bindButton(id, callback) {
const btn = document.getElementById(id);
if (!btn) return;
const triggerAction = (e) => {
e.preventDefault();
callback();
};
btn.addEventListener('touchstart', triggerAction, { passive: false });
btn.addEventListener('mousedown', triggerAction);
}
bindButton('btn-left', () => playerMove(-1));
bindButton('btn-right', () => playerMove(1));
bindButton('btn-down', () => playerDrop());
bindButton('btn-rot', () => playerRotate(1));
bindButton('btn-hard', () => playerHardDrop());
bindButton('btn-hold-touch', () => playerHold());
bindButton('btn-pause', () => togglePause());
overlay.addEventListener('click', (e) => {
if (isPaused && !isGameOver) {
togglePause();
}
});
restartBtn.addEventListener('click', (e) => {
e.stopPropagation();
resetGame();
});

// =========================================================================
// 🔊 SELF-CONTAINED JUICE & RETRO SOUND EFFECTS PLUGIN
// =========================================================================
(function InjectJuiceSystem() {
    // 1. Audio Synth Engine via Web Audio API
    const RetroAudio = {
        ctx: null,
        init() {
            if (!this.ctx) {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            }
        },
        play(type) {
            this.init();
            if (!this.ctx) return;
            if (this.ctx.state === 'suspended') this.ctx.resume();

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            const now = this.ctx.currentTime;

            if (type === 'move') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(140, now);
                gain.gain.setValueAtTime(0.04, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
                osc.start(now); osc.stop(now + 0.04);
            } else if (type === 'rotate') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.exponentialRampToValueAtTime(280, now + 0.07);
                gain.gain.setValueAtTime(0.04, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
                osc.start(now); osc.stop(now + 0.07);
            } else if (type === 'land') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(85, now);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                osc.start(now); osc.stop(now + 0.08);
            } else if (type === 'clear') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.setValueAtTime(554, now + 0.07);
                osc.frequency.setValueAtTime(659, now + 0.14);
                osc.frequency.setValueAtTime(880, now + 0.21);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc.start(now); osc.stop(now + 0.3);
            } else if (type === 'gameover') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(260, now);
                osc.frequency.linearRampToValueAtTime(70, now + 0.5);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                osc.start(now); osc.stop(now + 0.5);
            }
        }
    };

    // 2. Particle Burst Arrays & Mechanics
    let burstParticles = [];
    
    function spawnLineBurst(yRow) {
        const hexColors = ["#FF0D72", "#0DC2FF", "#0DFF72", "#F538FF", "#FF8E0D", "#FFE138", "#3877FF"];
        const randomColor = hexColors[Math.floor(Math.random() * hexColors.length)];
        for (let x = 0; x < 10; x++) {
            for (let i = 0; i < 4; i++) {
                burstParticles.push({
                    x: x + 0.5, y: yRow + 0.5,
                    vx: (Math.random() - 0.5) * 0.25,
                    vy: (Math.random() - 0.5) * 0.25,
                    alpha: 1, color: randomColor
                });
            }
        }
    }

    // 3. Intercept and Wrap Core Game Functions safely
    const originalPlayerMove = window.playerMove;
    window.playerMove = function(dir) {
        const oldX = player.pos.x;
        originalPlayerMove(dir);
        if (player.pos.x !== oldX) RetroAudio.play('move');
    };

    const originalPlayerRotate = window.playerRotate;
    window.playerRotate = function(dir) {
        originalPlayerRotate(dir);
        RetroAudio.play('rotate');
    };

    const originalArenaSweep = window.arenaSweep;
    window.arenaSweep = function() {
        // Scan for full rows right before the clean copy sweeps them away
        let rowsToExplode = [];
        for (let y = 0; y < 20; y++) {
            if (arena[y] && arena[y].every(val => val !== 0)) {
                rowsToExplode.push(y);
            }
        }
        
        originalArenaSweep();

        if (rowsToExplode.length > 0) {
            RetroAudio.play('clear');
            rowsToExplode.forEach(y => spawnLineBurst(y));
        } else {
            RetroAudio.play('land');
        }
    };

    const originalTriggerGameOver = window.triggerGameOver;
    window.triggerGameOver = function() {
        originalTriggerGameOver();
        RetroAudio.play('gameover');
    };

    // 4. Inject Particle Drawer safely into the frame drawing pipeline loop
    const originalDraw = window.draw;
    window.draw = function() {
        originalDraw(); // Renders the original grid canvas first
        
        // Compute delta frame time dynamically
        const frameNow = performance.now();
        const delta = window.lastParticleTime ? (frameNow - window.lastParticleTime) : 16;
        window.lastParticleTime = frameNow;

        // Render bursting particles right over the grid canvas
        for (let i = burstParticles.length - 1; i >= 0; i--) {
            let p = burstParticles[i];
            p.x += p.vx; p.y += p.vy;
            p.alpha -= delta * 0.0025;
            if (p.alpha <= 0) { burstParticles.splice(i, 1); continue; }
            context.save();
            context.globalAlpha = p.alpha;
            context.fillStyle = p.color;
            context.fillRect(p.x - 0.05, p.y - 0.05, 0.1, 0.1);
            context.restore();
        }
    };
})();




// Initialization
updateHighScoreDisplay();
playerReset();
updateStatus();
update();