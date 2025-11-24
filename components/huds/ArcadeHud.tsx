import React from 'react';
import { Trophy, Target, RotateCcw } from 'lucide-react';

interface ArcadeHudProps {
  score: number;
  gameOver: boolean;
  onExit: () => void;
  onRestart: () => void;
  onFireBullet: () => void;
}

export const ArcadeHud: React.FC<ArcadeHudProps> = ({
  score,
  gameOver,
  onExit,
  onRestart,
  onFireBullet,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center">
        <div className="text-4xl font-mono font-bold text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
          {score}
        </div>
        <div className="text-xs text-cyan-600 tracking-widest mt-1">SIMULATION MODE</div>
      </div>

      <button
        onClick={onExit}
        className="absolute top-4 left-4 pointer-events-auto px-4 py-2 bg-gray-900/80 border border-red-500/50 text-red-400 text-xs hover:bg-red-900/20"
      >
        ABORT SIMULATION
      </button>

      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
          <div className="text-center p-8 border-2 border-red-500 bg-black rounded-xl shadow-[0_0_50px_rgba(239,68,68,0.5)]">
            <h2 className="text-4xl font-bold text-red-500 mb-2">CRITICAL FAILURE</h2>
            <div className="text-2xl text-white mb-6 flex items-center justify-center gap-2">
              <Trophy className="text-yellow-500" /> Score: {score}
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={onRestart}
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded flex items-center gap-2"
              >
                <RotateCcw size={18} /> REBOOT SYSTEM
              </button>
              <button
                onClick={onExit}
                className="px-6 py-3 border border-gray-600 hover:bg-gray-800 text-gray-400 rounded"
              >
                EXIT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fire Button for Touch */}
      {!gameOver && (
        <button
          onPointerDown={onFireBullet}
          className="absolute bottom-32 right-8 w-20 h-20 bg-red-500/20 border-2 border-red-500 rounded-full flex items-center justify-center text-red-400 active:bg-red-500/50 active:scale-95 transition-all pointer-events-auto touch-manipulation"
        >
          <Target size={32} />
        </button>
      )}
    </div>
  );
};
