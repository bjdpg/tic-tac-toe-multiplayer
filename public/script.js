const socket = io();

let roomId = new URLSearchParams(window.location.search).get("room");
let playerSymbol = "";
let myTurn = false;
let gameOver = false;

if (roomId) {
  socket.emit("joinRoom", roomId);
  document.getElementById("roomInfo").innerText = "Room: " + roomId;
}

function createRoom() {
  roomId = Math.random().toString(36).substring(2, 7);
  window.location.href = `?room=${roomId}`;
}

function restartGame() {
  socket.emit("restart", roomId);
  gameOver = false;
}

socket.on("playerSymbol", (symbol) => {
  playerSymbol = symbol;
});

socket.on("roomPlayers", (count) => {
  document.getElementById("players").innerText =
    "Players: " + count;
});

socket.on("turn", (turn) => {
  myTurn = turn === playerSymbol;

  if (!gameOver) {
    document.getElementById("status").innerText =
      myTurn ? "Your Turn" : "Opponent's Turn";
  }
});

let cells = ["", "", "", "", "", "", "", "", ""];
const board = document.getElementById("board");

function renderBoard() {
  board.innerHTML = "";

  cells.forEach((cell, index) => {
    const div = document.createElement("div");
    div.classList.add("cell");
    div.innerText = cell;

    if (cell === "X") div.style.color = "#ff4c4c";
    if (cell === "O") div.style.color = "#4ca6ff";

    div.onclick = () => makeMove(index);

    board.appendChild(div);
  });
}

function makeMove(index) {
  if (!myTurn || gameOver) return;
  socket.emit("move", { roomId, index });
}

socket.on("updateBoard", (boardState) => {
  cells = boardState;
  renderBoard();
});

socket.on("gameOver", (result) => {
  gameOver = true;

  if (result === "draw") {
    document.getElementById("status").innerText = "🤝 It's a Draw!";
    return;
  }

  let message = result === "X"
    ? "🏆 Player X Wins!"
    : "🏆 Player O Wins!";

  if (result === playerSymbol) {
    message += " (You Win 🎉)";
  } else {
    message += " (You Lose 😢)";
  }

  document.getElementById("status").innerText = message;
});

renderBoard();