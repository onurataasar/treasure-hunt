import { GameState, Player, BoardSpace, SpaceType } from "./types";

const BOARD_SIZE = 36;

export function createInitialBoard(): BoardSpace[] {
  const board: BoardSpace[] = [];
  const spaceTypes: SpaceType[] = [
    "normal",
    "treasure",
    "trap",
    "powerup",
    "challenge",
  ];

  for (let i = 0; i < BOARD_SIZE; i++) {
    // First and last spaces are always normal
    if (i === 0 || i === BOARD_SIZE - 1) {
      board.push({ id: i, type: "normal" });
      continue;
    }

    // Randomly assign space types with weighted probability
    const rand = Math.random();
    let type: SpaceType;
    if (rand < 0.4) {
      type = "normal";
    } else if (rand < 0.6) {
      type = "treasure";
    } else if (rand < 0.75) {
      type = "trap";
    } else if (rand < 0.9) {
      type = "powerup";
    } else {
      type = "challenge";
    }

    let points: number | undefined;
    if (type === "treasure") {
      points = Math.floor(Math.random() * 3 + 1) * 10; // 10, 20, or 30 points
    } else if (type === "trap") {
      points = Math.floor(Math.random() * 2 + 1) * -10; // -10 or -20 points
    }

    board.push({
      id: i,
      type,
      points,
      effect: getRandomEffect(type),
    });
  }

  return board;
}

function getRandomEffect(type: SpaceType): string | undefined {
  if (type === "powerup") {
    const effects = [
      "Ekstra zar atma hakkı",
      "Rakibi 2 adım geriye at",
      "Bir sonraki tuzaktan korun",
    ];
    return effects[Math.floor(Math.random() * effects.length)];
  }
  return undefined;
}

export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export function movePlayer(
  gameState: GameState,
  playerId: string,
  steps: number
): GameState {
  const player = gameState.players.find((p) => p.id === playerId);
  if (!player) return gameState;

  // Calculate new position with bounds checking
  const newPosition = Math.min(
    Math.max(0, player.position + steps),
    BOARD_SIZE - 1
  );

  // Only update if position actually changed
  if (newPosition !== player.position) {
    player.position = newPosition;

    // Handle space effects
    const space = gameState.board[newPosition];
    if (space.points) {
      player.score = (player.score || 0) + space.points;
    }

    // Apply space effects
    if (space.effect) {
      switch (space.effect) {
        case "Ekstra zar atma hakkı":
          // Player gets another turn
          return { ...gameState };
        case "Rakibi 2 adım geriye at":
          // Find next player and move them back
          const nextPlayerIndex =
            (gameState.players.findIndex((p) => p.id === playerId) + 1) %
            gameState.players.length;
          const nextPlayer = gameState.players[nextPlayerIndex];
          if (nextPlayer) {
            nextPlayer.position = Math.max(0, nextPlayer.position - 2);
          }
          break;
        case "Bir sonraki tuzaktan korun":
          player.hasTrapProtection = true;
          break;
      }
    }

    // Handle trap spaces with protection
    if (space.type === "trap" && player.hasTrapProtection) {
      player.score = (player.score || 0) + (space.points || 0) * -1; // Reverse trap effect
      player.hasTrapProtection = false;
    }
  }

  // Move to next player's turn
  const currentPlayerIndex = gameState.players.findIndex(
    (p) => p.id === playerId
  );
  const nextPlayerIndex = (currentPlayerIndex + 1) % gameState.players.length;
  gameState.currentTurn = gameState.players[nextPlayerIndex].id;
  gameState.diceRoll = null;

  return { ...gameState };
}

export function checkWinCondition(gameState: GameState): string | null {
  // Check if any player has reached the end or has max score
  const winner = gameState.players.find(
    (p) => p.position === BOARD_SIZE - 1 || (p.score || 0) >= 100
  );

  if (winner) {
    return winner.id;
  }

  return null;
}
