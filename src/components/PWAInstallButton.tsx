import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share2, X } from 'lucide-react';
import { sound } from '../audio/soundEngine';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = () => {
    sound.playUiClick();
    install();
  };

  if (isInstallable) {
    return (
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-xs font-bold shadow-lg shadow-cyan-950/50 active:scale-95 transition-all border border-cyan-300/40"
      >
        <Download className="w-4 h-4 animate-bounce" />
        <span>INSTALL APP</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => {
            sound.playUiClick();
            setShowIOSGuide(true);
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-700 bg-gray-900/90 text-gray-300 font-mono text-xs hover:text-white transition"
        >
          <Share2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>INSTALL ON IOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-gray-900 border border-cyan-500/40 p-6 shadow-2xl text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 mb-3">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white font-mono">INSTALL CYBER SHADOW</h3>
              <p className="mt-2 text-xs text-gray-400 leading-relaxed text-left">
                1. Tap the <strong className="text-cyan-300">Share</strong> icon in the Safari toolbar below.<br />
                2. Scroll down and select <strong className="text-cyan-300">Add to Home Screen</strong>.<br />
                3. Launch directly from your app drawer for full-screen arcade action!
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 font-mono text-xs font-bold text-white transition flex items-center justify-center gap-1.5"
              >
                <X className="w-4 h-4" /> CLOSE
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
