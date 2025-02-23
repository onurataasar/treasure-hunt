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
  // Create a deep copy of the game state to avoid mutations
  const newGameState = JSON.parse(JSON.stringify(gameState));
  const player = newGameState.players.find((p: Player) => p.id === playerId);
  if (!player) return newGameState;

  // Calculate new position with bounds checking
  const newPosition = Math.min(
    Math.max(0, player.position + steps),
    BOARD_SIZE - 1
  );

  // Only update if position actually changed
  if (newPosition !== player.position) {
    player.position = newPosition;
    const space = newGameState.board[newPosition];

    // Handle trap spaces with protection first
    if (space.type === "trap") {
      if (player.hasTrapProtection) {
        player.hasTrapProtection = false; // Use up protection
      } else if (space.points) {
        player.score = (player.score || 0) + space.points;
      }
    } else if (space.points) {
      // Handle non-trap points (treasure)
      player.score = (player.score || 0) + space.points;
    }

    // Apply space effects
    if (space.effect) {
      switch (space.effect) {
        case "Ekstra zar atma hakkı":
          // Keep the current player's turn
          newGameState.currentTurn = playerId;
          newGameState.diceRoll = null;
          return newGameState;

        case "Rakibi 2 adım geriye at":
          // Move the next player back 2 spaces
          const nextPlayerIndex =
            (newGameState.players.findIndex((p: Player) => p.id === playerId) +
              1) %
            newGameState.players.length;
          const targetPlayer = newGameState.players[nextPlayerIndex];
          if (targetPlayer) {
            targetPlayer.position = Math.max(0, targetPlayer.position - 2);
          }
          break;

        case "Bir sonraki tuzaktan korun":
          player.hasTrapProtection = true;
          break;
      }
    }
  }

  // Move to next player's turn (unless extra turn was granted)
  if (newGameState.currentTurn === playerId) {
    const currentPlayerIndex = newGameState.players.findIndex(
      (p: Player) => p.id === playerId
    );
    const nextPlayerIndex =
      (currentPlayerIndex + 1) % newGameState.players.length;
    newGameState.currentTurn = newGameState.players[nextPlayerIndex].id;
    newGameState.diceRoll = null;
  }

  return newGameState;
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
