import React, { useRef, useState, useEffect } from 'react';
import { GadgetType, GadgetItem } from '../types/game';
import { Cloud, Radio, Zap, EyeOff, Sword } from 'lucide-react';

interface MobileControlsProps {
  onMove: (dx: number, dy: number) => void;
  onUseGadget: (type: GadgetType) => void;
  gadgets: Record<GadgetType, GadgetItem>;
  onManualSlash?: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMove,
  onUseGadget,
  gadgets,
  onManualSlash,
}) => {
  const joystickBaseRef = useRef<HTMLDivElement | null>(null);
  const [touchPos, setTouchPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const activeTouchId = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (activeTouchId.current !== null) return;
    const touch = e.changedTouches[0];
    activeTouchId.current = touch.identifier;
    setIsDragging(true);
    updateJoystickPos(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouchId.current) {
        updateJoystickPos(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouchId.current) {
        activeTouchId.current = null;
        setIsDragging(false);
        setTouchPos(null);
        onMove(0, 0);
        break;
      }
    }
  };

  const updateJoystickPos = (clientX: number, clientY: number) => {
    const base = joystickBaseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const maxRadius = 45;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist === 0) {
      setTouchPos({ x: 0, y: 0 });
      onMove(0, 0);
    } else {
      const clampedDist = Math.min(dist, maxRadius);
      const normX = dx / dist;
      const normY = dy / dist;
      setTouchPos({ x: normX * clampedDist, y: normY * clampedDist });
      onMove(normX * (clampedDist / maxRadius), normY * (clampedDist / maxRadius));
    }
  };

  // Keyboard controls for desktop
  useEffect(() => {
    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'].includes(k)) {
        keys[k] = true;
        updateKeyboardVector();
      }
      // Gadget hotkeys: 1, 2, 3, 4
      if (k === '1') onUseGadget('smoke');
      if (k === '2') onUseGadget('decoy');
      if (k === '3') onUseGadget('emp');
      if (k === '4') onUseGadget('camo');
      if (k === ' ') {
        e.preventDefault();
        onManualSlash?.();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (keys[k]) {
        keys[k] = false;
        updateKeyboardVector();
      }
    };

    const updateKeyboardVector = () => {
      let kx = 0;
      let ky = 0;
      if (keys['w'] || keys['arrowup']) ky -= 1;
      if (keys['s'] || keys['arrowdown']) ky += 1;
      if (keys['a'] || keys['arrowleft']) kx -= 1;
      if (keys['d'] || keys['arrowright']) kx += 1;
      onMove(kx, ky);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onMove, onUseGadget, onManualSlash]);

  const gadgetIcons = {
    smoke: <Cloud className="w-5 h-5 text-slate-300" />,
    decoy: <Radio className="w-5 h-5 text-cyan-400" />,
    emp: <Zap className="w-5 h-5 text-sky-400" />,
    camo: <EyeOff className="w-5 h-5 text-purple-400" />,
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 flex flex-col justify-end p-4 pb-6">
      <div className="w-full flex items-end justify-between">
        {/* Left Touch Joystick */}
        <div
          ref={joystickBaseRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className="pointer-events-auto relative w-32 h-32 rounded-full bg-gray-900/60 backdrop-blur-md border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-950/40 touch-none active:border-cyan-400"
        >
          {/* Outer Guide Ring */}
          <div className="w-20 h-20 rounded-full border border-dashed border-cyan-500/20 pointer-events-none" />

          {/* Joystick Thumb Knob */}
          <div
            style={{
              transform: `translate(${touchPos?.x || 0}px, ${touchPos?.y || 0}px)`,
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
            className="absolute w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-600 to-sky-400 shadow-md shadow-cyan-500/50 flex items-center justify-center border-2 border-white/60 pointer-events-none"
          >
            <div className="w-3 h-3 rounded-full bg-white/80" />
          </div>
        </div>

        {/* Right Action Hotbar: Gadgets + Strike Button */}
        <div className="pointer-events-auto flex items-end gap-3">
          {/* Gadget Grid */}
          <div className="grid grid-cols-2 gap-2">
            {(['smoke', 'decoy', 'emp', 'camo'] as GadgetType[]).map((type, idx) => {
              const g = gadgets[type];
              const disabled = g.charges <= 0 || g.currentCooldown > 0;
              const cooldownPct = g.currentCooldown > 0 ? (g.currentCooldown / g.cooldown) * 100 : 0;

              return (
                <button
                  key={type}
                  onClick={() => onUseGadget(type)}
                  disabled={disabled}
                  className={`relative w-14 h-14 rounded-xl flex flex-col items-center justify-center border transition-all active:scale-95 touch-manipulation ${
                    disabled
                      ? 'bg-gray-900/80 border-gray-800 text-gray-500 opacity-60'
                      : 'bg-gray-900/90 border-cyan-500/40 hover:border-cyan-400 text-white shadow-lg shadow-cyan-950/50 active:bg-cyan-950/60'
                  }`}
                  aria-label={`Use ${g.name}`}
                >
                  {/* Cooldown Overlay */}
                  {g.currentCooldown > 0 && (
                    <div
                      style={{ height: `${cooldownPct}%` }}
                      className="absolute bottom-0 left-0 right-0 bg-red-950/60 rounded-b-xl pointer-events-none"
                    />
                  )}

                  {gadgetIcons[type]}

                  {/* Charge Counter */}
                  <span className="absolute bottom-1 right-1.5 text-[10px] font-mono font-bold text-cyan-300">
                    {g.charges}
                  </span>

                  {/* Hotkey tag for desktop */}
                  <span className="absolute top-1 left-1.5 text-[9px] font-mono text-gray-400">
                    {idx + 1}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Big Melee Strike Button */}
          <button
            onClick={onManualSlash}
            className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-500 border-2 border-white/60 shadow-lg shadow-rose-900/60 flex flex-col items-center justify-center text-white active:scale-90 transition-all touch-manipulation"
            aria-label="Strike / Attack"
          >
            <Sword className="w-7 h-7" />
            <span className="text-[9px] font-mono font-bold tracking-wider uppercase mt-0.5">STRIKE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
