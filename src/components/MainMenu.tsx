import React from 'react';
import { PlayerStats } from '../types/game';
import { Play, Infinity as InfinityIcon, ShoppingBag, Layers, Volume2, VolumeX, Shield, Award } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { sound } from '../audio/soundEngine';

interface MainMenuProps {
  stats: PlayerStats;
  onStartCampaign: (levelId: number) => void;
  onStartEndless: () => void;
  onOpenShop: () => void;
  onOpenLevelSelect: () => void;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  stats,
  onStartCampaign,
  onStartEndless,
  onOpenShop,
  onOpenLevelSelect,
  isAudioMuted,
  onToggleAudio,
}) => {
  const currentMaxLevel = Math.max(...stats.unlockedLevels, 1);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-6 bg-gradient-to-b from-[#060913] via-[#090d1a] to-[#030712] select-none overflow-hidden">
      {/* Background Cyber Accents */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e90a_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e90a_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <div className="w-full max-w-md flex items-center justify-between z-10">
        {/* Credits Badge */}
        <div className="px-3 py-1.5 rounded-xl bg-gray-900/90 border border-amber-500/40 backdrop-blur-md flex items-center gap-2 shadow-lg shadow-amber-950/30">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-mono font-bold text-amber-300">
            {stats.credits} <span className="text-gray-400 font-normal">CR</span>
          </span>
        </div>

        {/* Audio & Install */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playUiClick();
              onToggleAudio();
            }}
            className="p-2 rounded-xl bg-gray-900/80 border border-gray-800 text-gray-300 hover:text-cyan-300 transition active:scale-95"
            aria-label="Toggle Audio"
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
          <PWAInstallButton />
        </div>
      </div>

      {/* Hero Branding Section */}
      <div className="flex flex-col items-center text-center z-10 my-auto">
        {/* Glowing Insignia */}
        <div className="relative mb-4 flex items-center justify-center">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-cyan-950 via-gray-900 to-rose-950 border-2 border-cyan-400/50 flex items-center justify-center shadow-2xl shadow-cyan-500/30">
            <Shield className="w-12 h-12 text-cyan-400 drop-shadow-[0_0_12px_rgba(0,240,255,0.8)]" />
          </div>
          <div className="absolute -inset-1 rounded-2xl border border-rose-500/30 animate-pulse pointer-events-none" />
        </div>

        {/* Title: Exact required name "cyber Shadow" */}
        <h1 className="text-4xl sm:text-5xl font-black font-mono tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-rose-400 drop-shadow-[0_0_20px_rgba(0,240,255,0.4)]">
          cyber Shadow
        </h1>
        <p className="mt-2 text-xs font-mono text-cyan-300/80 tracking-widest uppercase">
          Tactical Top-Down Cyberpunk Stealth
        </p>
        <p className="mt-1 text-[11px] text-gray-400 max-w-xs">
          Venture into fortified neon sectors. Eliminate cybernetic guards, slip past laser traps, and dismantle bosses.
        </p>

        {/* Endless Best Record */}
        {stats.highScores.endlessBestSector > 0 && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
            <Award className="w-3.5 h-3.5 text-cyan-400" />
            <span>RECORD: SECTOR {stats.highScores.endlessBestSector} • {stats.highScores.endlessBestKills} KILLS</span>
          </div>
        )}
      </div>

      {/* Menu Action Buttons (Mobile-first large touch targets) */}
      <div className="w-full max-w-sm flex flex-col gap-3 z-10 pb-4">
        {/* Continue / Play Campaign */}
        <button
          onClick={() => {
            sound.playUiClick();
            onStartCampaign(currentMaxLevel);
          }}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono font-bold text-sm tracking-wider uppercase shadow-xl shadow-cyan-950/60 active:scale-95 transition-all flex items-center justify-center gap-3 border border-cyan-300/40"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>INFILTRATE CAMPAIGN</span>
        </button>

        {/* Endless Mode */}
        <button
          onClick={() => {
            sound.playUiClick();
            onStartEndless();
          }}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-fuchsia-900/90 to-purple-900/90 hover:from-fuchsia-800 hover:to-purple-800 text-fuchsia-200 font-mono font-bold text-xs tracking-wider uppercase border border-fuchsia-500/40 shadow-lg shadow-fuchsia-950/40 active:scale-95 transition-all flex items-center justify-center gap-2.5"
        >
          <InfinityIcon className="w-4 h-4 text-fuchsia-400" />
          <span>PROJECT INFINITY (ENDLESS)</span>
        </button>

        {/* Secondary Navigation Row: Level Select & Cyber Shop */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              sound.playUiClick();
              onOpenLevelSelect();
            }}
            className="py-3 px-4 rounded-xl bg-gray-900/90 hover:bg-gray-800 text-gray-200 font-mono text-xs font-semibold border border-gray-800 hover:border-gray-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>SECTORS</span>
          </button>

          <button
            onClick={() => {
              sound.playUiClick();
              onOpenShop();
            }}
            className="py-3 px-4 rounded-xl bg-gray-900/90 hover:bg-gray-800 text-gray-200 font-mono text-xs font-semibold border border-gray-800 hover:border-amber-500/40 active:scale-95 transition-all flex items-center justify-center gap-2 text-amber-200"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span>CYBER SHOP</span>
          </button>
        </div>
      </div>
    </div>
  );
};
