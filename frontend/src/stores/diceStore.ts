import { create } from "zustand";

interface DiceState {
  isRolling: boolean;
  diceValue: number | null;
  setIsRolling: (rolling: boolean) => void;
  setDiceValue: (value: number | null) => void;
  reset: () => void;
}

export const useDiceStore = create<DiceState>((set) => ({
  isRolling: false,
  diceValue: null,
  setIsRolling: (rolling) => set({ isRolling: rolling }),
  setDiceValue: (value) => set({ diceValue: value }),
  reset: () => set({ isRolling: false, diceValue: null }),
}));
