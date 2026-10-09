import React from 'react';
import { PlayerStats } from '../types/game';
import { CAMPAIGN_LEVELS } from '../game/levels';
import { X, Play, Lock, Star, Clock, Eye, Skull } from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface LevelSelectModalProps {
  stats: PlayerStats;
  onSelectLevel: (levelId: number) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  stats,
  onSelectLevel,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none">
      <div className="w-full max-w-lg max-h-[90vh] rounded-3xl bg-gray-950 border border-cyan-500/30 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-900 flex items-center justify-between bg-gray-900/40">
          <div>
            <h2 className="text-lg font-mono font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              MISSION SELECT
            </h2>
            <p className="text-xs text-gray-400 font-mono mt-0.5">Choose an infiltration sector</p>
          </div>
          <button
            onClick={() => {
              sound.playUiClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Levels List */}
        <div className="p-5 overflow-y-auto flex flex-col gap-3.5">
          {CAMPAIGN_LEVELS.map((lvl) => {
            const isUnlocked = stats.unlockedLevels.includes(lvl.id);
            const stars = stats.levelStars[lvl.id] || { completed: false, speedRun: false, ghostMode: false };
            const isBossLevel = lvl.id === 5;

            return (
              <div
                key={lvl.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isUnlocked
                    ? isBossLevel
                      ? 'bg-gradient-to-r from-gray-900 to-rose-950/40 border-rose-500/40 hover:border-rose-400'
                      : 'bg-gray-900/60 border-cyan-500/20 hover:border-cyan-500/50'
                    : 'bg-gray-950 border-gray-900 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-cyan-400">
                        {lvl.sectorName}
                      </span>
                      {isBossLevel && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-950 border border-rose-500/60 text-[10px] font-mono text-rose-300 font-bold flex items-center gap-1">
                          <Skull className="w-3 h-3" /> BOSS
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white font-mono mt-0.5">{lvl.name}</h3>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{lvl.description}</p>

                    {/* Challenge Stars */}
                    {isUnlocked && (
                      <div className="flex items-center gap-3 mt-3 text-[11px] font-mono">
                        <span
                          className={`flex items-center gap-1 ${
                            stars.completed ? 'text-amber-300' : 'text-gray-600'
                          }`}
                        >
                          <Star className="w-3.5 h-3.5 fill-current" /> Clear
                        </span>
                        <span
                          className={`flex items-center gap-1 ${
                            stars.speedRun ? 'text-cyan-300' : 'text-gray-600'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" /> &lt;{lvl.parTime}s
                        </span>
                        <span
                          className={`flex items-center gap-1 ${
                            stars.ghostMode ? 'text-emerald-300' : 'text-gray-600'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" /> Ghost
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div>
                    {isUnlocked ? (
                      <button
                        onClick={() => {
                          sound.playUiClick();
                          onSelectLevel(lvl.id);
                        }}
                        className={`py-2.5 px-4 rounded-xl font-mono text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95 ${
                          isBossLevel
                            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950'
                            : 'bg-cyan-500 hover:bg-cyan-400 text-gray-950 shadow-cyan-950'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" /> PLAY
                      </button>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-600">
                        <Lock className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
