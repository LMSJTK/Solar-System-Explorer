import React from 'react';
import { Settings2, Play, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { OrbitSimState } from '../../types';

interface OrbitHudProps {
  orbitSimRef: React.MutableRefObject<OrbitSimState>;
  orbitParams: {
    speed: number;
    distance: number;
    angle: number;
  };
  orbitZoom: number;
  onExit: () => void;
  onSetOrbitParams: React.Dispatch<React.SetStateAction<{ speed: number; distance: number; angle: number }>>;
  onSetOrbitZoom: React.Dispatch<React.SetStateAction<number>>;
  onLaunch: () => void;
  onReset: () => void;
  onApplyPreset: (type: 'circular' | 'elliptical' | 'escape' | 'crash') => void;
}

export const OrbitHud: React.FC<OrbitHudProps> = ({
  orbitSimRef,
  orbitParams,
  orbitZoom,
  onExit,
  onSetOrbitParams,
  onSetOrbitZoom,
  onLaunch,
  onReset,
  onApplyPreset,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
      {/* Top Bar */}
      <div className="flex justify-between items-start">
        <button
          onClick={onExit}
          className="pointer-events-auto px-4 py-2 bg-gray-900/80 border border-blue-500/50 text-blue-400 text-xs hover:bg-blue-900/20 rounded"
        >
          EXIT SIMULATOR
        </button>

        <div className="bg-black/80 p-3 rounded-lg border border-blue-500/30 text-right backdrop-blur flex gap-4">
          <div className="flex gap-6 text-sm">
            <div>
              <div className="text-xs text-blue-400">ALTITUDE</div>
              <div className="font-mono text-white">
                {Math.max(0, Math.round(Math.sqrt(orbitSimRef.current.satellite.x**2 + orbitSimRef.current.satellite.y**2) - 40))} km
              </div>
            </div>
            <div>
              <div className="text-xs text-blue-400">VELOCITY</div>
              <div className="font-mono text-white">
                {Math.sqrt(orbitSimRef.current.satellite.vx**2 + orbitSimRef.current.satellite.vy**2).toFixed(2)} km/s
              </div>
            </div>
          </div>
          {orbitSimRef.current.status === 'escaped' && <div className="text-orange-400 text-xs font-bold mt-1">ORBIT ESCAPED</div>}
          {orbitSimRef.current.status === 'crashed' && <div className="text-red-500 text-xs font-bold mt-1">IMPACT CONFIRMED</div>}
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute top-20 right-4 flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={() => onSetOrbitZoom(z => Math.min(z + 0.1, 2.0))}
          className="p-2 bg-gray-800 border border-gray-600 rounded text-gray-300 hover:bg-gray-700 transition-colors"
        >
          <ZoomIn size={20} />
        </button>
        <button
          onClick={() => onSetOrbitZoom(z => Math.max(z - 0.1, 0.1))}
          className="p-2 bg-gray-800 border border-gray-600 rounded text-gray-300 hover:bg-gray-700 transition-colors"
        >
          <ZoomOut size={20} />
        </button>
      </div>

      {/* Bottom Controls */}
      <div className="pointer-events-auto max-w-2xl mx-auto w-full bg-gray-900/90 border border-gray-700 rounded-xl p-4 backdrop-blur-lg shadow-2xl">
        {orbitSimRef.current.status === 'ready' ? (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <h3 className="text-blue-400 font-bold flex items-center gap-2"><Settings2 size={16}/> MISSION PARAMETERS</h3>
              <div className="flex gap-2">
                <button onClick={() => onApplyPreset('circular')} className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded text-gray-300">Circular</button>
                <button onClick={() => onApplyPreset('elliptical')} className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded text-gray-300">Elliptical</button>
                <button onClick={() => onApplyPreset('escape')} className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded text-gray-300">Escape</button>
                <button onClick={() => onApplyPreset('crash')} className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded text-gray-300">Crash</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Distance Control */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Distance</span>
                  <span>{orbitParams.distance} km</span>
                </div>
                <input
                  type="range" min="60" max="600" step="10"
                  value={orbitParams.distance}
                  onChange={(e) => {
                    onSetOrbitParams(p => ({...p, distance: Number(e.target.value)}));
                    orbitSimRef.current.satellite.x = Number(e.target.value);
                  }}
                  className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Speed Control */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Speed</span>
                  <span>{orbitParams.speed} km/s</span>
                </div>
                <input
                  type="range" min="0" max="10" step="0.1"
                  value={orbitParams.speed}
                  onChange={(e) => onSetOrbitParams(p => ({...p, speed: Number(e.target.value)}))}
                  className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Angle Control */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Angle</span>
                  <span>{orbitParams.angle}°</span>
                </div>
                <input
                  type="range" min="-90" max="90" step="5"
                  value={orbitParams.angle}
                  onChange={(e) => onSetOrbitParams(p => ({...p, angle: Number(e.target.value)}))}
                  className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>

            <button
              onClick={onLaunch}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-[0_0_20px_rgba(37,99,235,0.3)] flex justify-center items-center gap-2 transition-all active:scale-[0.98]"
            >
              <Play size={20} fill="currentColor" /> LAUNCH SATELLITE
            </button>
          </div>
        ) : (
          <div className="flex justify-center items-center gap-4">
            <div className={`text-sm font-mono ${orbitSimRef.current.status === 'running' ? 'text-green-400' : 'text-gray-400'}`}>
              STATUS: {orbitSimRef.current.status.toUpperCase()}
            </div>
            <button
              onClick={onReset}
              className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg border border-gray-600 flex items-center gap-2"
            >
              <RotateCcw size={16} /> CONFIGURE MISSION
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
