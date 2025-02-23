import { useEffect } from "react";
import ReactDice from "react-dice-roll";
import { Modal } from "./Modal";

interface DiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRollComplete: () => void;
  diceValue?: number;
}

export const DiceModal = ({
  isOpen,
  onClose,
  onRollComplete,
  diceValue,
}: DiceModalProps) => {
  useEffect(() => {
    if (diceValue) {
      onClose(); // Close immediately when dice value is set
    }
  }, [diceValue]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false}>
      <div className="flex flex-col items-center justify-center p-4">
        <ReactDice
          size={100}
          triggers={["click"]} // Always allow click, we'll control this via disabled prop
          defaultValue={(diceValue || 1) as 1 | 2 | 3 | 4 | 5 | 6}
          onRoll={onRollComplete}
          rollingTime={1000}
          disabled={!!diceValue} // Disable when dice value is set
        />
      </div>
    </Modal>
  );
};
