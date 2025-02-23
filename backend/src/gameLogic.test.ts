import {
  createInitialBoard,
  rollDice,
  movePlayer,
  checkWinCondition,
} from "./gameLogic";
import { GameState, Player, BoardSpace } from "./types";

describe("Game Logic Tests", () => {
  describe("createInitialBoard", () => {
    it("should create a board with 36 spaces", () => {
      const board = createInitialBoard();
      expect(board.length).toBe(36);
    });

    it("should have normal spaces at start and end", () => {
      const board = createInitialBoard();
      expect(board[0].type).toBe("normal");
      expect(board[35].type).toBe("normal");
    });

    it("should have valid space types and properties", () => {
      const board = createInitialBoard();
      const validTypes = ["normal", "treasure", "trap", "powerup", "challenge"];

      board.forEach((space) => {
        expect(validTypes).toContain(space.type);

        if (space.type === "treasure" && space.points !== undefined) {
          expect(space.points).toBeGreaterThanOrEqual(10);
          expect(space.points).toBeLessThanOrEqual(30);
          expect(Math.abs(space.points % 10)).toBe(0);
        }

        if (space.type === "trap" && space.points !== undefined) {
          expect(space.points).toBeLessThanOrEqual(-10);
          expect(space.points).toBeGreaterThanOrEqual(-20);
          expect(Math.abs(space.points % 10)).toBe(0);
        }

        if (space.type === "powerup") {
          expect(space.effect).toBeDefined();
          expect([
            "Ekstra zar atma hakkı",
            "Rakibi 2 adım geriye at",
            "Bir sonraki tuzaktan korun",
          ]).toContain(space.effect);
        }
      });
    });
  });

  describe("rollDice", () => {
    it("should return a number between 1 and 6", () => {
      for (let i = 0; i < 100; i++) {
        const roll = rollDice();
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(6);
      }
    });
  });

  describe("movePlayer", () => {
    let gameState: GameState;

    beforeEach(() => {
      gameState = {
        board: createInitialBoard(),
        players: [
          {
            id: "p1",
            name: "Player 1",
            position: 0,
            score: 0,
            isHost: true,
            isReady: true,
          },
          {
            id: "p2",
            name: "Player 2",
            position: 0,
            score: 0,
            isHost: false,
            isReady: true,
          },
        ],
        currentTurn: "p1",
        diceRoll: null,
        gameCode: "TEST123",
        isStarted: true,
        maxPlayers: 4,
      };
    });

    it("should move player correctly", () => {
      const newState = movePlayer(gameState, "p1", 3);
      expect(newState.players[0].position).toBe(3);
    });

    it("should not move beyond board bounds", () => {
      const newState = movePlayer(gameState, "p1", 40);
      expect(newState.players[0].position).toBe(35);
    });

    it("should handle trap protection", () => {
      // Set up a trap at position 2
      gameState.board[2] = { id: 2, type: "trap", points: -10 };
      gameState.players[0].hasTrapProtection = true;
      gameState.players[0].score = 50;

      const newState = movePlayer(gameState, "p1", 2);
      expect(newState.players[0].score).toBe(50); // Score shouldn't decrease
      expect(newState.players[0].hasTrapProtection).toBe(false); // Protection should be used
    });

    it("should handle powerup effects", () => {
      // Test "Rakibi 2 adım geriye at"
      gameState.board[2] = {
        id: 2,
        type: "powerup",
        effect: "Rakibi 2 adım geriye at",
      };
      gameState.players[1].position = 5;

      const newState = movePlayer(gameState, "p1", 2);
      expect(newState.players[1].position).toBe(3); // Second player moved back 2 spaces
    });

    it("should switch turns correctly", () => {
      const newState = movePlayer(gameState, "p1", 3);
      expect(newState.currentTurn).toBe("p2");
    });
  });

  describe("checkWinCondition", () => {
    let gameState: GameState;

    beforeEach(() => {
      gameState = {
        board: createInitialBoard(),
        players: [
          {
            id: "p1",
            name: "Player 1",
            position: 0,
            score: 0,
            isHost: true,
            isReady: true,
          },
          {
            id: "p2",
            name: "Player 2",
            position: 0,
            score: 0,
            isHost: false,
            isReady: true,
          },
        ],
        currentTurn: "p1",
        diceRoll: null,
        gameCode: "TEST123",
        isStarted: true,
        maxPlayers: 4,
      };
    });

    it("should detect win by reaching end", () => {
      gameState.players[0].position = 35;
      expect(checkWinCondition(gameState)).toBe("p1");
    });

    it("should detect win by score", () => {
      gameState.players[1].score = 100;
      expect(checkWinCondition(gameState)).toBe("p2");
    });

    it("should return null when no winner", () => {
      expect(checkWinCondition(gameState)).toBeNull();
    });
  });
});
