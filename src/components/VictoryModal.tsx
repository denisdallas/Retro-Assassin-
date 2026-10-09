import React from 'react';
import { GameEngineState } from '../game/engine';
import { LevelData } from '../types/game';
import { Award, Star, Clock, Eye, Coins, ArrowRight, RotateCcw, Home } from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface VictoryModalProps {
  engineState: GameEngineState;
  level: LevelData;
  isEndless: boolean;
  endlessSector?: number;
  onNextLevel: () => void;
  onReplay: () => void;
  onHome: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  engineState,
  level,
  isEndless,
  endlessSector,
  onNextLevel,
  onReplay,
  onHome,
}) => {
  const isSpeedRunCleared = engineState.timeElapsed <= level.parTime;
  const isGhostCleared = engineState.alertsTriggered === 0;

  let totalReward = level.coinReward + engineState.creditsEarned;
  if (isSpeedRunCleared) totalReward += 100;
  if (isGhostCleared) totalReward += 150;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none">
      <div className="w-full max-w-sm rounded-3xl bg-gray-950 border border-emerald-500/40 p-6 flex flex-col items-center text-center shadow-2xl">
        {/* Victory Icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border-2 border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-950/60 mb-3 animate-bounce">
          <Award className="w-9 h-9" />
        </div>

        <h2 className="text-xl font-black font-mono tracking-wider text-white uppercase">
          SECTOR PURGED
        </h2>
        <p className="text-xs font-mono text-emerald-400 mt-0.5">
          {isEndless ? `INFINITY SECTOR ${endlessSector} CONQUERED` : level.name}
        </p>

        {/* Stars Breakdown */}
        {!isEndless && (
          <div className="flex items-center justify-center gap-4 my-4 p-3 rounded-2xl bg-gray-900/80 border border-gray-800 w-full">
            {/* Star 1: Completed */}
            <div className="flex flex-col items-center gap-1">
              <Star className="w-6 h-6 text-amber-400 fill-current" />
              <span className="text-[10px] font-mono text-gray-300">CLEAR</span>
            </div>

            {/* Star 2: Speed Run */}
            <div className="flex flex-col items-center gap-1">
              <Clock
                className={`w-6 h-6 ${isSpeedRunCleared ? 'text-cyan-400' : 'text-gray-600'}`}
              />
              <span
                className={`text-[10px] font-mono ${
                  isSpeedRunCleared ? 'text-cyan-300 font-bold' : 'text-gray-600'
                }`}
              >
                SPEED ({Math.floor(engineState.timeElapsed)}s)
              </span>
            </div>

            {/* Star 3: Ghost Mode */}
            <div className="flex flex-col items-center gap-1">
              <Eye
                className={`w-6 h-6 ${isGhostCleared ? 'text-emerald-400' : 'text-gray-600'}`}
              />
              <span
                className={`text-[10px] font-mono ${
                  isGhostCleared ? 'text-emerald-300 font-bold' : 'text-gray-600'
                }`}
              >
                GHOST
              </span>
            </div>
          </div>
        )}

        {/* Stats Table */}
        <div className="w-full bg-gray-900/50 rounded-xl p-3 border border-gray-900 text-xs font-mono flex flex-col gap-1.5 my-2 text-left">
          <div className="flex justify-between text-gray-400">
            <span>ELIMINATIONS:</span>
            <span className="text-white font-bold">{engineState.kills}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>PEAK COMBO:</span>
            <span className="text-cyan-400 font-bold">x{engineState.maxCombo}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>TOTAL CREDITS EARNED:</span>
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" /> +{totalReward} CR
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-2 mt-3">
          <button
            onClick={() => {
              sound.playUiClick();
              onNextLevel();
            }}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-gray-950 font-mono text-xs font-bold tracking-wider uppercase transition shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 active:scale-95"
          >
            <span>{isEndless ? 'ADVANCE TO NEXT SECTOR' : 'NEXT SECTOR'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                sound.playUiClick();
                onReplay();
              }}
              className="py-2.5 px-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 font-mono text-xs font-semibold border border-gray-800 transition flex items-center justify-center gap-1.5 active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" /> REPLAY
            </button>
            <button
              onClick={() => {
                sound.playUiClick();
                onHome();
              }}
              className="py-2.5 px-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 font-mono text-xs font-semibold border border-gray-800 transition flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Home className="w-3.5 h-3.5" /> MENU
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
