const nameInput = document.getElementById("name-input");
const startBtn = document.getElementById("start-btn");
const startForm = document.getElementById("start-form");
const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const restartBtn = document.getElementById("restart-btn");
const pauseBtn = document.getElementById("pause-btn");
const pauseOverlay = document.getElementById("pause-overlay");

const hudTimer = document.getElementById("hud-timer");
const hudScore = document.getElementById("hud-score");
const hudLives = document.getElementById("hud-lives");
const hudName = document.getElementById("hud-name");

const resultsBody = document.getElementById("results-body");
const playerResult = document.getElementById("player-result");

nameInput.addEventListener("input", () => {
    const nickname = nameInput.value.trim();
    startBtn.disabled = nickname === "";
});

startForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const nickname = nameInput.value.trim();
    if (!nickname) return;
    localStorage.setItem("nickname", nickname);
    startGame(nickname);
});

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const SHIP_HEIGHT = 80;
const SHIP_WIDTH = SHIP_HEIGHT * (736 / 1104);

const shipImg = new Image();
let shipImgReady = false;
shipImg.onload = () => { shipImgReady = true; };
shipImg.src = "./img/ship.png";

const meteorImg = new Image();
let meteorImgReady = false;
meteorImg.onload = () => { meteorImgReady = true; };
meteorImg.src = "./img/meteor.png";

const ship = { x: canvas.width / 2, y: canvas.height - SHIP_HEIGHT / 2 - 20 };

const keys = { KeyA: false, KeyD: false, KeyW: false, KeyS: false };
const SHIP_SPEED = 3;

const METEOR_SIZE = 50;
const METEOR_SPEED_MIN = 1.5;
const METEOR_SPEED_MAX = 4;
const SPAWN_INTERVAL_MS = 700;
const meteors = [];
let lastSpawnTime = 0;

const GAME_DURATION_MS = 2 * 60 * 1000;
let gameState = "idle";
let score = 0;
let lives = 3;
let currentNickname = "Игрок";
let gameStartTime = 0;
let gameEndTime = 0;
let rafId = null;
let lastTime = 0;
let invulnerableUntil = 0;
const INVULNERABLE_MS = 1000;
let isTestMode = false;
let isPaused = false;
let remainingMsOnPause = 0;

window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        if (gameState === "running") {
            e.preventDefault();
            togglePause();
        }
        return;
    }
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

