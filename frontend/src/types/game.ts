export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  position: number;
  score: number;
  hasTrapProtection?: boolean;
}

export interface GameState {
  gameCode: string;
  players: Player[];
  isStarted: boolean;
  maxPlayers: number;
  currentTurn: string; // player id
  board: BoardSpace[];
  diceRoll: number | null;
}

export type SpaceType =
  | "normal"
  | "treasure"
  | "trap"
  | "powerup"
  | "challenge";

export interface BoardSpace {
  id: number;
  type: SpaceType;
  effect?: string;
  points?: number;
}

export interface GameAction {
  type: "ROLL_DICE" | "MOVE_PLAYER" | "USE_POWERUP" | "COMPLETE_CHALLENGE";
  playerId: string;
  data?: any;
}
