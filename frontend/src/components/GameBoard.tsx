import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Player, GameState, BoardSpace } from "../types/game";
import { socket } from "../services/socket";
import { Tutorial } from "./Tutorial";
import { GameIcons, IconSizes } from "../constants/icons";
import { MinusIcon, PlusIcon } from "@heroicons/react/24/solid";
import { DiceModal } from "./DiceModal";
import { RoundEffectsModal } from "./RoundEffectsModal";

const BOARD_SIZE = 36;
const SPACE_SIZE = 90; // Slightly larger for better visibility
const SPACE_GAP = 60; // Much larger gap for better distribution
const BOARD_COLUMNS = 12;
const ANIMATION_DURATION = 1.2;

// Calculate positions with better distribution
const BASE_POSITIONS = Array.from({ length: BOARD_SIZE }, (_, i) => {
  const row = Math.floor(i / BOARD_COLUMNS);
  const isReversedRow = row % 2 === 1;
  const col = isReversedRow
    ? BOARD_COLUMNS - 1 - (i % BOARD_COLUMNS)
    : i % BOARD_COLUMNS;

  // Add more random distribution but keep it controlled
  const randomX = (Math.random() - 0.5) * SPACE_GAP * 0.5;
  const randomY = (Math.random() - 0.5) * SPACE_GAP * 0.5;

  return {
    baseX: col * (SPACE_SIZE + SPACE_GAP) + randomX,
    baseY: row * (SPACE_SIZE + SPACE_GAP * 1.5) + randomY,
  };
});

