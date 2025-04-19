const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Backgrounds
const bgSources = [
  'https://i.postimg.cc/cgkMk27F/background.png',
  'https://i.postimg.cc/8sXYJnvk/images.jpg',
  'https://i.postimg.cc/LnN81STY/927b2caca31fda5069f3116d424881c7.jpg'
];
let currentBgIndex = 0;
const backgrounds = bgSources.map(src => {
  const img = new Image();
  img.src = src;
  return img;
});

// Game Over Sound
const gameOverSound = new Audio();
gameOverSound.src = 'https://yourdomain.com/gameover.mp3'; // Replace with your actual sound URL

const birdImg = new Image();
birdImg.src = 'https://i.postimg.cc/JD3tGk0Z/i-flappy.png';

const pipeImg = new Image();
pipeImg.src = 'https://i.postimg.cc/0K2t47JC/FMS5-JNNIM9-E2-EVN.webp';

let bird = {
  x: canvas.width / 5,
  y: canvas.height / 2,
  width: 80,
  height: 80,
  gravity: 0.5,
  lift: -10,
  velocity: 0
};

let pipes = [];
let frame = 0;
let score = 0;
let gameOver = false;
let started = false;
let pipeCount = 0;
let isFlipping = false;
let flipOpacity = 0;

document.getElementById("startBtn").addEventListener("click", () => {
  started = true;
  resetGame();
  document.getElementById("startBtn").style.display = "none";
  gameLoop();
});

function resetGame() {
  bird.y = canvas.height / 2;
  bird.velocity = 0;
  pipes = [];
  frame = 0;
  score = 0;
  pipeCount = 0;
  currentBgIndex = 0;
  gameOver = false;
}

function flap() {
  if (!gameOver) {
    bird.velocity = bird.lift;
  }
}

document.addEventListener("keydown", e => {
  if (e.code === "Space") flap();
});
document.addEventListener("touchstart", flap);

function drawBackground() {
  ctx.save();
  ctx.filter = "blur(3px)";
  ctx.drawImage(backgrounds[currentBgIndex], 0, 0, canvas.width, canvas.height);
  ctx.restore();

  if (isFlipping) {
    ctx.save();
    ctx.globalAlpha = flipOpacity;
    const nextBg = backgrounds[(currentBgIndex + 1) % backgrounds.length];
    ctx.filter = "blur(3px)";
    ctx.drawImage(nextBg, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
}

function drawBird() {
  ctx.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
}

function drawPipes() {
  pipes.forEach(pipe => {
    ctx.save();
    ctx.translate(pipe.x + pipe.width / 2, pipe.top / 2);
    ctx.scale(1, -1);
    ctx.drawImage(pipeImg, -pipe.width / 2, -pipe.top / 2, pipe.width, pipe.top);
    ctx.restore();
    ctx.drawImage(pipeImg, pipe.x, pipe.bottom, pipe.width, canvas.height - pipe.bottom);
  });
}

function drawScore() {
  ctx.fillStyle = "#fff";
  ctx.font = "30px Arial";
  ctx.fillText(`Score: ${score}`, 20, 50);
}

function getPipeGap() {
  if (score < 10) return 300;
  else if (score < 20) return 200;
  else return 150;
}

function generatePipeHeights(count) {
  const gap = getPipeGap();
  let topHeight;

  if ([1, 3, 5, 7, 9, 11].includes(count)) {
    topHeight = Math.floor(Math.random() * 100) + 30;
  } else if ([2, 4, 6, 8, 12, 14].includes(count)) {
    topHeight = Math.floor(Math.random() * (canvas.height - gap - 150)) + 100;
  } else {
    topHeight = Math.floor(Math.random() * (canvas.height - gap - 150)) + 75;
  }

  return {
    top: topHeight,
    bottom: topHeight + gap
  };
}

function checkCollision(pipe) {
  const padding = 8;
  const birdLeft = bird.x + padding;
  const birdRight = bird.x + bird.width - padding;
  const birdTop = bird.y + padding;
  const birdBottom = bird.y + bird.height - padding;

  const pipeLeft = pipe.x;
  const pipeRight = pipe.x + pipe.width;

  if (birdRight > pipeLeft && birdLeft < pipeRight) {
    if (birdTop < pipe.top || birdBottom > pipe.bottom) {
      return true;
    }
  }
  return false;
}

function flipBackground() {
  isFlipping = true;
  flipOpacity = 0;

  const flipInterval = setInterval(() => {
    flipOpacity += 0.05;
    if (flipOpacity >= 1) {
      flipOpacity = 1;
      currentBgIndex = (currentBgIndex + 1) % backgrounds.length;
      isFlipping = false;
      clearInterval(flipInterval);
    }
  }, 30);
}

function gameLoop() {
  if (!started) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();

  bird.velocity += bird.gravity;
  bird.y += bird.velocity;
  drawBird();

  if (frame % 90 === 0) {
    pipeCount++;
    const gap = getPipeGap();
    const heights = generatePipeHeights(pipeCount);
    pipes.push({
      x: canvas.width,
      width: 65,
      top: heights.top,
      bottom: heights.bottom,
      passed: false
    });

    if (pipeCount === 11 || pipeCount === 21 || pipeCount === 31) {
      flipBackground();
    }
  }

  pipes.forEach((pipe, index) => {
    pipe.x -= 3;

    if (!pipe.passed && checkCollision(pipe)) {
      gameOver = true;
      gameOverSound.play();
    }

    if (!pipe.passed && pipe.x + pipe.width < bird.x) {
      score++;
      pipe.passed = true;
    }

    if (pipe.x + pipe.width < 0) {
      pipes.splice(index, 1);
    }
  });

  drawPipes();
  drawScore();

  if (bird.y + bird.height > canvas.height || bird.y < 0) {
    gameOver = true;
    gameOverSound.play();
  }

  if (!gameOver) {
    frame++;
    requestAnimationFrame(gameLoop);
  } else {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "28px Arial";
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 30);
    document.getElementById("startBtn").style.display = "block";
  }
}

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
