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