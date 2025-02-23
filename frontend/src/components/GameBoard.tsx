import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Player, GameState, BoardSpace } from "../types/game";
import { socket } from "../services/socket";
import { Tutorial } from "./Tutorial";
import { GameIcons, IconSizes } from "../constants/icons";
import { MinusIcon, PlusIcon } from "@heroicons/react/24/solid";
import { DiceModal } from "./DiceModal";
import { RoundEffectsModal } from "./RoundEffectsModal";

const BOARD_SIZE = 36; // 6x6 grid
const SPACE_SIZE = 80; // Increased size for better visibility
const SPACE_GAP = 30; // Increased gap between spaces
const BOARD_COLUMNS = 6;
const ANIMATION_DURATION = 1.2; // Increased from 0.5 to 1.2 seconds

interface GameBoardProps {
  gameState: GameState;
  playerId: string;
}

export const GameBoard = ({ gameState, playerId }: GameBoardProps) => {
  const [isRolling, setIsRolling] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [lastAction, setLastAction] = useState<string>("");
  const [movingPlayerId, setMovingPlayerId] = useState<string | null>(null);
  const [showDiceModal, setShowDiceModal] = useState(false);
  const [showEffectsModal, setShowEffectsModal] = useState(false);
  const [currentEffect, setCurrentEffect] = useState<{
    player: Player;
    space: BoardSpace;
  } | null>(null);
  const [previousPositions, setPreviousPositions] = useState<
    Record<string, number>
  >({});
  const isMyTurn = gameState.currentTurn === playerId;

  // Initialize previous positions
  useEffect(() => {
    const newPositions: Record<string, number> = {};
    gameState.players.forEach((player) => {
      if (!(player.id in previousPositions)) {
        newPositions[player.id] = player.position;
      }
    });
    if (Object.keys(newPositions).length > 0) {
      setPreviousPositions((prev) => ({ ...prev, ...newPositions }));
    }
  }, []);

  // Handle dice roll and movement
  useEffect(() => {
    if (gameState.diceRoll !== null && gameState.currentTurn) {
      const currentPlayer = gameState.players.find(
        (p) => p.id === gameState.currentTurn
      );
      if (currentPlayer) {
        const prevPos = previousPositions[currentPlayer.id] ?? 0;
        if (prevPos !== currentPlayer.position) {
          setMovingPlayerId(currentPlayer.id);
          setTimeout(() => {
            setPreviousPositions((prev) => ({
              ...prev,
              [currentPlayer.id]: currentPlayer.position,
            }));
            setMovingPlayerId(null);

            // Show effects modal after movement
            const space = gameState.board[currentPlayer.position];
            if (space.type !== "normal") {
              setCurrentEffect({
                player: currentPlayer,
                space: space,
              });
              setShowEffectsModal(true);
            }
          }, ANIMATION_DURATION * 1000);
        }
      }
    }
  }, [gameState.diceRoll, gameState.currentTurn]);

  const handleRollDice = () => {
    if (!isMyTurn || isRolling || gameState.diceRoll !== null) return;
    setIsRolling(true);
    setShowDiceModal(true);
  };

  const handleRollComplete = () => {
    socket.emit("rollDice", { gameCode: gameState.gameCode, playerId });
  };

  useEffect(() => {
    if (gameState.diceRoll !== null) {
      setLastAction(`${getCurrentPlayer()?.name} ${gameState.diceRoll} attı!`);
      setIsRolling(false);
    }
  }, [gameState.diceRoll]);

  // Reset isRolling when turn changes
  useEffect(() => {
    setIsRolling(false);
  }, [gameState.currentTurn]);

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
        return <GameIcons.Treasure className={IconSizes.md} />;
      case "trap":
        return <GameIcons.Trap className={IconSizes.md} />;
      case "powerup":
        return <GameIcons.Power className={IconSizes.md} />;
      case "challenge":
        return <GameIcons.Challenge className={IconSizes.md} />;
      default:
        return null;
    }
  };

  const isReversedRow = (row: number) => row % 2 === 1;

  const getBoardSpacePosition = (index: number) => {
    const row = Math.floor(index / BOARD_COLUMNS);
    const isReversedRow = row % 2 === 1;
    const col = isReversedRow
      ? BOARD_COLUMNS - 1 - (index % BOARD_COLUMNS)
      : index % BOARD_COLUMNS;

    // Add padding to the board
    const paddingX = SPACE_GAP;
    const paddingY = SPACE_GAP;

    return {
      x: paddingX + col * (SPACE_SIZE + SPACE_GAP),
      y: paddingY + row * (SPACE_SIZE + SPACE_GAP),
    };
  };

  const renderBoardSpace = (space: BoardSpace, index: number) => {
    const { x, y } = getBoardSpacePosition(index);

    return (
      <motion.div
        key={space.id}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.02 }}
        className="absolute"
        style={{
          width: SPACE_SIZE,
          height: SPACE_SIZE,
          left: x,
          top: y,
        }}
      >
        {/* Space background */}
        <div
          className={`${getSpaceColor(
            space
          )} w-full h-full rounded-lg shadow-md flex flex-col items-center justify-center
          relative transition-transform hover:scale-105 cursor-pointer`}
        >
          {getSpaceIcon(space.type)}
          {space.points && (
            <span className="text-sm font-semibold mt-1">
              {space.points > 0 ? `+${space.points}` : space.points}
            </span>
          )}
        </div>

        {/* Connectors */}
        {index < BOARD_SIZE - 1 && (
          <>
            {/* Horizontal connector */}
            {(index + 1) % BOARD_COLUMNS !== 0 && (
              <div
                className="absolute bg-gray-300"
                style={{
                  width: SPACE_GAP,
                  height: "4px",
                  left: SPACE_SIZE,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
            )}
            {/* Vertical connector for snake pattern */}
            {(index + 1) % BOARD_COLUMNS === 0 &&
              index < BOARD_SIZE - BOARD_COLUMNS && (
                <div
                  className="absolute bg-gray-300"
                  style={{
                    width: "4px",
                    height: SPACE_GAP,
                    left: isReversedRow(Math.floor(index / BOARD_COLUMNS))
                      ? 0
                      : SPACE_SIZE,
                    top: SPACE_SIZE,
                  }}
                />
              )}
          </>
        )}
      </motion.div>
    );
  };

  const renderPlayerPiece = (player: Player, index: number, total: number) => {
    const isCurrentPlayer = player.id === playerId;
    const isCurrentTurn = player.id === gameState.currentTurn;
    const isMoving = movingPlayerId === player.id;
    const prevPosition = previousPositions[player.id] ?? 0;
    const currentPosition = player.position;

    // Calculate positions for animation
    const prevPos = getBoardSpacePosition(prevPosition);
    const currentPos = getBoardSpacePosition(currentPosition);

    // Calculate offset for multiple players on same space
    const offset = total > 1 ? (index - (total - 1) / 2) * 25 : 0;

    return (
      <motion.div
        key={player.id}
        initial={false}
        className="absolute"
        style={{
          width: "32px",
          height: "32px",
          zIndex: isMoving ? 30 : 20,
          left: prevPos.x + SPACE_SIZE / 2,
          top: prevPos.y + SPACE_SIZE / 2,
        }}
        animate={{
          left: currentPos.x + SPACE_SIZE / 2,
          top: currentPos.y + SPACE_SIZE / 2,
          translateX: offset,
          scale: isMoving ? [1, 1.4, 1] : 1,
          rotate: isMoving ? [0, 720] : 0,
        }}
        transition={{
          duration: isMoving ? ANIMATION_DURATION : 0,
          ease: "easeInOut",
          times: isMoving ? [0, 0.6, 1] : undefined,
        }}
      >
        <div
          className={`w-full h-full rounded-full border-2 
            ${
              isCurrentPlayer
                ? "border-ottoman-red bg-white"
                : "border-navy bg-white"
            }
            shadow-lg flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2`}
        >
          <GameIcons.User
            className={`${IconSizes.md} ${
              isCurrentPlayer ? "text-ottoman-red" : "text-navy"
            }`}
          />
          {isCurrentTurn && (
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-gold rounded-full flex items-center justify-center">
              <GameIcons.Crown className={IconSizes.xs} />
            </div>
          )}
          {player.hasTrapProtection && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-turquoise rounded-full flex items-center justify-center">
              <GameIcons.Power className={IconSizes.xs} />
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const renderDice = () => {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
        <AnimatePresence>
          {gameState.diceRoll !== null && (
            <motion.div
              initial={{ scale: 0, y: -50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, y: -50 }}
              className="bg-white rounded-xl shadow-lg p-4 text-4xl font-bold flex items-center gap-3"
            >
              <GameIcons.Dice className={IconSizes.xl} />
              <span className="text-navy">{gameState.diceRoll}</span>
            </motion.div>
          )}
        </AnimatePresence>
        {isMyTurn && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRollDice}
            disabled={isRolling || gameState.diceRoll !== null}
            className="mt-4 bg-ottoman-red text-white py-3 px-6 rounded-lg font-semibold 
              disabled:opacity-50 disabled:cursor-not-allowed transition-all w-full
              flex items-center justify-center gap-2 shadow-lg hover:bg-red-700"
          >
            <GameIcons.Dice className={IconSizes.md} />
            {gameState.diceRoll !== null ? "Zar Atıldı" : "Zar At"}
          </motion.button>
        )}
      </div>
    );
  };

  return (
    <>
      <DiceModal
        isOpen={showDiceModal}
        onClose={() => setShowDiceModal(false)}
        onRollComplete={handleRollComplete}
        diceValue={gameState.diceRoll || undefined}
      />
      {currentEffect && (
        <RoundEffectsModal
          isOpen={showEffectsModal}
          onClose={() => setShowEffectsModal(false)}
          player={currentEffect.player}
          space={currentEffect.space}
        />
      )}
      <div className="min-h-screen bg-ivory p-4">
        <div className="max-w-7xl mx-auto">
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

          {/* Game Board with Zoom Controls */}
          <div className="relative mb-4 bg-white rounded-xl shadow-lg p-4">
            <TransformWrapper
              initialScale={1}
              minScale={0.5}
              maxScale={2}
              centerOnInit={true}
              limitToBounds={true}
              wheel={{ step: 0.1 }}
            >
              {({ zoomIn, zoomOut }) => (
                <>
                  <div className="absolute top-4 right-4 flex gap-2 z-30">
                    <button
                      onClick={() => zoomIn()}
                      className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50"
                    >
                      <PlusIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => zoomOut()}
                      className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50"
                    >
                      <MinusIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <TransformComponent
                    wrapperClass="!w-full !h-[600px]"
                    contentClass="!w-full !h-full flex items-center justify-center"
                  >
                    <div
                      className="relative bg-gradient-to-br from-ivory to-gray-100 rounded-lg p-8"
                      style={{
                        width:
                          BOARD_COLUMNS * (SPACE_SIZE + SPACE_GAP) +
                          SPACE_GAP * 2,
                        height:
                          Math.ceil(BOARD_SIZE / BOARD_COLUMNS) *
                            (SPACE_SIZE + SPACE_GAP) +
                          SPACE_GAP * 2,
                      }}
                    >
                      {/* Render board spaces */}
                      {gameState.board.map((space, index) =>
                        renderBoardSpace(space, index)
                      )}

                      {/* Render all players */}
                      {gameState.players.map((player, idx) => {
                        const playersOnSameSpace = gameState.players.filter(
                          (p) => p.position === player.position
                        );
                        const indexOnSpace = playersOnSameSpace.findIndex(
                          (p) => p.id === player.id
                        );
                        return renderPlayerPiece(
                          player,
                          indexOnSpace,
                          playersOnSameSpace.length
                        );
                      })}
                    </div>
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
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
            className="fixed bottom-4 right-4 bg-turquoise text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:bg-teal-600 transition-colors"
          >
            <GameIcons.Question className={IconSizes.md} />
          </button>

          {/* Tutorial */}
          <AnimatePresence>
            {showTutorial && (
              <Tutorial onClose={() => setShowTutorial(false)} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};
