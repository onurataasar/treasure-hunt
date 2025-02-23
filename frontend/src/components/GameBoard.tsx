import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Player, GameState, BoardSpace } from "../types/game";
import { socket } from "../services/socket";
import { Tutorial } from "./Tutorial";
import { GameIcons, IconSizes } from "../constants/icons";

const BOARD_SIZE = 36; // 6x6 grid
const DICE_FACES = [1, 2, 3, 4, 5, 6];

interface GameBoardProps {
  gameState: GameState;
  playerId: string;
}

export const GameBoard = ({ gameState, playerId }: GameBoardProps) => {
  const [isRolling, setIsRolling] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [lastAction, setLastAction] = useState<string>("");
  const isMyTurn = gameState.currentTurn === playerId;

  useEffect(() => {
    setIsRolling(false);
  }, [gameState.currentTurn]);

  const handleRollDice = () => {
    if (!isMyTurn || isRolling) return;
    setIsRolling(true);
    socket.emit("rollDice", { gameCode: gameState.gameCode, playerId });
  };

  useEffect(() => {
    if (gameState.diceRoll !== null) {
      setLastAction(`${getCurrentPlayer()?.name} ${gameState.diceRoll} attı!`);
    }
  }, [gameState.diceRoll]);

  const getCurrentPlayer = () => {
    return gameState.players.find((p) => p.id === gameState.currentTurn);
  };

  const getSpaceColor = (space: BoardSpace) => {
    switch (space.type) {
      case "treasure":
        return "bg-gold";
      case "trap":
        return "bg-ottoman-red";
      case "powerup":
        return "bg-turquoise";
      case "challenge":
        return "bg-navy text-white";
      default:
        return "bg-white";
    }
  };

  const getSpaceIcon = (type: string) => {
    switch (type) {
      case "treasure":
        return <GameIcons.Treasure className={IconSizes.lg} />;
      case "trap":
        return <GameIcons.Trap className={IconSizes.lg} />;
      case "powerup":
        return <GameIcons.Power className={IconSizes.lg} />;
      case "challenge":
        return <GameIcons.Challenge className={IconSizes.lg} />;
      default:
        return null;
    }
  };

  const renderDice = () => {
    return (
      <div className="mb-4 text-center">
        <AnimatePresence>
          {gameState.diceRoll !== null && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="inline-block bg-white rounded-xl shadow-lg p-6 text-4xl font-bold"
            >
              <div className="flex items-center gap-2">
                <GameIcons.Dice className={IconSizes.lg} />
                <span>{gameState.diceRoll}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {isMyTurn && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRollDice}
            disabled={isRolling}
            className="mt-4 bg-ottoman-red text-white py-3 px-6 rounded-lg font-semibold 
              disabled:opacity-50 disabled:cursor-not-allowed transition-all w-full sm:w-auto
              flex items-center justify-center gap-2"
          >
            <GameIcons.Dice className={IconSizes.md} />
            Zar At
          </motion.button>
        )}
      </div>
    );
  };

  const renderPlayerPiece = (player: Player) => {
    const row = Math.floor(player.position / 6);
    const col = player.position % 6;
    const isCurrentPlayer = player.id === playerId;
    const isCurrentTurn = player.id === gameState.currentTurn;

    return (
      <motion.div
        key={player.id}
        initial={false}
        animate={{
          x: col * (window.innerWidth < 640 ? 50 : 100),
          y: row * (window.innerWidth < 640 ? 50 : 100),
        }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className={`absolute w-6 h-6 sm:w-8 sm:h-8 -mt-3 -ml-3 sm:-mt-4 sm:-ml-4 rounded-full border-2 
          ${
            isCurrentPlayer
              ? "border-ottoman-red bg-white"
              : "border-navy bg-white"
          }
          shadow-lg flex items-center justify-center z-10 relative`}
      >
        <GameIcons.User
          className={`${IconSizes.sm} ${
            isCurrentPlayer ? "text-ottoman-red" : "text-navy"
          }`}
        />
        {isCurrentTurn && (
          <GameIcons.Crown
            className={`absolute -top-2 -right-2 ${IconSizes.sm} text-gold`}
          />
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-ivory p-4">
      <div className="max-w-4xl mx-auto">
        {/* Game Status */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
          <div className="text-lg font-semibold text-navy mb-2 flex items-center gap-2">
            {isMyTurn ? (
              <>
                <GameIcons.Crown className={IconSizes.md} />
                <span>Senin Sıran!</span>
              </>
            ) : (
              <>
                <GameIcons.User className={IconSizes.md} />
                <span>{getCurrentPlayer()?.name} oynuyor</span>
              </>
            )}
          </div>
          {lastAction && (
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <GameIcons.Dice className={IconSizes.sm} />
              {lastAction}
            </div>
          )}
        </div>

        {renderDice()}

        {/* Game Board */}
        <div className="relative mb-4 overflow-hidden">
          <div className="grid grid-cols-6 gap-1 sm:gap-2">
            {gameState.board.map((space, index) => (
              <motion.div
                key={space.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                className={`${getSpaceColor(
                  space
                )} w-12 h-12 sm:w-24 sm:h-24 rounded-lg shadow-md flex items-center justify-center flex-col`}
              >
                {getSpaceIcon(space.type)}
                {space.points && (
                  <span className="text-xs sm:text-sm font-semibold mt-1">
                    {space.points > 0 ? `+${space.points}` : space.points}
                  </span>
                )}
              </motion.div>
            ))}
          </div>

          {/* Player pieces */}
          {gameState.players.map((player) => renderPlayerPiece(player))}
        </div>

        {/* Scoreboard */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <GameIcons.Trophy className={IconSizes.md} />
            Skor Tablosu
          </h2>
          <div className="space-y-2">
            {gameState.players
              .sort((a, b) => b.score - a.score)
              .map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                >
                  <span className="font-medium flex items-center gap-2">
                    <GameIcons.User
                      className={`${IconSizes.sm} ${
                        player.id === playerId
                          ? "text-ottoman-red"
                          : "text-navy"
                      }`}
                    />
                    {player.name}
                    {player.id === gameState.currentTurn && (
                      <GameIcons.Crown
                        className={`${IconSizes.sm} text-gold`}
                      />
                    )}
                  </span>
                  <span className="font-bold text-ottoman-red">
                    {player.score}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Help Button */}
        <button
          onClick={() => setShowTutorial(true)}
          className="fixed bottom-4 right-4 bg-turquoise text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center"
        >
          <GameIcons.Question className={IconSizes.md} />
        </button>

        {/* Tutorial */}
        <AnimatePresence>
          {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
        </AnimatePresence>
      </div>
    </div>
  );
};
