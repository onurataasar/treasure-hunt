import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { GameIcons, IconSizes } from "../constants/icons";
import { Player, BoardSpace } from "../types/game";

interface RoundEffectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
  space: BoardSpace;
}

export const RoundEffectsModal = ({
  isOpen,
  onClose,
  player,
  space,
}: RoundEffectsModalProps) => {
  const getEffectIcon = () => {
    switch (space.type) {
      case "treasure":
        return <GameIcons.Treasure className={IconSizes.xl} />;
      case "trap":
        return <GameIcons.Trap className={IconSizes.xl} />;
      case "powerup":
        return <GameIcons.Power className={IconSizes.xl} />;
      case "challenge":
        return <GameIcons.Challenge className={IconSizes.xl} />;
      default:
        return null;
    }
  };

  const getEffectDescription = () => {
    if (space.points) {
      if (space.type === "treasure") {
        return `${player.name} hazine buldu! +${space.points} puan kazandı!`;
      } else if (space.type === "trap") {
        if (player.hasTrapProtection) {
          return `${player.name} tuzaktan korundu! Tuzak etkisi yok edildi.`;
        }
        return `${player.name} tuzağa düştü! ${space.points} puan kaybetti!`;
      }
    }

    if (space.effect) {
      return `${player.name} güç kazandı: ${space.effect}`;
    }

    return `${player.name} normal bir kareye geldi.`;
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-bold leading-6 text-gray-900 flex items-center gap-2 mb-4"
                >
                  {getEffectIcon()}
                  Kare Etkisi
                </Dialog.Title>

                <div className="mt-2">
                  <p className="text-lg text-gray-700">
                    {getEffectDescription()}
                  </p>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    className="w-full bg-ottoman-red text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                    onClick={onClose}
                  >
                    Tamam
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
