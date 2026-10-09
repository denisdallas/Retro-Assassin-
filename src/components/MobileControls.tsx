import React, { useRef, useState, useEffect } from 'react';
import { GadgetType, GadgetItem } from '../types/game';
import { Cloud, Bomb, Zap, EyeOff, Sword, CheckCircle2 } from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface MobileControlsProps {
  onMove: (dx: number, dy: number) => void;
  selectedGadget: GadgetType;
  onSelectGadget: (type: GadgetType) => void;
  onUseGadget: (type: GadgetType) => void;
  gadgets: Record<GadgetType, GadgetItem>;
  hasArmedMine: boolean;
  onManualSlash?: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMove,
  selectedGadget,
  onSelectGadget,
  onUseGadget,
  gadgets,
  hasArmedMine,
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
      // Gadget Selection hotkeys: 1, 2, 3, 4
      if (k === '1') {
        onSelectGadget('smoke');
      }
      if (k === '2') {
        onSelectGadget('mine');
      }
      if (k === '3') {
        onSelectGadget('emp');
      }
      if (k === '4') {
        onSelectGadget('camo');
      }
      // Use active gadget: E or Q
      if (k === 'e' || k === 'q') {
        onUseGadget(selectedGadget);
      }
      // Strike: Space
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
  }, [onMove, onSelectGadget, onUseGadget, selectedGadget, onManualSlash]);

  const gadgetIcons: Record<GadgetType, React.ReactNode> = {
    smoke: <Cloud className="w-5 h-5" />,
    mine: <Bomb className="w-5 h-5" />,
    emp: <Zap className="w-5 h-5" />,
    camo: <EyeOff className="w-5 h-5" />,
  };

  const currentGadget = gadgets[selectedGadget];
  const isMineDetonateMode = selectedGadget === 'mine' && hasArmedMine;
  const isGadgetDisabled = !isMineDetonateMode && (currentGadget.charges <= 0 || currentGadget.currentCooldown > 0);

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 flex flex-col justify-end p-4 pb-5">
      {/* Bottom Control Bar */}
      <div className="w-full flex items-end justify-between gap-2">
        {/* Left Thumb: Virtual Touch Joystick */}
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

        {/* Right Thumb: Dedicated Gadget Selection Tray + Deploy & Strike Buttons */}
        <div className="pointer-events-auto flex flex-col items-end gap-2.5">
          {/* Dedicated Gadget Selector Tray */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-gray-950/80 border border-gray-800/80 backdrop-blur-md shadow-xl">
            {(['smoke', 'mine', 'emp', 'camo'] as GadgetType[]).map((type, idx) => {
              const g = gadgets[type];
              const isSelected = selectedGadget === type;
              const hasMineArmed = type === 'mine' && hasArmedMine;
              const hasNoCharges = g.charges <= 0 && !hasMineArmed;

              return (
                <button
                  key={type}
                  onClick={() => {
                    sound.playUiClick();
                    onSelectGadget(type);
                  }}
                  className={`relative w-12 h-12 rounded-xl flex flex-col items-center justify-center border transition-all active:scale-95 touch-manipulation ${
                    isSelected
                      ? hasMineArmed
                        ? 'bg-rose-950/90 border-rose-400 text-rose-300 ring-2 ring-rose-400/80 shadow-lg shadow-rose-950/60 scale-105'
                        : 'bg-cyan-950/90 border-cyan-400 text-cyan-300 ring-2 ring-cyan-400/80 shadow-lg shadow-cyan-950/60 scale-105'
                      : hasNoCharges
                      ? 'bg-gray-900/60 border-gray-800 text-gray-600 opacity-60'
                      : 'bg-gray-900/90 border-gray-700/80 text-gray-300 hover:text-white hover:border-gray-500'
                  }`}
                  aria-label={`Select ${g.name}`}
                >
                  {/* Selected Indicator Checkmark */}
                  {isSelected && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-cyan-400 text-gray-950 flex items-center justify-center shadow">
                      <CheckCircle2 className="w-3 h-3" />
                    </span>
                  )}

                  {/* Icon */}
                  {gadgetIcons[type]}

                  {/* Charge / Armed Counter */}
                  <span className="absolute bottom-0.5 right-1 text-[9px] font-mono font-bold">
                    {hasMineArmed ? '💣' : g.charges}
                  </span>

                  {/* Hotkey Tag */}
                  <span className="absolute top-0.5 left-1 text-[8px] font-mono text-gray-500">
                    {idx + 1}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Action Trigger Row: Selected Gadget Use Button + Melee Strike Button */}
          <div className="flex items-center gap-2.5">
            {/* Deploy / Detonate Gadget Button */}
            <button
              onClick={() => onUseGadget(selectedGadget)}
              disabled={isGadgetDisabled}
              className={`h-15 px-4 rounded-2xl flex items-center justify-center gap-2 border-2 transition-all active:scale-95 shadow-xl font-mono text-xs font-bold uppercase tracking-wider touch-manipulation ${
                isMineDetonateMode
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 border-white text-white shadow-rose-950/80 animate-pulse'
                  : isGadgetDisabled
                  ? 'bg-gray-900/80 border-gray-800 text-gray-600 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-cyan-600 via-sky-500 to-blue-600 border-cyan-300/60 text-white shadow-cyan-950/60 hover:from-cyan-500 hover:to-blue-500'
              }`}
              aria-label="Use Selected Gadget"
            >
              {gadgetIcons[selectedGadget]}
              <div className="flex flex-col items-start leading-tight">
                <span>
                  {isMineDetonateMode
                    ? 'DETONATE MINE!'
                    : selectedGadget === 'mine'
                    ? 'PLANT MINE'
                    : selectedGadget === 'smoke'
                    ? 'THROW SMOKE'
                    : `USE ${currentGadget.name}`}
                </span>
                <span className="text-[9px] text-white/70 font-normal">
                  {isMineDetonateMode ? 'BLAST RADIUS 140PX' : `${currentGadget.charges} CHARGES [E]`}
                </span>
              </div>
            </button>

            {/* Big Melee Strike Button */}
            <button
              onClick={onManualSlash}
              className="w-16 h-15 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-500 border-2 border-white/60 shadow-lg shadow-rose-900/60 flex flex-col items-center justify-center text-white active:scale-90 transition-all touch-manipulation"
              aria-label="Strike / Attack"
            >
              <Sword className="w-6 h-6" />
              <span className="text-[9px] font-mono font-bold tracking-wider uppercase mt-0.5">STRIKE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
