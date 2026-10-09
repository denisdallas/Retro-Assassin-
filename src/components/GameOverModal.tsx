import React from 'react';
import { GameEngineState } from '../game/engine';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface GameOverModalProps {
  engineState: GameEngineState;
  onRetry: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  engineState,
  onRetry,
  onHome,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none">
      <div className="w-full max-w-sm rounded-3xl bg-gray-950 border border-rose-500/50 p-6 flex flex-col items-center text-center shadow-2xl">
        {/* Skull / Terminated Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border-2 border-rose-500/60 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-950/60 mb-3 animate-pulse">
          <AlertOctagon className="w-9 h-9" />
        </div>

        <h2 className="text-xl font-black font-mono tracking-wider text-rose-400 uppercase">
          OPERATIVE ELIMINATED
        </h2>

        {/* Cause of death */}
        <p className="mt-2 text-xs font-mono text-gray-300 bg-gray-900/80 p-3 rounded-xl border border-gray-800 leading-relaxed text-left w-full">
          {engineState.gameStatusText || 'Security perimeter compromised. Mission aborted.'}
        </p>

        {/* Tactical Tips */}
        <div className="mt-3 text-[11px] font-mono text-cyan-400/90 bg-cyan-950/30 border border-cyan-500/20 rounded-xl p-2.5 text-left w-full">
          💡 <strong>TACTICAL TIP:</strong> Use Nanite Smoke or Active Camo to cross guarded corridors, and flank Enforcers from behind!
        </div>

        {/* Buttons */}
        <div className="w-full flex flex-col gap-2.5 mt-5">
          <button
            onClick={() => {
              sound.playUiClick();
              onRetry();
            }}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-mono text-xs font-bold tracking-wider uppercase transition shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RETRY INFILTRATION</span>
          </button>

          <button
            onClick={() => {
              sound.playUiClick();
              onHome();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white font-mono text-xs font-semibold border border-gray-800 transition flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Home className="w-3.5 h-3.5" />
            <span>RETURN TO MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
