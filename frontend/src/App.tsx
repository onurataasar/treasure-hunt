import { useState, useEffect } from "react";
import { LobbyScreen } from "./components/LobbyScreen";
import { GameBoard } from "./components/GameBoard";
import { socket } from "./services/socket";
import { GameState } from "./types/game";

function App() {
  const [playerName, setPlayerName] = useState("");
  const [playerId, setPlayerId] = useState<string>("");
  const [gameCode, setGameCode] = useState("");
  const [gameState, setGameState] = useState<GameState>({
    gameCode: "",
    players: [],
    isStarted: false,
    maxPlayers: 6,
    currentTurn: "",
    board: [],
    diceRoll: null,
  });
  const [winner, setWinner] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    // Check if we have a game code in the URL (from QR code)
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get("code");
    if (codeFromUrl) {
      setGameCode(codeFromUrl.toUpperCase());
      setIsJoining(true);
    }

    socket.on("gameState", (state: GameState) => {
      setGameState(state);
    });

    socket.on("playerId", (id: string) => {
      setPlayerId(id);
      setHasJoined(true);
      // Clean up URL after successful join
      window.history.replaceState({}, document.title, window.location.pathname);
    });

    socket.on("gameWon", (winnerId: string) => {
      setWinner(winnerId);
    });

    socket.on("error", (message: string) => {
      alert(message);
      if (isJoining) {
        setIsJoining(false);
        setGameCode("");
      }
    });

    return () => {
      socket.off("gameState");
      socket.off("playerId");
      socket.off("gameWon");
      socket.off("error");
    };
  }, [isJoining]);

  const handleCreateGame = () => {
    if (!playerName.trim()) return;
    socket.emit("createGame", playerName);
  };

  const handleJoinGame = () => {
    if (!playerName.trim() || !gameCode.trim()) return;
    socket.emit("joinGame", { gameCode: gameCode.toUpperCase(), playerName });
  };

  const renderWinnerModal = () => {
    if (!winner) return null;
    const winnerPlayer = gameState.players.find((p) => p.id === winner);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">
            🎉 Tebrikler {winnerPlayer?.name}! 🎉
          </h2>
          <p className="mb-6">Oyunu Kazandın!</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-ottoman-red text-white py-2 px-6 rounded-lg font-semibold"
          >
            Yeni Oyun
          </button>
        </div>
      </div>
    );
  };

  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-navy mb-6">
            Hazine Yolculuğu
          </h1>

          <input
            type="text"
            placeholder="Adınız"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-ottoman-red"
          />

          {isJoining ? (
            <>
              <input
                type="text"
                placeholder="Oyun Kodu"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-ottoman-red font-mono uppercase"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setIsJoining(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Geri
                </button>
                <button
                  onClick={handleJoinGame}
                  disabled={!gameCode.trim() || !playerName.trim()}
                  className="flex-1 bg-ottoman-red text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Katıl
                </button>
              </div>
            </>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCreateGame}
                className="flex-1 bg-ottoman-red text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Oyun Oluştur
              </button>
              <button
                onClick={() => setIsJoining(true)}
                className="flex-1 bg-turquoise text-white py-3 px-6 rounded-lg font-semibold hover:bg-teal-600 transition-colors"
              >
                Oyuna Katıl
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {gameState.isStarted ? (
        <GameBoard gameState={gameState} playerId={playerId} />
      ) : (
        <LobbyScreen gameState={gameState} playerId={playerId} />
      )}
      {renderWinnerModal()}
    </>
  );
}

export default App;
