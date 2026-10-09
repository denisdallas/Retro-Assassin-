/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GadgetType, LevelData, PlayerStats, Point } from './types/game';
import { CAMPAIGN_LEVELS } from './game/levels';
import { generateEndlessSector } from './game/endlessGenerator';
import {
  createInitialEngineState,
  GameEngineState,
  selectGadget,
  updateEngine,
  useGadget,
} from './game/engine';
import { GameCanvas } from './components/GameCanvas';
import { MobileControls } from './components/MobileControls';
import { HUD } from './components/HUD';
import { MainMenu } from './components/MainMenu';
import { LevelSelectModal } from './components/LevelSelectModal';
import { ShopModal } from './components/ShopModal';
import { VictoryModal } from './components/VictoryModal';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { EndlessModeModal } from './components/EndlessModeModal';
import { sound } from './audio/soundEngine';

const STORAGE_KEY = 'CYBER_SHADOW_STATE_V1';

const defaultStats: PlayerStats = {
  credits: 150,
  unlockedLevels: [1],
  levelStars: {},
  equippedSkin: 'default',
  unlockedSkins: ['default'],
  equippedTrail: 'cyan',
  unlockedTrails: ['cyan'],
  perks: {
    speedLevel: 1,
    reachLevel: 1,
    stealthLevel: 1,
    gadgetLevel: 1,
  },
  highScores: {
    endlessBestSector: 0,
    endlessBestKills: 0,
    highestCombo: 0,
    endlessHighScore: 0,
    endlessBestDuration: 0,
  },
};

