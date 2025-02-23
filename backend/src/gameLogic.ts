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

  const newPosition = Math.min(player.position + steps, BOARD_SIZE - 1);
  player.position = newPosition;

  // Handle space effects
  const space = gameState.board[newPosition];
  if (space.points) {
    player.score += space.points;
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
  // Check if any player has reached the end
  const winner = gameState.players.find((p) => p.position === BOARD_SIZE - 1);
  if (winner) {
    return winner.id;
  }

  return null;
}
