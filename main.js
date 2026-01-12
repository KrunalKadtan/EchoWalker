const PIXEL_SIZE = 20;
const ROW = 30;
const COLUMN = 30;

const canvas = document.querySelector('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const c = canvas.getContext('2d');

let map = new Array(ROW);

// build map skeleton
for (let i = 0; i < ROW; i++) {
  map[i] = new Array(COLUMN);
}


// build map
for (let i = 0; i < ROW; i++) {
  for (let j = 0; j < COLUMN; j++) {
    if (i === 0 || i === ROW-1 || j === 0 || j === COLUMN-1) {
      map[i][j] = 1;
    } else {
      map[i][j] = 0;
    }
  }
}

// print map
for (i in map) {
  for (j in map[i]) {
    if (map[i][j] === 1) {
      c.fillRect((i*PIXEL_SIZE)+100, (j*PIXEL_SIZE)+100, PIXEL_SIZE, PIXEL_SIZE);
    }
  }
}

