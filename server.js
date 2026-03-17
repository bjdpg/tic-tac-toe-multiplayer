const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// Store all game rooms
let rooms = {};

io.on("connection", (socket) => {
console.log("User connected:", socket.id);

// Join room
socket.on("joinRoom", (roomId) => {
socket.join(roomId);

```
// Create room if not exists
if (!rooms[roomId]) {
  rooms[roomId] = {
    players: [],
    board: ["", "", "", "", "", "", "", "", ""],
    turn: "X",
    gameOver: false
  };
}

let room = rooms[roomId];

// Add player (max 2 players)
if (room.players.length < 2) {
  room.players.push(socket.id);
}

// Assign symbol
let playerSymbol =
  room.players.indexOf(socket.id) === 0 ? "X" : "O";

socket.emit("playerSymbol", playerSymbol);

// Send current state
io.to(roomId).emit("roomPlayers", room.players.length);
io.to(roomId).emit("updateBoard", room.board);
io.to(roomId).emit("turn", room.turn);
```

});

// Handle move
socket.on("move", ({ roomId, index }) => {
let room = rooms[roomId];
if (!room || room.gameOver) return;

```
let playerIndex = room.players.indexOf(socket.id);
let playerSymbol = playerIndex === 0 ? "X" : "O";

// Validate move
if (room.turn !== playerSymbol) return;
if (room.board[index] !== "") return;

// Make move
room.board[index] = playerSymbol;

// Check win
const winPatterns = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

let winner = null;

for (let pattern of winPatterns) {
  const [a,b,c] = pattern;
  if (
    room.board[a] &&
    room.board[a] === room.board[b] &&
    room.board[a] === room.board[c]
  ) {
    winner = room.board[a];
  }
}

// Game result
if (winner) {
  room.gameOver = true;
  io.to(roomId).emit("gameOver", winner);
} else if (!room.board.includes("")) {
  room.gameOver = true;
  io.to(roomId).emit("gameOver", "draw");
} else {
  room.turn = room.turn === "X" ? "O" : "X";
}

// Send updates
io.to(roomId).emit("updateBoard", room.board);
io.to(roomId).emit("turn", room.turn);
```

});

// Restart game
socket.on("restart", (roomId) => {
let room = rooms[roomId];
if (!room) return;

```
room.board = ["", "", "", "", "", "", "", "", ""];
room.turn = "X";
room.gameOver = false;

io.to(roomId).emit("updateBoard", room.board);
io.to(roomId).emit("turn", room.turn);
```

});

// Handle disconnect
socket.on("disconnect", () => {
console.log("User disconnected:", socket.id);

```
for (let roomId in rooms) {
  rooms[roomId].players =
    rooms[roomId].players.filter(id => id !== socket.id);
}
```

});
});

// IMPORTANT for deployment (Render)
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
console.log("Server running on port " + PORT);
});
