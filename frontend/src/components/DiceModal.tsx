import { useEffect, useRef } from "react";
import ReactDice from "react-dice-roll";
import { Modal } from "./Modal";
import { useDiceStore } from "../stores/diceStore";

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
  const diceRef = useRef<any>(null);
  const { isRolling, setIsRolling, reset } = useDiceStore();
  const rollTimeoutRef = useRef<NodeJS.Timeout>();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rollTimeoutRef.current) {
        clearTimeout(rollTimeoutRef.current);
      }
    };
  }, []);

  // Handle modal close
  useEffect(() => {
    if (!isOpen) {
      reset();
      if (rollTimeoutRef.current) {
        clearTimeout(rollTimeoutRef.current);
      }
    }
  }, [isOpen, reset]);

  // Handle server dice value
  useEffect(() => {
    if (diceValue && diceRef.current && isOpen) {
      // Force the dice to show the server's value
      diceRef.current.rollDice(diceValue);

      // Clear any existing timeout
      if (rollTimeoutRef.current) {
        clearTimeout(rollTimeoutRef.current);
      }

      // Set new timeout for closing
      rollTimeoutRef.current = setTimeout(() => {
        onClose();
      }, 1000);
    }
  }, [diceValue, isOpen]);

  const handleRoll = () => {
    if (!isRolling && isOpen) {
      setIsRolling(true);
      onRollComplete();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false}>
      <div className="flex flex-col items-center justify-center p-4">
        <ReactDice
          ref={diceRef}
          size={100}
          triggers={["click"]}
          defaultValue={1}
          onRoll={handleRoll}
          rollingTime={800}
          disabled={isRolling || !!diceValue}
        />
      </div>
    </Modal>
  );
};
