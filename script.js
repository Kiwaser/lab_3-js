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