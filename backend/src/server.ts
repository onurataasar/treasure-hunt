import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { GameState, Player } from "./types";
import {
  createInitialBoard,
  rollDice,
  movePlayer,
  checkWinCondition,
} from "./gameLogic";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

const games = new Map<string, GameState>();

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("createGame", (playerName: string) => {
    const gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const playerId = uuidv4();

    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      isHost: true,
      isReady: true,
      position: 0,
      score: 0,
    };

    const gameState: GameState = {
      gameCode,
      players: [newPlayer],
      isStarted: false,
      maxPlayers: 6,
      currentTurn: playerId,
      board: [],
      diceRoll: null,
    };

    games.set(gameCode, gameState);
    socket.join(gameCode);

    socket.emit("playerId", playerId);
    io.to(gameCode).emit("gameState", gameState);
  });

  socket.on(
    "joinGame",
    ({ gameCode, playerName }: { gameCode: string; playerName: string }) => {
      const game = games.get(gameCode);
      if (!game) {
        socket.emit("error", "Game not found");
        return;
      }

      if (game.players.length >= game.maxPlayers) {
        socket.emit("error", "Game is full");
        return;
      }

      const playerId = uuidv4();
      const newPlayer: Player = {
        id: playerId,
        name: playerName,
        isHost: false,
        isReady: false,
        position: 0,
        score: 0,
      };

      game.players.push(newPlayer);
      socket.join(gameCode);

      socket.emit("playerId", playerId);
      io.to(gameCode).emit("gameState", game);
    }
  );

  socket.on(
    "toggleReady",
    ({ gameCode, playerId }: { gameCode: string; playerId: string }) => {
      const game = games.get(gameCode);
      if (!game) return;

      const player = game.players.find((p) => p.id === playerId);
      if (player) {
        player.isReady = !player.isReady;
        io.to(gameCode).emit("gameState", game);
      }
    }
  );

  socket.on("startGame", (gameCode: string) => {
    const game = games.get(gameCode);
    if (!game) return;

    if (game.players.every((p) => p.isReady)) {
      game.isStarted = true;
      game.board = createInitialBoard();
      game.currentTurn = game.players[0].id;
      io.to(gameCode).emit("gameState", game);
      io.to(gameCode).emit("gameStarted");
    }
  });

  socket.on(
    "rollDice",
    ({ gameCode, playerId }: { gameCode: string; playerId: string }) => {
      const game = games.get(gameCode);
      if (!game || game.currentTurn !== playerId || game.diceRoll !== null)
        return;

      const roll = rollDice();
      const updatedGame = { ...game, diceRoll: roll };
      games.set(gameCode, updatedGame);
      io.to(gameCode).emit("gameState", updatedGame);

      setTimeout(() => {
        const currentGame = games.get(gameCode);
        if (
          !currentGame ||
          currentGame.currentTurn !== playerId ||
          currentGame.diceRoll !== roll
        )
          return;

        const updatedGameAfterMove = movePlayer(
          { ...currentGame },
          playerId,
          roll
        );
        games.set(gameCode, updatedGameAfterMove);

        const winner = checkWinCondition(updatedGameAfterMove);
        if (winner) {
          io.to(gameCode).emit("gameWon", winner);
        }

        io.to(gameCode).emit("gameState", updatedGameAfterMove);
      }, 1000);
    }
  );

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    // TODO: Handle player disconnection and cleanup
    // Remove player from game, reassign host if needed, etc.
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
