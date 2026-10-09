import React from 'react';
import { GameEngineState } from '../game/engine';
import { LevelData, PlayerStats } from '../types/game';
import { Pause, Volume2, VolumeX, Shield, Zap, Skull, Flame, Coins, Eye, AlertTriangle } from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface HUDProps {
  engineState: GameEngineState;
  level: LevelData;
  stats: PlayerStats;
  isEndless: boolean;
  endlessSector?: number;
  onPause: () => void;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  engineState,
  level,
  stats,
  isEndless,
  endlessSector,
  onPause,
  isAudioMuted,
  onToggleAudio,
}) => {
  const aliveGuards = engineState.guards.filter((g) => g.state !== 'dead').length;
  const isGhostIntact = engineState.alertsTriggered === 0;
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m}:${s < 10 ? '0' : ''}${s}.${ms}`;
  };

  return (
    <div className="absolute top-0 left-0 right-0 p-3 pointer-events-none select-none z-20 flex flex-col gap-2">
      {/* Top Banner Row */}
      <div className="flex items-center justify-between gap-2">
        {/* App Title & Sector Badge */}
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-md bg-gray-900/90 border border-cyan-500/40 backdrop-blur-md shadow-md flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h1 className="text-xs font-mono font-bold tracking-widest text-cyan-300 uppercase">
              cyber Shadow
            </h1>
          </div>

          <div className="px-2 py-1 rounded-md bg-gray-900/80 border border-gray-800 text-[11px] font-mono text-gray-300">
            {isEndless ? `INFINITY S-${endlessSector}` : level.sectorName}
          </div>
        </div>

        {/* Action Controls & Currency */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Credits Display */}
          <div className="px-2.5 py-1 rounded-md bg-gray-900/90 border border-amber-500/40 backdrop-blur-md flex items-center gap-1.5 text-amber-300">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-mono font-bold">
              {stats.credits + engineState.creditsEarned}
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              sound.playUiClick();
              onToggleAudio();
            }}
            className="p-1.5 rounded-lg bg-gray-900/80 border border-gray-700 text-gray-300 hover:text-cyan-300 transition"
            aria-label="Toggle Audio"
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Pause Button */}
          <button
            onClick={() => {
              sound.playUiClick();
              onPause();
            }}
            className="p-1.5 rounded-lg bg-gray-900/80 border border-gray-700 text-gray-300 hover:text-white transition active:scale-95"
            aria-label="Pause Game"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Secondary Status Bar: Hostiles, Timer, Ghost Mode, Combo */}
      <div className="flex items-center justify-between text-xs font-mono">
        {/* Left: Hostiles Remaining */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-900/80 border border-gray-800 text-gray-300">
            <Skull className="w-3.5 h-3.5 text-rose-400" />
            <span>
              HOSTILES: <strong className="text-white">{aliveGuards}</strong>
            </span>
          </div>

          {/* Ghost Mode Badge */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded border ${
              isGhostIntact
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
            }`}
          >
            {isGhostIntact ? <Eye className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {isGhostIntact ? 'GHOST' : 'ALERTED'}
            </span>
          </div>
        </div>

        {/* Right: Mission Timer & Par OR Endless Score */}
        {isEndless ? (
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 rounded bg-fuchsia-950/80 border border-fuchsia-500/40 text-fuchsia-300 flex items-center gap-1 font-bold">
              <span>SCORE:</span>
              <span className="text-white">{engineState.score}</span>
            </div>
            <div className="px-2 py-1 rounded bg-gray-900/80 border border-gray-800 text-cyan-300 flex items-center gap-1">
              <span>SURVIVAL:</span>
              <span className="font-bold">{formatTime(engineState.survivalDuration)}</span>
            </div>
          </div>
        ) : (
          <div className="px-2 py-1 rounded bg-gray-900/80 border border-gray-800 text-gray-300 flex items-center gap-1">
            <span>TIME:</span>
            <span
              className={`font-bold ${
                engineState.timeElapsed > level.parTime ? 'text-amber-400' : 'text-cyan-400'
              }`}
            >
              {formatTime(engineState.timeElapsed)}
            </span>
            <span className="text-gray-500 text-[10px]">/ {level.parTime}s</span>
          </div>
        )}
      </div>

      {/* Armed Mine Banner Alert */}
      {engineState.mines.length > 0 && (
        <div className="mx-auto px-3 py-1 rounded-full bg-rose-950/90 border border-rose-500 text-rose-300 font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-lg shadow-rose-950/60 animate-pulse">
          <span>💣</span>
          <span>REMOTE MINE ARMED ON FIELD — TAP DETONATE TO TRIGGER BLAST</span>
        </div>
      )}

      {/* Boss Health Bar (Only if Boss is present and alive) */}
      {engineState.boss && engineState.boss.state !== 'dead' && (
        <div className="w-full max-w-md mx-auto mt-1 p-2 rounded-xl bg-gray-950/90 border border-rose-500/50 backdrop-blur-md shadow-xl flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-rose-400 font-bold tracking-wider flex items-center gap-1">
              <Skull className="w-3.5 h-3.5" /> CYBER-COLOSSUS WARDEN
            </span>
            <span className="text-gray-400 text-[11px]">
              {engineState.boss.shieldActive ? (
                <span className="text-cyan-400 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> SHIELD ACTIVE
                </span>
              ) : (
                <span className="text-rose-400 font-bold animate-pulse">VULNERABLE!</span>
              )}
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-gray-900 border border-gray-800 overflow-hidden flex">
            {Array.from({ length: engineState.boss.maxHealth }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 border-r border-gray-950 transition-all ${
                  i < engineState.boss!.health
                    ? engineState.boss!.shieldActive
                      ? 'bg-gradient-to-r from-cyan-500 to-sky-400'
                      : 'bg-gradient-to-r from-rose-500 to-red-600 animate-pulse'
                    : 'bg-gray-800 opacity-40'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Floating Combo Counter Banner */}
      {engineState.combo > 1 && (
        <div className="mx-auto mt-1 flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-950/90 to-fuchsia-950/90 border border-cyan-400 shadow-lg shadow-cyan-500/30 animate-bounce">
          <Flame className="w-4 h-4 text-cyan-400 animate-spin" />
          <span className="text-xs font-mono font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-pink-400 uppercase">
            CYBER COMBO x{engineState.combo}!
          </span>
          <div className="w-12 h-1.5 rounded-full bg-gray-800 overflow-hidden">
            <div
              style={{ width: `${(engineState.comboTimer / 4.0) * 100}%` }}
              className="h-full bg-cyan-400 transition-all"
            />
          </div>
        </div>
      )}

      {/* Optical Camo Active Alert */}
      {engineState.player.isCamo && (
        <div className="mx-auto px-2.5 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/60 text-[11px] font-mono text-purple-300 flex items-center gap-1">
          <Zap className="w-3 h-3 text-purple-400 animate-pulse" />
          <span>CAMO ENGAGED: {engineState.player.camoTimer.toFixed(1)}s</span>
        </div>
      )}
    </div>
  );
};
