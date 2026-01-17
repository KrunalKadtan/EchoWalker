const PIXEL_SIZE = 20;
const ROW = 31;
const COLUMN = 31;

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

// Center the maze on screen
const offsetX = (window.innerWidth - (COLUMN * PIXEL_SIZE)) / 2;
const offsetY = (window.innerHeight - (ROW * PIXEL_SIZE)) / 2;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 1. Map Legend
// 0 = Path, 1 = Wall, 2 = Start (Player), 3 = Goal (Echo Source)
let map = Array.from({ length: ROW }, () => new Array(COLUMN).fill(1));

function generateEchoMaze(r, c_idx) {
    map[r][c_idx] = 0;

    let dirs = [[0, 2], [0, -2], [2, 0], [-2, 0]];
    dirs.sort(() => Math.random() - 0.5);

    for (let [dr, dc] of dirs) {
        let nextR = r + dr;
        let nextC = c_idx + dc;

        if (nextR > 0 && nextR < ROW - 1 && nextC > 0 && nextC < COLUMN - 1 && map[nextR][nextC] === 1) {
            map[r + dr / 2][c_idx + dc / 2] = 0;
            generateEchoMaze(nextR, nextC);
        }
    }
}

// 2. Run Generation
generateEchoMaze(1, 1);

// 3. Set EchoWalker Specific Points
map[1][1] = 2; // Starting position
map[ROW - 2][COLUMN - 2] = 3; // The "Echo" source to find

// 4. Render with EchoWalker Colors
function draw() {
    c.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < ROW; i++) {
        for (let j = 0; j < COLUMN; j++) {
            let x = (j * PIXEL_SIZE) + offsetX;
            let y = (i * PIXEL_SIZE) + offsetY;

            if (map[i][j] === 1) {
                c.fillStyle = "#1a1a1a"; // Dark wall
            } else if (map[i][j] === 2) {
                c.fillStyle = "#00ff00"; // Green Start
            } else if (map[i][j] === 3) {
                c.fillStyle = "#ff00ff"; // Magenta Echo Source
            } else {
                c.fillStyle = "#f0f0f0"; // White Path
            }

            c.fillRect(x, y, PIXEL_SIZE, PIXEL_SIZE);

            // Add subtle grid lines for "Echo" aesthetics
            c.strokeStyle = "#ccc";
            c.strokeRect(x, y, PIXEL_SIZE, PIXEL_SIZE);
        }
    }
}

draw();