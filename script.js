const nameInput = document.getElementById("name-input");
const startBtn = document.getElementById("start-btn");

nameInput.addEventListener("input", () => {
    const nickname = nameInput.value.trim();
    startBtn.disabled = nickname === "";
});