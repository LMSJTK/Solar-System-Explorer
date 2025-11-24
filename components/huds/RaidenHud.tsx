import React from 'react';
import { Trophy, ChevronsUp, Zap, Heart, Shield } from 'lucide-react';
import { RaidenState } from '../../types';

interface RaidenHudProps {
  raidenRef: React.MutableRefObject<RaidenState>;
  score: number;
  hp: number;
  shield: number;
  onExit: () => void;
  onRestart: () => void;
}

export const RaidenHud: React.FC<RaidenHudProps> = ({
  raidenRef,
  score,
  hp,
  shield,
  onExit,
  onRestart,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-4 left-4 pointer-events-auto">
        <button
          onClick={onExit}
          className="px-4 py-2 bg-red-900/80 border border-red-500/50 text-red-400 text-xs hover:bg-red-900/20"
        >
          ABORT MISSION
        </button>
      </div>

      <div className="absolute top-4 right-4 text-right">
        <div className="text-4xl font-mono font-bold text-red-500 drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]">
          {score}
        </div>
        <div className="text-xs text-red-800 tracking-widest mt-1">HOSTILES ELIMINATED</div>
      </div>

      {/* Powerup Status Icons */}
      <div className="absolute top-20 right-4 flex flex-col gap-2 items-end">
        {raidenRef.current.player.weaponLevel > 1 && (
          <div className="flex items-center gap-2 text-red-400 text-xs font-bold animate-pulse">
            WEAPON LVL {raidenRef.current.player.weaponLevel} <ChevronsUp size={16} />
          </div>
        )}
        {raidenRef.current.player.speedLevel > 1 && (
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold animate-pulse">
            SPEED BOOST x{raidenRef.current.player.speedLevel} <Zap size={16} />
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div className="absolute bottom-32 left-8 right-8 flex gap-4">
        {/* Health Bar */}
        <div className="flex-1 h-4 bg-gray-900 border border-gray-700 rounded-full overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-300"
            style={{ width: `${Math.max(0, hp)}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white/80 gap-1">
            <Heart size={10} fill="currentColor" /> HULL INTEGRITY: {Math.round(hp)}%
          </div>
        </div>

        {/* Shield Bar (Only if active) */}
        {shield > 0 && (
          <div className="flex-1 h-4 bg-gray-900 border border-cyan-700 rounded-full overflow-hidden relative animate-in fade-in zoom-in duration-300">
            <div
              className="h-full bg-gradient-to-r from-cyan-600 to-blue-500 transition-all duration-300"
              style={{ width: `${Math.max(0, shield)}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-cyan-100 gap-1">
              <Shield size={10} fill="currentColor" /> SHIELD: {Math.round(shield)}%
            </div>
          </div>
        )}
      </div>

      {raidenRef.current.gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto">
          <div className="text-center p-8 border-2 border-red-500 bg-black rounded-xl shadow-[0_0_50px_rgba(239,68,68,0.5)]">
            <h2 className="text-4xl font-bold text-red-500 mb-2">MISSION FAILED</h2>
            <div className="text-2xl text-white mb-6 flex items-center justify-center gap-2">
              <Trophy className="text-yellow-500" /> Final Score: {score}
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={onRestart}
                className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded"
              >
                RETRY MISSION
              </button>
              <button
                onClick={onExit}
                className="px-6 py-3 border border-gray-600 hover:bg-gray-800 text-gray-400 rounded"
              >
                RETURN TO BASE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
