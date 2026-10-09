import React, { useState } from 'react';
import { PlayerStats } from '../types/game';
import { SKINS, BLADE_TRAILS, PERK_UPGRADES } from '../game/shopData';
import { X, Check, Lock, Zap, Shield, Sparkles, Coins, ShoppingBag } from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface ShopModalProps {
  stats: PlayerStats;
  onUpdateStats: (newStats: PlayerStats) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({ stats, onUpdateStats, onClose }) => {
  const [activeTab, setActiveTab] = useState<'skins' | 'trails' | 'perks'>('skins');

  const handleBuySkin = (skinId: string, cost: number) => {
    if (stats.credits < cost) return;
    sound.playCoin();
    onUpdateStats({
      ...stats,
      credits: stats.credits - cost,
      unlockedSkins: [...stats.unlockedSkins, skinId],
      equippedSkin: skinId,
    });
  };

  const handleEquipSkin = (skinId: string) => {
    sound.playUiClick();
    onUpdateStats({
      ...stats,
      equippedSkin: skinId,
    });
  };

  const handleBuyTrail = (trailId: string, cost: number) => {
    if (stats.credits < cost) return;
    sound.playCoin();
    onUpdateStats({
      ...stats,
      credits: stats.credits - cost,
      unlockedTrails: [...stats.unlockedTrails, trailId],
      equippedTrail: trailId,
    });
  };

  const handleEquipTrail = (trailId: string) => {
    sound.playUiClick();
    onUpdateStats({
      ...stats,
      equippedTrail: trailId,
    });
  };

  const handleUpgradePerk = (perkKey: keyof PlayerStats['perks'], baseCost: number) => {
    const currentTier = stats.perks[perkKey];
    const cost = baseCost * currentTier;
    if (stats.credits < cost) return;
    sound.playCoin();
    onUpdateStats({
      ...stats,
      credits: stats.credits - cost,
      perks: {
        ...stats.perks,
        [perkKey]: currentTier + 1,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none">
      <div className="w-full max-w-lg max-h-[92vh] rounded-3xl bg-gray-950 border border-amber-500/30 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-900 flex items-center justify-between bg-gray-900/50">
          <div>
            <h2 className="text-lg font-mono font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              CYBERNETIC ARSENAL
            </h2>
            <div className="flex items-center gap-1.5 mt-1 text-amber-300 font-mono text-xs font-bold">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>{stats.credits} CYBER CREDITS</span>
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

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 border-b border-gray-900 bg-gray-950/60 p-1.5 text-xs font-mono font-bold">
          <button
            onClick={() => {
              sound.playUiClick();
              setActiveTab('skins');
            }}
            className={`py-2 rounded-xl transition ${
              activeTab === 'skins'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            SKINS
          </button>
          <button
            onClick={() => {
              sound.playUiClick();
              setActiveTab('trails');
            }}
            className={`py-2 rounded-xl transition ${
              activeTab === 'trails'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            BLADES
          </button>
          <button
            onClick={() => {
              sound.playUiClick();
              setActiveTab('perks');
            }}
            className={`py-2 rounded-xl transition ${
              activeTab === 'perks'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            PERKS
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex flex-col gap-3.5">
          {/* TAB 1: SKINS */}
          {activeTab === 'skins' &&
            SKINS.map((skin) => {
              const isUnlocked = stats.unlockedSkins.includes(skin.id);
              const isEquipped = stats.equippedSkin === skin.id;
              const canAfford = stats.credits >= skin.cost;

              return (
                <div
                  key={skin.id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isEquipped
                      ? 'bg-cyan-950/30 border-cyan-400/60 shadow-md shadow-cyan-950/30'
                      : 'bg-gray-900/60 border-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Visual Avatar */}
                    <div
                      style={{ borderColor: skin.color }}
                      className="w-12 h-12 rounded-xl bg-gray-950 border-2 flex items-center justify-center relative shadow-inner"
                    >
                      <Shield style={{ color: skin.color }} className="w-6 h-6" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white font-mono">{skin.name}</h4>
                        {isEquipped && (
                          <span className="text-[10px] font-mono text-cyan-300 uppercase px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40">
                            EQUIPPED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{skin.description}</p>
                      <span className="inline-block mt-1 text-[11px] font-mono font-bold text-cyan-400">
                        ⚡ {skin.perkText}
                      </span>
                    </div>
                  </div>

                  <div>
                    {isUnlocked ? (
                      isEquipped ? (
                        <div className="p-2 text-cyan-400">
                          <Check className="w-5 h-5" />
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEquipSkin(skin.id)}
                          className="py-2 px-3.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-mono text-xs font-bold transition active:scale-95"
                        >
                          EQUIP
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => handleBuySkin(skin.id, skin.cost)}
                        disabled={!canAfford}
                        className={`py-2 px-3.5 rounded-xl font-mono text-xs font-bold transition flex items-center gap-1 active:scale-95 ${
                          canAfford
                            ? 'bg-amber-500 hover:bg-amber-400 text-gray-950 shadow-md shadow-amber-950'
                            : 'bg-gray-900 border border-gray-800 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>{skin.cost}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

          {/* TAB 2: BLADE TRAILS */}
          {activeTab === 'trails' &&
            BLADE_TRAILS.map((trail) => {
              const isUnlocked = stats.unlockedTrails.includes(trail.id);
              const isEquipped = stats.equippedTrail === trail.id;
              const canAfford = stats.credits >= trail.cost;

              return (
                <div
                  key={trail.id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isEquipped
                      ? 'bg-cyan-950/30 border-cyan-400/60 shadow-md shadow-cyan-950/30'
                      : 'bg-gray-900/60 border-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      style={{ borderColor: trail.color }}
                      className="w-12 h-12 rounded-xl bg-gray-950 border-2 flex items-center justify-center relative shadow-inner"
                    >
                      <Sparkles style={{ color: trail.color }} className="w-6 h-6" />
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white font-mono">{trail.name}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">{trail.description}</p>
                    </div>
                  </div>

                  <div>
                    {isUnlocked ? (
                      isEquipped ? (
                        <div className="p-2 text-cyan-400">
                          <Check className="w-5 h-5" />
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEquipTrail(trail.id)}
                          className="py-2 px-3.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-mono text-xs font-bold transition active:scale-95"
                        >
                          EQUIP
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => handleBuyTrail(trail.id, trail.cost)}
                        disabled={!canAfford}
                        className={`py-2 px-3.5 rounded-xl font-mono text-xs font-bold transition flex items-center gap-1 active:scale-95 ${
                          canAfford
                            ? 'bg-amber-500 hover:bg-amber-400 text-gray-950 shadow-md shadow-amber-950'
                            : 'bg-gray-900 border border-gray-800 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>{trail.cost}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

          {/* TAB 3: PERKS */}
          {activeTab === 'perks' &&
            PERK_UPGRADES.map((perk) => {
              const currentTier = stats.perks[perk.id as keyof PlayerStats['perks']];
              const isMax = currentTier >= perk.maxLevel;
              const nextCost = perk.baseCost * currentTier;
              const canAfford = stats.credits >= nextCost;

              return (
                <div
                  key={perk.id}
                  className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 flex items-center justify-between gap-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white font-mono">{perk.name}</h4>
                      <span className="text-[10px] font-mono text-cyan-400 px-1.5 py-0.5 rounded bg-gray-950 border border-gray-800">
                        TIER {currentTier}/{perk.maxLevel}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{perk.description}</p>
                    <span className="inline-block mt-1 text-[11px] font-mono font-bold text-emerald-400">
                      {perk.statBonus}
                    </span>
                  </div>

                  <div>
                    {isMax ? (
                      <span className="text-xs font-mono font-bold text-cyan-400 px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800">
                        MAX TIER
                      </span>
                    ) : (
                      <button
                        onClick={() =>
                          handleUpgradePerk(perk.id as keyof PlayerStats['perks'], perk.baseCost)
                        }
                        disabled={!canAfford}
                        className={`py-2 px-3.5 rounded-xl font-mono text-xs font-bold transition flex items-center gap-1 active:scale-95 ${
                          canAfford
                            ? 'bg-amber-500 hover:bg-amber-400 text-gray-950 shadow-md shadow-amber-950'
                            : 'bg-gray-900 border border-gray-800 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>{nextCost} CR</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
