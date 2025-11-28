import React from 'react';
import { Rocket, Volume2, VolumeX, Gamepad2, Globe, Crosshair, Info, Sparkles, Loader2, MessageSquare } from 'lucide-react';
import { INITIAL_BODIES } from '../../constants';
import { ShipState, ChatMessage } from '../../types';
import { ChatOverlay } from '../ChatOverlay';

interface SolarHudProps {
  shipRef: React.MutableRefObject<ShipState>;
  autopilotActive: boolean;
  autopilotTarget: string | null;
  closestBody: string | null;
  aiDescription: string | null;
  isAiLoading: boolean;
  isMuted: boolean;
  chatOpen: boolean;
  chatMessages: ChatMessage[];
  chatLoading: boolean;
  onToggleMute: (e: React.MouseEvent) => void;
  onEngageAutopilot: (target: string) => void;
  onStartArcade: () => void;
  onStartOrbitSim: () => void;
  onStartRaiden: () => void;
  onDeepScan: () => void;
  onToggleChat: () => void;
  onSendChatMessage: (message: string) => void;
}

export const SolarHud: React.FC<SolarHudProps> = ({
  shipRef,
  autopilotActive,
  autopilotTarget,
  closestBody,
  aiDescription,
  isAiLoading,
  isMuted,
  chatOpen,
  chatMessages,
  chatLoading,
  onToggleMute,
  onEngageAutopilot,
  onStartArcade,
  onStartOrbitSim,
  onStartRaiden,
  onDeepScan,
  onToggleChat,
  onSendChatMessage,
}) => {
  return (
    <>
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
        <div className="bg-gray-900/80 backdrop-blur border border-gray-700 p-3 rounded-lg pointer-events-auto max-w-xs flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-cyan-400 font-bold text-lg flex items-center gap-2">
              <Rocket size={18} /> Solar Explorer
            </h1>
            <div className="flex gap-2">
              <button
                onClick={onToggleChat}
                className={`p-1.5 rounded-full text-gray-300 transition-colors ${
                  chatOpen ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-800 hover:bg-gray-700'
                }`}
                title="Ship Computer Chat"
              >
                <MessageSquare size={16} />
              </button>
              <button onClick={onToggleMute} className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-300" title={isMuted ? "Unmute" : "Mute"}>
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            System: {autopilotActive ? 'Orbit Sync Engaged' : 'Manual Control'}
          </div>

          {/* Fuel Gauge */}
          <div className="flex flex-col gap-1">
            <div className="text-xs text-gray-400 flex justify-between">
              <span>Fuel:</span>
              <span className={shipRef.current.fuel < 20 ? 'text-red-400 animate-pulse' : 'text-cyan-300'}>
                {Math.round(shipRef.current.fuel)}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  shipRef.current.fuel > 50 ? 'bg-cyan-500' :
                  shipRef.current.fuel > 20 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${shipRef.current.fuel}%` }}
              />
            </div>
            {shipRef.current.fuel < 100 && (
              <div className="text-[10px] text-gray-500 italic">
                {shipRef.current.fuel === 0 ? '⚠ No fuel - approach the Sun to recharge' :
                 shipRef.current.fuel < 20 ? '⚠ Low fuel - recharge near the Sun' :
                 'Recharge near the Sun'}
              </div>
            )}
          </div>

          {autopilotActive && autopilotTarget && (
            <div className="text-xs text-cyan-300 mt-1 animate-pulse">
              Targeting: {autopilotTarget}
            </div>
          )}

          {/* EASTER EGG BUTTONS */}
          {autopilotActive && autopilotTarget === 'Sun' && (
            <button
              onClick={onStartArcade}
              className="mt-2 flex items-center justify-center gap-2 w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded animate-bounce shadow-[0_0_15px_rgba(147,51,234,0.5)] transition-all"
            >
              <Gamepad2 size={16} /> ENTER SIMULATION
            </button>
          )}
          {autopilotActive && autopilotTarget === 'Earth' && (
            <button
              onClick={onStartOrbitSim}
              className="mt-2 flex items-center justify-center gap-2 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded animate-bounce shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all"
            >
              <Globe size={16} /> ORBIT SIMULATOR
            </button>
          )}
          {autopilotActive && autopilotTarget === 'Mars' && (
            <button
              onClick={onStartRaiden}
              className="mt-2 flex items-center justify-center gap-2 w-full py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded animate-bounce shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all"
            >
              <Crosshair size={16} /> MARS DEFENSE PROTOCOL
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2 pointer-events-auto max-h-[50vh] overflow-y-auto no-scrollbar">
          {INITIAL_BODIES.map(b => (
            <button
              key={b.name}
              onClick={() => onEngageAutopilot(b.name)}
              className={`px-3 py-1 text-xs font-mono border rounded transition-colors ${
                autopilotTarget === b.name
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                  : 'bg-gray-900/60 border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>
      </div>

      {/* AI Info Panel */}
      {(closestBody || aiDescription) && (
        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pointer-events-none">
          <div className="bg-black/80 border border-cyan-500/30 p-4 rounded-xl backdrop-blur-md shadow-[0_0_30px_rgba(6,182,212,0.15)] pointer-events-auto animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-cyan-400">
                <Info size={16} />
                <span className="font-bold uppercase tracking-wider text-sm">
                  {closestBody ? `Proximity Alert: ${closestBody}` : 'Ship Computer'}
                </span>
              </div>
              {closestBody && !isAiLoading && (
                <button
                  onClick={onDeepScan}
                  className="flex items-center gap-1.5 px-3 py-1 bg-cyan-900/50 hover:bg-cyan-800/50 text-cyan-200 text-xs rounded-full border border-cyan-700/50 transition-colors"
                >
                  <Sparkles size={12} />
                  Deep Scan
                </button>
              )}
            </div>
            <div className="min-h-[3rem] text-sm text-gray-200 leading-relaxed">
              {isAiLoading ? (
                <div className="flex items-center gap-2 text-gray-500 py-1">
                  <Loader2 className="animate-spin" size={16} />
                  <span>Processing Neural Network Request...</span>
                </div>
              ) : (
                aiDescription || "Scanning..."
              )}
            </div>
          </div>
        </div>
      )}

      {/* Debug Panel */}
      <div className="absolute bottom-8 right-8 pointer-events-auto">
        <div className="flex flex-col items-end gap-2 text-xs text-gray-500 font-mono">
          <div>POS X: {Math.round(shipRef.current.position.x)}</div>
          <div>POS Y: {Math.round(shipRef.current.position.y)}</div>
          <div>VEL: {Math.abs(Math.round(Math.sqrt(shipRef.current.velocity.x**2 + shipRef.current.velocity.y**2) * 10) / 10)}</div>
        </div>
      </div>

      {/* Chat Overlay */}
      <ChatOverlay
        isOpen={chatOpen}
        messages={chatMessages}
        isLoading={chatLoading}
        onClose={onToggleChat}
        onSendMessage={onSendChatMessage}
      />
    </>
  );
};
