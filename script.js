const nameInput = document.getElementById("name-input");
const startBtn = document.getElementById("start-btn");
const startForm = document.getElementById("start-form");
const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");

nameInput.addEventListener("input", () => {
    const nickname = nameInput.value.trim();
    startBtn.disabled = nickname === "";
});

startForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const nickname = nameInput.value.trim();
    if (!nickname) return;

    startScreen.style.display = "none";
    gameScreen.style.display = "block";

    localStorage.setItem("nickname", nickname);
})

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const SHIP_HEIGHT = 80;
const SHIP_WIDTH = SHIP_HEIGHT * (736 / 1104);
const SHIP_RADIUS = SHIP_WIDTH * 0.45;

const shipImg = new Image();
let shipImgReady = false;
shipImg.onload = () => { shipImgReady = true; };
shipImg.src = "./img/ship.png";

const ship = {
    x: canvas.width / 2,
    y: canvas.height - SHIP_HEIGHT / 2 - 20,
};

const keys = {
    KeyA: false,
    KeyD: false,
    KeyW: false,
    KeyS: false,
};

const SHIP_SPEED = 3;

window.addEventListener("keydown", (e) => {
    if (e.code in keys) {
        keys[e.code] = true;
        e.preventDefault();
    }
});

window.addEventListener("keyup", (e) => {
    if (e.code in keys) {
        keys[e.code] = false;
        e.preventDefault();
    }
});

function updateShip() {
    let dx = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
    let dy = (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0);

    if (dx !== 0 && dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
    }

    ship.x += dx * SHIP_SPEED;
    ship.y += dy * SHIP_SPEED;

    const halfW = SHIP_WIDTH / 2;
    const halfH = SHIP_HEIGHT / 2;
    ship.x = Math.max(halfW, Math.min(canvas.width  - halfW, ship.x));
    ship.y = Math.max(halfH, Math.min(canvas.height - halfH, ship.y));
}

function drawShip() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    updateShip();

    if (shipImgReady) {
        ctx.save();
        ctx.translate(ship.x, ship.y);
        ctx.drawImage(
            shipImg,
            -SHIP_WIDTH / 2,
            -SHIP_HEIGHT / 2,
            SHIP_WIDTH,
            SHIP_HEIGHT
        );
        ctx.restore();
    }

    requestAnimationFrame(drawShip);
}

drawShip();