import React from 'react';
import { PlayerStats } from '../types/game';
import { Infinity as InfinityIcon, ShieldAlert, Award, Clock, Skull, Flame, Play, X, Zap } from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface EndlessModeModalProps {
  stats: PlayerStats;
  onLaunch: () => void;
  onClose: () => void;
}

export const EndlessModeModal: React.FC<EndlessModeModalProps> = ({
  stats,
  onLaunch,
  onClose,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none">
      <div className="w-full max-w-md rounded-3xl bg-gray-950 border border-fuchsia-500/40 p-6 flex flex-col shadow-2xl overflow-hidden relative">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-900">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-950/80 border border-fuchsia-500/50 flex items-center justify-center text-fuchsia-400 shadow-md shadow-fuchsia-950">
              <InfinityIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold font-mono text-white tracking-wider uppercase">
                PROJECT INFINITY
              </h2>
              <span className="text-[11px] font-mono text-fuchsia-400">PROCEDURAL ENDLESS MODE</span>
            </div>
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

        {/* Operational Directives */}
        <div className="mt-4 p-3.5 rounded-2xl bg-gray-900/60 border border-gray-800 flex flex-col gap-2.5 text-xs font-mono">
          <div className="flex items-start gap-2 text-rose-300">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-rose-400 font-bold">STRICT DETECTION CLAUSE:</strong>
              <p className="text-gray-300 text-[11px] mt-0.5">
                Any detection by guards ends your simulation immediately. Ghost stealth is mandatory.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 text-cyan-300">
            <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-cyan-400 font-bold">SCALING HAZARD ENGINE:</strong>
              <p className="text-gray-300 text-[11px] mt-0.5">
                Each progressive sector ramps up enemy density, patrol velocities, and laser security grids.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 text-amber-300">
            <Award className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-400 font-bold">SCORING ALGORITHM:</strong>
              <p className="text-gray-300 text-[11px] mt-0.5">
                Score = (Eliminations × 100) + (Survival Duration × 10) + Combo Chain Multipliers.
              </p>
            </div>
          </div>
        </div>

        {/* Career Records Grid */}
        <div className="grid grid-cols-2 gap-2.5 my-4">
          <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 flex flex-col items-start">
            <span className="text-[10px] font-mono text-gray-400 uppercase flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-400" /> HIGH SCORE
            </span>
            <span className="text-lg font-bold font-mono text-amber-300 mt-1">
              {stats.highScores.endlessHighScore || 0}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 flex flex-col items-start">
            <span className="text-[10px] font-mono text-gray-400 uppercase flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" /> BEST SURVIVAL
            </span>
            <span className="text-lg font-bold font-mono text-cyan-300 mt-1">
              {formatTime(stats.highScores.endlessBestDuration || 0)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 flex flex-col items-start">
            <span className="text-[10px] font-mono text-gray-400 uppercase flex items-center gap-1">
              <Skull className="w-3.5 h-3.5 text-rose-400" /> MAX ELIMINATIONS
            </span>
            <span className="text-lg font-bold font-mono text-white mt-1">
              {stats.highScores.endlessBestKills || 0}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 flex flex-col items-start">
            <span className="text-[10px] font-mono text-gray-400 uppercase flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-fuchsia-400" /> SECTOR DEPTH
            </span>
            <span className="text-lg font-bold font-mono text-fuchsia-300 mt-1">
              SECTOR {stats.highScores.endlessBestSector || 1}
            </span>
          </div>
        </div>

        {/* Launch Button */}
        <button
          onClick={() => {
            sound.playUiClick();
            onLaunch();
          }}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-mono font-bold text-sm tracking-wider uppercase shadow-xl shadow-fuchsia-950/60 active:scale-95 transition-all flex items-center justify-center gap-2.5 border border-fuchsia-400/40 mt-1"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>INITIATE ENDLESS BREACH</span>
        </button>
      </div>
    </div>
  );
};