export default function App() {
  // Load persistent stats
  const [stats, setStats] = useState<PlayerStats>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...defaultStats, ...JSON.parse(saved) };
    } catch {
      // Fallback
    }
    return defaultStats;
  });

  // Save persistent stats
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch {
      // Storage unavailable
    }
  }, [stats]);

  // Audio mute state
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // App Screen State
  const [currentScreen, setCurrentScreen] = useState<'menu' | 'playing'>('menu');
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showEndlessModal, setShowEndlessModal] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Game Engine State
  const [currentLevel, setCurrentLevel] = useState<LevelData>(CAMPAIGN_LEVELS[0]);
  const [isEndless, setIsEndless] = useState(false);
  const [endlessSector, setEndlessSector] = useState(1);
  const [engineState, setEngineState] = useState<GameEngineState | null>(null);

  // Inputs
  const inputVector = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const tapMoveTarget = useRef<Point | null>(null);

  // Toggle Audio
  const handleToggleAudio = () => {
    const next = !isAudioMuted;
    setIsAudioMuted(next);
    sound.setMusicMuted(next);
    sound.setSfxMuted(next);
  };

  // Start Level
  const startLevel = useCallback(
    (lvl: LevelData, endless = false, sector = 1) => {
      sound.unlockAudio();
      if (!isAudioMuted) {
        sound.startMusic();
      }
      setCurrentLevel(lvl);
      setIsEndless(endless);
      setEndlessSector(sector);
      inputVector.current = { dx: 0, dy: 0 };
      tapMoveTarget.current = null;
      setEngineState(createInitialEngineState(lvl, stats, endless));
      setIsPaused(false);
      setCurrentScreen('playing');
    },
    [isAudioMuted, stats]
  );

  // Start Campaign Level
  const handleStartCampaign = (levelId: number) => {
    const target = CAMPAIGN_LEVELS.find((l) => l.id === levelId) || CAMPAIGN_LEVELS[0];
    startLevel(target, false);
  };

  // Start Endless Mode
  const handleStartEndless = () => {
    setShowEndlessModal(true);
  };

  // Launch Endless Run from Modal
  const handleLaunchEndlessRun = () => {
    setShowEndlessModal(false);
    const sector1 = generateEndlessSector(1);
    startLevel(sector1, true, 1);
  };

  // Game Loop
  useEffect(() => {
    if (currentScreen !== 'playing' || !engineState || isPaused) return;

    let lastTime = performance.now();
    let animId: number;

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Update engine simulation
      updateEngine(
        engineState,
        dt,
        {
          dx: inputVector.current.dx,
          dy: inputVector.current.dy,
          tapMoveTarget: tapMoveTarget.current,
        },
        stats
      );

      // Force React state sync
      setEngineState({ ...engineState });

      // Check for victory settlement
      if (engineState.isVictory) {
        handleVictorySettlement(engineState);
        return;
      }

      if (engineState.isGameOver) {
        // Save endless record on game over
        if (engineState.isEndless) {
          setStats((prev) => ({
            ...prev,
            highScores: {
              ...prev.highScores,
              endlessHighScore: Math.max(prev.highScores.endlessHighScore || 0, engineState.score),
              endlessBestDuration: Math.max(prev.highScores.endlessBestDuration || 0, engineState.survivalDuration),
              endlessBestKills: Math.max(prev.highScores.endlessBestKills || 0, engineState.kills),
              endlessBestSector: Math.max(prev.highScores.endlessBestSector || 0, endlessSector),
            },
          }));
        }
        return;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [currentScreen, engineState, isPaused, stats, endlessSector]);

  // Victory Settlement logic
  const handleVictorySettlement = (state: GameEngineState) => {
    const isSpeedRun = state.timeElapsed <= currentLevel.parTime;
    const isGhost = state.alertsTriggered === 0;
    let earned = currentLevel.coinReward + state.creditsEarned;
    if (isSpeedRun) earned += 100;
    if (isGhost) earned += 150;

    setStats((prev) => {
      const nextCredits = prev.credits + earned;
      const nextUnlockedLevels = [...prev.unlockedLevels];
      if (!isEndless && currentLevel.id < 5) {
        if (!nextUnlockedLevels.includes(currentLevel.id + 1)) {
          nextUnlockedLevels.push(currentLevel.id + 1);
        }
      }

      const nextStars = { ...prev.levelStars };
      if (!isEndless) {
        nextStars[currentLevel.id] = {
          completed: true,
          speedRun: isSpeedRun || !!prev.levelStars[currentLevel.id]?.speedRun,
          ghostMode: isGhost || !!prev.levelStars[currentLevel.id]?.ghostMode,
        };
      }

      const nextHighScores = { ...prev.highScores };
      if (isEndless) {
        if (endlessSector > nextHighScores.endlessBestSector) {
          nextHighScores.endlessBestSector = endlessSector;
        }
        nextHighScores.endlessBestKills = Math.max(
          nextHighScores.endlessBestKills,
          state.kills
        );
        nextHighScores.endlessHighScore = Math.max(
          nextHighScores.endlessHighScore || 0,
          state.score
        );
        nextHighScores.endlessBestDuration = Math.max(
          nextHighScores.endlessBestDuration || 0,
          state.survivalDuration
        );
      }
      nextHighScores.highestCombo = Math.max(
        nextHighScores.highestCombo,
        state.maxCombo
      );

      return {
        ...prev,
        credits: nextCredits,
        unlockedLevels: nextUnlockedLevels,
        levelStars: nextStars,
        highScores: nextHighScores,
      };
    });
  };

  // Joystick Input
  const handleJoystickMove = (dx: number, dy: number) => {
    inputVector.current = { dx, dy };
    if (dx !== 0 || dy !== 0) {
      tapMoveTarget.current = null; // Joystick overrides tap
    }
  };

  // Tap-to-move input
  const handleTapMove = (point: Point | null) => {
    tapMoveTarget.current = point;
  };

  // Gadget Trigger
  const handleUseGadget = (type: GadgetType) => {
    if (engineState) {
      useGadget(engineState, type, stats);
    }
  };

  // Gadget Selection
  const handleSelectGadget = (type: GadgetType) => {
    if (engineState) {
      selectGadget(engineState, type);
    }
  };

  // Manual Slash Trigger
  const handleManualSlash = () => {
    if (engineState) {
      sound.playKnifeSlash();
    }
  };

  // Navigation handlers
  const handleNextLevel = () => {
    if (isEndless) {
      const nextSec = endlessSector + 1;
      const nextLvl = generateEndlessSector(nextSec);
      startLevel(nextLvl, true, nextSec);
    } else {
      const nextId = currentLevel.id + 1;
      const nextLvl = CAMPAIGN_LEVELS.find((l) => l.id === nextId);
      if (nextLvl) {
        startLevel(nextLvl, false);
      } else {
        // All completed, go to menu
        setCurrentScreen('menu');
      }
    }
  };

  const handleReplay = () => {
    if (isEndless) {
      const restartedSector = generateEndlessSector(endlessSector);
      startLevel(restartedSector, true, endlessSector);
    } else {
      startLevel(currentLevel, false);
    }
  };

  const handleReturnHome = () => {
    sound.stopMusic();
    setIsPaused(false);
    setCurrentScreen('menu');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-950 text-gray-100 flex flex-col font-sans select-none">
      {/* MAIN MENU */}
      {currentScreen === 'menu' && (
        <MainMenu
          stats={stats}
          onStartCampaign={handleStartCampaign}
          onStartEndless={handleStartEndless}
          onOpenShop={() => setShowShop(true)}
          onOpenLevelSelect={() => setShowLevelSelect(true)}
          isAudioMuted={isAudioMuted}
          onToggleAudio={handleToggleAudio}
        />
      )}

      {/* GAME PLAYING VIEW */}
      {currentScreen === 'playing' && engineState && (
        <div className="relative w-full h-full">
          {/* Top HUD */}
          <HUD
            engineState={engineState}
            level={currentLevel}
            stats={stats}
            isEndless={isEndless}
            endlessSector={endlessSector}
            onPause={() => setIsPaused(true)}
            isAudioMuted={isAudioMuted}
            onToggleAudio={handleToggleAudio}
          />

          {/* Canvas Viewport */}
          <GameCanvas
            engineState={engineState}
            stats={stats}
            onTapMove={handleTapMove}
          />

          {/* Android Mobile Controls (Joystick, Gadget Selection Bar & Detonator) */}
          <MobileControls
            onMove={handleJoystickMove}
            selectedGadget={engineState.selectedGadget}
            onSelectGadget={handleSelectGadget}
            onUseGadget={handleUseGadget}
            gadgets={engineState.gadgets}
            hasArmedMine={engineState.mines.length > 0}
            onManualSlash={handleManualSlash}
          />

          {/* Victory Modal */}
          {engineState.isVictory && (
            <VictoryModal
              engineState={engineState}
              level={currentLevel}
              isEndless={isEndless}
              endlessSector={endlessSector}
              onNextLevel={handleNextLevel}
              onReplay={handleReplay}
              onHome={handleReturnHome}
            />
          )}

          {/* Game Over Modal */}
          {engineState.isGameOver && (
            <GameOverModal
              engineState={engineState}
              onRetry={handleReplay}
              onHome={handleReturnHome}
            />
          )}

          {/* Pause Modal */}
          {isPaused && (
            <PauseModal
              onResume={() => setIsPaused(false)}
              onRestart={handleReplay}
              onHome={handleReturnHome}
              isAudioMuted={isAudioMuted}
              onToggleAudio={handleToggleAudio}
            />
          )}
        </div>
      )}

      {/* OVERLAY MODALS (FROM MAIN MENU) */}
      {showEndlessModal && (
        <EndlessModeModal
          stats={stats}
          onLaunch={handleLaunchEndlessRun}
          onClose={() => setShowEndlessModal(false)}
        />
      )}

      {showLevelSelect && (
        <LevelSelectModal
          stats={stats}
          onSelectLevel={(lvlId) => {
            setShowLevelSelect(false);
            handleStartCampaign(lvlId);
          }}
          onClose={() => setShowLevelSelect(false)}
        />
      )}

      {showShop && (
        <ShopModal
          stats={stats}
          onUpdateStats={setStats}
          onClose={() => setShowShop(false)}
        />
      )}
    </div>
  );
}
