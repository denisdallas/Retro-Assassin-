import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onHome,
  isAudioMuted,
  onToggleAudio,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      <div className="w-full max-w-xs rounded-3xl bg-gray-950 border border-cyan-500/40 p-6 flex flex-col items-center text-center shadow-2xl">
        <h2 className="text-lg font-bold font-mono tracking-wider text-cyan-400 uppercase">
          MISSION PAUSED
        </h2>
        <p className="text-xs text-gray-400 font-mono mt-1">Infiltration temporarily suspended</p>

        <div className="w-full flex flex-col gap-2.5 mt-5">
          <button
            onClick={() => {
              sound.playUiClick();
              onResume();
            }}
            className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-mono text-xs font-bold tracking-wider uppercase transition shadow-md shadow-cyan-950 active:scale-95 flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>RESUME</span>
          </button>

          <button
            onClick={() => {
              sound.playUiClick();
              onRestart();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 font-mono text-xs font-semibold border border-gray-800 transition active:scale-95 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART SECTOR</span>
          </button>

          <button
            onClick={() => {
              sound.playUiClick();
              onToggleAudio();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 font-mono text-xs font-semibold border border-gray-800 transition active:scale-95 flex items-center justify-center gap-2"
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            <span>{isAudioMuted ? 'UNMUTE AUDIO' : 'MUTE AUDIO'}</span>
          </button>

          <button
            onClick={() => {
              sound.playUiClick();
              onHome();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white font-mono text-xs font-semibold border border-gray-800 transition active:scale-95 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
