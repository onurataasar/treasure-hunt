import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { Player, GameState } from "../types/game";
import { socket } from "../services/socket";

interface LobbyScreenProps {
  gameState: GameState;
  playerId: string;
}

export const LobbyScreen = ({ gameState, playerId }: LobbyScreenProps) => {
  const isHost = gameState.players.find((p) => p.id === playerId)?.isHost;
  const joinUrl = `${window.location.origin}?code=${gameState.gameCode}`;

  const handleStartGame = () => {
    socket.emit("startGame", gameState.gameCode);
  };

  const handleToggleReady = () => {
    socket.emit("toggleReady", { gameCode: gameState.gameCode, playerId });
  };

  return (
    <div className="min-h-screen bg-ivory p-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <h1 className="text-3xl font-bold text-navy mb-6">
            Hazine Yolculuğu
          </h1>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Oyun Kodu:</h2>
            <div className="text-4xl font-mono text-ottoman-red tracking-wider">
              {gameState.gameCode}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">QR Kod ile Katıl:</h2>
            <div className="bg-white p-4 inline-block rounded-lg shadow-md">
              <QRCodeSVG value={joinUrl} size={200} />
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Oyuncular:</h2>
            <div className="space-y-2">
              {gameState.players.map((player) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                >
                  <span className="font-medium">
                    {player.name} {player.isHost && "(Ev Sahibi)"}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      player.isReady ? "bg-turquoise text-white" : "bg-gray-200"
                    }`}
                  >
                    {player.isReady ? "Hazır" : "Bekleniyor"}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {!isHost && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleToggleReady}
              className="w-full bg-turquoise text-white py-3 px-6 rounded-lg font-semibold mb-4"
            >
              {gameState.players.find((p) => p.id === playerId)?.isReady
                ? "Hazır Değilim"
                : "Hazırım"}
            </motion.button>
          )}

          {isHost && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartGame}
              disabled={!gameState.players.every((p) => p.isReady)}
              className="w-full bg-ottoman-red text-white py-3 px-6 rounded-lg font-semibold 
                disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Oyunu Başlat
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
};