// Helper function to determine connector points
const getConnectorPoints = (
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  size: number
) => {
  // Calculate center points
  const fromCenterX = fromX + size / 2;
  const fromCenterY = fromY + size / 2;
  const toCenterX = toX + size / 2;
  const toCenterY = toY + size / 2;

  // Determine which sides to connect from
  const dx = toCenterX - fromCenterX;
  const dy = toCenterY - fromCenterY;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  let startX, startY, endX, endY;

  if (absDx > absDy) {
    // Connect horizontally
    startX = dx > 0 ? fromX + size : fromX;
    startY = fromCenterY;
    endX = dx > 0 ? toX : toX + size;
    endY = toCenterY;
  } else {
    // Connect vertically
    startX = fromCenterX;
    startY = dy > 0 ? fromY + size : fromY;
    endX = toCenterX;
    endY = dy > 0 ? toY : toY + size;
  }

  return { startX, startY, endX, endY };
};

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
  const [selectedSpace, setSelectedSpace] = useState<BoardSpace | null>(null);
  const [currentEffect, setCurrentEffect] = useState<{
    player: Player;
    space: BoardSpace;
  } | null>(null);
  const [previousPositions, setPreviousPositions] = useState<
    Record<string, number>
  >({});
  const isMyTurn = gameState.currentTurn === playerId;
  const transformComponentRef = useRef<any>(null);

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
    const position = BASE_POSITIONS[index];
    const paddingX = SPACE_GAP * 2;
    const paddingY = SPACE_GAP * 2;

    return {
      x: paddingX + position.baseX,
      y: paddingY + position.baseY,
    };
  };

  const renderBoardSpace = (space: BoardSpace, index: number) => {
    const { x, y } = getBoardSpacePosition(index);
    const nextIndex = index + 1;
    const row = Math.floor(index / BOARD_COLUMNS);
    const isReversedRow = row % 2 === 1;
    const isLastInRow = (index + 1) % BOARD_COLUMNS === 0;
    const isFirstInRow = index % BOARD_COLUMNS === 0;

    // Fix next position logic for row transitions
    const nextPos =
      nextIndex < BOARD_SIZE
        ? (isLastInRow && !isReversedRow) || (isFirstInRow && isReversedRow)
          ? getBoardSpacePosition(nextIndex)
          : nextIndex % BOARD_COLUMNS !== 0 || isReversedRow
          ? getBoardSpacePosition(nextIndex)
          : null
        : null;

    // Calculate SVG path for connector
    const renderConnector = () => {
      if (!nextPos) return null;

      // Calculate the direction vector
      const dx = nextPos.x - x;
      const dy = nextPos.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Start from the edge of current space
      const startX = SPACE_SIZE / 2;
      const startY = SPACE_SIZE / 2;

      // End at the edge of next space
      const endX = startX + distance;
      const endY = startY;

      // Add a curve that follows the path direction
      const midX = (startX + endX) / 2;
      const curveDirection = isReversedRow ? -1 : 1;
      const curveAmount = Math.min(40, distance * 0.2); // Adjust curve based on distance
      const midY = startY + curveDirection * curveAmount;

      return (
        <path
          d={`M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`}
          stroke="rgba(0,0,0,0.2)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          style={{
            transform: `rotate(${Math.atan2(dy, dx) * (180 / Math.PI)}deg)`,
            transformOrigin: `${startX}px ${startY}px`,
          }}
        />
      );
    };

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
        {/* SVG Connector - render before space to be under it */}
        {nextPos && (
          <svg
            className="absolute top-0 left-0"
            width={SPACE_SIZE * 2}
            height={SPACE_SIZE * 2}
            style={{
              pointerEvents: "none",
              overflow: "visible",
            }}
          >
            {renderConnector()}
          </svg>
        )}

        {/* Space background */}
        <div
          onClick={() => setSelectedSpace(space)}
          className={`${getSpaceColor(
            space
          )} w-full h-full rounded-lg shadow-lg flex flex-col items-center justify-center
          relative transition-transform hover:scale-105 cursor-pointer border-2 ${
            space.type === "normal" ? "border-navy/10" : "border-gray-200/30"
          }`}
          style={{
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            ...(space.type === "normal" && {
              background: `
                linear-gradient(135deg, #ffffff 21px, #f3f4f6 22px, #f3f4f6 24px, transparent 24px, transparent 67px, #f3f4f6 67px, #f3f4f6 69px, transparent 69px),
                linear-gradient(225deg, #ffffff 21px, #f3f4f6 22px, #f3f4f6 24px, transparent 24px, transparent 67px, #f3f4f6 67px, #f3f4f6 69px, transparent 69px)`,
              backgroundColor: "#ffffff",
              backgroundSize: "64px 64px",
            }),
          }}
        >
          {getSpaceIcon(space.type)}
          {space.points && (
            <span className="text-sm font-semibold mt-1">
              {space.points > 0 ? `+${space.points}` : space.points}
            </span>
          )}
          {space.type === "normal" && (
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-navy/[0.02] to-ottoman-red/[0.02]" />
          )}
        </div>

        {/* Space number */}
        <div
          className={`absolute -top-1 -left-1 w-5 h-5 ${
            space.type === "normal" ? "bg-gray-400" : "bg-gray-800"
          } rounded-full flex items-center justify-center text-xs text-white font-medium`}
          style={{ opacity: space.type === "normal" ? 0.2 : 0.3 }}
        >
          {index + 1}
        </div>
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
          left: prevPos.x + SPACE_SIZE - 16,
          top: prevPos.y + SPACE_SIZE - 16,
        }}
        animate={{
          left: currentPos.x + SPACE_SIZE - 16,
          top: currentPos.y + SPACE_SIZE - 16,
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

  const focusOnPlayer = (player: Player) => {
    if (!transformComponentRef.current) return;

    const { x, y } = getBoardSpacePosition(player.position);
    const boardContainer = document.querySelector(".react-transform-component");
    if (!boardContainer) return;

    const scale = 1.2;
    const containerWidth = boardContainer.clientWidth;
    const containerHeight = boardContainer.clientHeight;

    // Calculate the center position including padding and space size
    const centerX = -(x - containerWidth / 2 + SPACE_SIZE / 2);
    const centerY = -(y - containerHeight / 2 + SPACE_SIZE / 2);

    transformComponentRef.current.setTransform(
      centerX * scale,
      centerY * scale,
      scale
    );
  };

  const getSpaceDescription = (space: BoardSpace) => {
    switch (space.type) {
      case "treasure":
        return `Hazine! ${space.points} puan kazanırsın.`;
      case "trap":
        return `Tuzak! ${space.points} puan kaybedersin.`;
      case "powerup":
        return `Güç: ${space.effect}`;
      case "challenge":
        return "Meydan okuma karesi!";
      default:
        return "Normal kare";
    }
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

      {/* Space Info Modal */}
      <AnimatePresence>
        {selectedSpace && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-xl shadow-lg p-4 min-w-[300px]"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getSpaceIcon(selectedSpace.type)}
                <span className="font-semibold capitalize">
                  {selectedSpace.type} Karesi
                </span>
              </div>
              <button
                onClick={() => setSelectedSpace(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <GameIcons.Close className={IconSizes.sm} />
              </button>
            </div>
            <p className="text-gray-600">
              {getSpaceDescription(selectedSpace)}
            </p>
            {/* Show players on this space */}
            {gameState.players.filter((p) => p.position === selectedSpace.id)
              .length > 0 && (
              <div className="mt-2 pt-2 border-t">
                <p className="text-sm text-gray-500 mb-1">
                  Bu karedeki oyuncular:
                </p>
                <div className="flex gap-2">
                  {gameState.players
                    .filter((p) => p.position === selectedSpace.id)
                    .map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center gap-1 text-sm"
                      >
                        <GameIcons.User
                          className={`${IconSizes.sm} ${
                            player.id === playerId
                              ? "text-ottoman-red"
                              : "text-navy"
                          }`}
                        />
                        <span>{player.name}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-ivory p-4">
        <div className="max-w-[1600px] mx-auto">
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
          <div className="relative mb-4 bg-white rounded-xl shadow-lg p-4 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-navy/5 to-ottoman-red/5" />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 10% 20%, rgba(0, 165, 168, 0.05) 0%, transparent 20%),
                  radial-gradient(circle at 90% 80%, rgba(232, 31, 61, 0.05) 0%, transparent 20%),
                  linear-gradient(45deg, rgba(0,0,0,0.02) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.02) 75%),
                  linear-gradient(-45deg, rgba(0,0,0,0.02) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.02) 75%)
                `,
                backgroundSize: "100% 100%, 100% 100%, 40px 40px, 40px 40px",
                backgroundPosition: "0 0, 0 0, 0 0, 20px 20px",
              }}
            />
            <TransformWrapper
              initialScale={0.7}
              minScale={0.4}
              maxScale={1.5}
              centerOnInit={true}
              limitToBounds={false}
              wheel={{ step: 0.05 }}
              doubleClick={{ disabled: true }}
              alignmentAnimation={{ disabled: true }}
              centerZoomedOut={false}
            >
              {({ zoomIn, zoomOut, setTransform }) => {
                // Store the ref to access transform methods
                transformComponentRef.current = { setTransform };
                return (
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
                      wrapperClass="!w-full !h-[500px]"
                      contentClass="!w-full !h-full flex items-center justify-center"
                    >
                      <div
                        className="relative"
                        style={{
                          width:
                            BOARD_COLUMNS * (SPACE_SIZE + SPACE_GAP) +
                            SPACE_GAP * 4,
                          height:
                            Math.ceil(BOARD_SIZE / BOARD_COLUMNS) *
                              (SPACE_SIZE + SPACE_GAP) +
                            SPACE_GAP * 4,
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
                );
              }}
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
                    <button
                      onClick={() => focusOnPlayer(player)}
                      className="font-medium flex items-center gap-2 hover:text-ottoman-red transition-colors"
                    >
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
                    </button>
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