function formatTime(ms) {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(totalSec / 60).toString().padStart(2, "0");
    const s = (totalSec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

function updateHUD(remainingMs) {
    if (isTestMode) {
        hudTimer.textContent = "--:--";
    } else {
        hudTimer.textContent = formatTime(remainingMs);
    }
    hudScore.textContent = `Баллы: ${score}`;
    hudLives.textContent = `Жизни: ${lives}`;
    hudName.textContent = isTestMode ? "tester [TEST MODE]" : currentNickname;
    if (isTestMode) {
        hudName.classList.add("test-mode-name");
    } else {
        hudName.classList.remove("test-mode-name");
    }
}

function startGame(nickname) {
    currentNickname = nickname;
    isTestMode = nickname.trim().toLowerCase() === "tester";
    isPaused = false;

    score = 0;
    lives = 3;
    meteors.length = 0;
    ship.x = canvas.width / 2;
    ship.y = canvas.height - SHIP_HEIGHT / 2 - 20;
    invulnerableUntil = 0;
    keys.KeyA = keys.KeyD = keys.KeyW = keys.KeyS = false;

    startScreen.style.display = "none";
    gameScreen.style.display = "block";
    gameOverScreen.style.display = "none";
    pauseOverlay.style.display = "none";
    pauseBtn.textContent = "Пауза";

    const now = performance.now();
    gameStartTime = now;
    gameEndTime = now + GAME_DURATION_MS;
    lastSpawnTime = now;
    lastTime = now;

    updateHUD(GAME_DURATION_MS);

    gameState = "running";

    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(gameLoop);
}

function endGame() {
    if (isTestMode) return;
    gameState = "over";
    isPaused = false;
    pauseOverlay.style.display = "none";
    pauseBtn.textContent = "Пауза";

    saveResult(currentNickname, score);
    renderResults();

    if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }

    gameScreen.style.display = "none";
    gameOverScreen.style.display = "block";
}

function togglePause() {
    if (gameState !== "running") return;

    if (!isPaused) {
        remainingMsOnPause = gameEndTime - performance.now();
        isPaused = true;
        pauseOverlay.style.display = "flex";
        pauseBtn.textContent = "Продолжить";
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    } else {
        isPaused = false;
        pauseOverlay.style.display = "none";
        pauseBtn.textContent = "Пауза";
        gameEndTime = performance.now() + remainingMsOnPause;
        lastTime = performance.now();
        lastSpawnTime = performance.now();
        rafId = requestAnimationFrame(gameLoop);
    }
}

pauseBtn.addEventListener("click", () => {
    togglePause();
});

function saveResult(name, points) {
    const key = "startreck_results";
    let results = [];
    try {
        results = JSON.parse(localStorage.getItem(key)) || [];
    } catch (e) {
        results = [];
    }
    results.push({ name, score: points, date: Date.now() });
    results.sort((a, b) => b.score - a.score);
    results = results.slice(0, 50);
    localStorage.setItem(key, JSON.stringify(results));
}

function renderResults() {
    let results = [];
    try {
        results = JSON.parse(localStorage.getItem("startreck_results")) || [];
    } catch (e) {
        results = [];
    }

    resultsBody.innerHTML = "";

    if (results.length === 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 3;
        td.textContent = "Пока нет результатов";
        tr.appendChild(td);
        resultsBody.appendChild(tr);
        playerResult.textContent = `Ваш результат: ${score} баллов. Ваше место: 1`;
        return;
    }

    const playerIndex = results.findIndex(
        (r) => r.name === currentNickname && r.score === score
    );
    const playerPlace = playerIndex === -1 ? results.length + 1 : playerIndex + 1;
    const inTop10 = playerIndex !== -1 && playerIndex < 10;

    let displayResults = results.slice(0, 10);
    let showPlayerRow = false;

    if (!inTop10) {
        showPlayerRow = true;
    }

    const frag = document.createDocumentFragment();
    const count = showPlayerRow ? 9 : 10;

    for (let i = 0; i < Math.min(count, displayResults.length); i++) {
        const r = displayResults[i];
        const tr = document.createElement("tr");
        if (playerIndex === i) {
            tr.classList.add("current-player");
        }
        const tdPlace = document.createElement("td");
        tdPlace.textContent = String(i + 1);
        const tdName = document.createElement("td");
        tdName.textContent = r.name;
        const tdScore = document.createElement("td");
        tdScore.textContent = String(r.score);
        tr.appendChild(tdPlace);
        tr.appendChild(tdName);
        tr.appendChild(tdScore);
        frag.appendChild(tr);
    }

    if (showPlayerRow) {
        const tr = document.createElement("tr");
        tr.classList.add("current-player");
        const tdPlace = document.createElement("td");
        tdPlace.textContent = String(playerPlace);
        const tdName = document.createElement("td");
        tdName.textContent = currentNickname;
        const tdScore = document.createElement("td");
        tdScore.textContent = String(score);
        tr.appendChild(tdPlace);
        tr.appendChild(tdName);
        tr.appendChild(tdScore);
        frag.appendChild(tr);
    }

    resultsBody.appendChild(frag);

    playerResult.textContent = `Ваш результат: ${score} баллов. Ваше место: ${playerPlace}`;
}

restartBtn.addEventListener("click", () => {
    gameOverScreen.style.display = "none";
    startScreen.style.display = "block";
    nameInput.value = "";
    startBtn.disabled = true;
    nameInput.focus();
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
    ship.x = Math.max(halfW, Math.min(canvas.width - halfW, ship.x));
    ship.y = Math.max(halfH, Math.min(canvas.height - halfH, ship.y));
}

function spawnMeteor() {
    const x = METEOR_SIZE / 2 + Math.random() * (canvas.width - METEOR_SIZE);
    meteors.push({
        x,
        y: -METEOR_SIZE / 2,
        speed: METEOR_SPEED_MIN + Math.random() * (METEOR_SPEED_MAX - METEOR_SPEED_MIN),
        size: METEOR_SIZE,
    });
}

function circleRectCollision(cx, cy, cr, rx, ry, rw, rh) {
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy <= cr * cr;
}

function updateMeteors(dt, now) {
    if (now - lastSpawnTime >= SPAWN_INTERVAL_MS) {
        spawnMeteor();
        lastSpawnTime = now;
    }

    const nowMs = performance.now();
    const invulnerable = nowMs < invulnerableUntil;

    for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.y += m.speed * dt;

        if (m.y - m.size / 2 > canvas.height) {
            meteors.splice(i, 1);
            score += 1;
            continue;
        }

        if (!invulnerable) {
            const hit = circleRectCollision(
                m.x, m.y, m.size / 2,
                ship.x - SHIP_WIDTH / 2, ship.y - SHIP_HEIGHT / 2,
                SHIP_WIDTH, SHIP_HEIGHT
            );
            if (hit) {
                meteors.splice(i, 1);
                lives -= 1;
                if (lives < 0) lives = 0;
                invulnerableUntil = nowMs + INVULNERABLE_MS;

                if (lives <= 0 && !isTestMode) {
                    endGame();
                    return;
                }
            }
        }
    }
}

function drawShip() {
    if (!shipImgReady) return;

    const now = performance.now();
    const invulnerable = now < invulnerableUntil;

    ctx.save();
    ctx.translate(ship.x, ship.y);

    if (invulnerable) {
        const visible = Math.floor(now / 100) % 2 === 0;
        if (!visible) {
            ctx.restore();
            return;
        }
        ctx.globalAlpha = 0.6;
    }

    ctx.drawImage(
        shipImg,
        -SHIP_WIDTH / 2,
        -SHIP_HEIGHT / 2,
        SHIP_WIDTH,
        SHIP_HEIGHT
    );
    ctx.restore();
}

function drawMeteors() {
    if (!meteorImgReady) return;
    for (const m of meteors) {
        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.drawImage(
            meteorImg,
            -m.size / 2,
            -m.size / 2,
            m.size,
            m.size
        );
        ctx.restore();
    }
}

function gameLoop(now) {
    if (gameState !== "running" || isPaused) return;

    const dt = Math.min((now - lastTime) / 16.6667, 3);
    lastTime = now;

    const remaining = gameEndTime - now;

    if (remaining <= 0 && !isTestMode) {
        updateHUD(0);
        endGame();
        return;
    }

    updateShip();
    updateMeteors(dt, now);

    if (gameState !== "running") return;

    updateHUD(isTestMode ? GAME_DURATION_MS : remaining);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMeteors();
    drawShip();

    rafId = requestAnimationFrame(gameLoop);
}

renderResults();