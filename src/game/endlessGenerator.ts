import { Guard, GuardType, LaserTrap, LevelData, Terminal, HiddenVent, Wall } from '../types/game';

export function generateEndlessSector(sectorNumber: number): LevelData {
  const width = 1100 + Math.min(sectorNumber * 30, 300);
  const height = 800 + Math.min(sectorNumber * 20, 200);

  const walls: Wall[] = [
    // Outer border
    { x: 30, y: 30, w: width - 60, h: 20 },
    { x: 30, y: height - 50, w: width - 60, h: 20 },
    { x: 30, y: 30, w: 20, h: height - 60 },
    { x: width - 50, y: 30, w: 20, h: height - 60 },
  ];

  // Procedural internal columns and cover blocks
  const cols = 3 + (sectorNumber % 3);
  const rows = 2 + (sectorNumber % 2);
  const cellW = (width - 160) / cols;
  const cellH = (height - 160) / rows;

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const px = 100 + c * cellW + cellW * 0.3;
      const py = 100 + r * cellH + cellH * 0.3;

      if (Math.random() > 0.35) {
        // Wall or crate cluster
        const isCrate = Math.random() > 0.5;
        const blockW = isCrate ? 60 + Math.random() * 40 : 20 + Math.random() * 15;
        const blockH = isCrate ? 60 + Math.random() * 40 : 120 + Math.random() * 80;

        walls.push({
          x: Math.floor(px),
          y: Math.floor(py),
          w: Math.floor(blockW),
          h: Math.floor(blockH),
          type: isCrate ? 'crate' : 'wall',
        });
      }
    }
  }

  // Lasers
  const lasers: LaserTrap[] = [];
  const laserCount = Math.min(Math.floor(sectorNumber / 2), 4);
  for (let i = 0; i < laserCount; i++) {
    const lx = 300 + i * 200;
    lasers.push({
      id: `endless-laser-${i}`,
      x1: lx,
      y1: 150 + (i % 2) * 100,
      x2: lx,
      y2: 450 + (i % 2) * 100,
      active: true,
      cycleTime: 4.0 - Math.min(sectorNumber * 0.1, 1.5),
      activeDuration: 2.0,
      timer: (i * 0.8) % 3,
      terminalId: i === 0 ? `endless-term-${i}` : undefined,
    });
  }

  // Terminals
  const terminals: Terminal[] = [];
  if (lasers.length > 0 && lasers[0].terminalId) {
    terminals.push({
      id: lasers[0].terminalId,
      x: 180,
      y: 180,
      radius: 26,
      targetType: 'laser',
      targetId: lasers[0].id,
      hacked: false,
      label: 'OVERRIDE SECTOR LASER',
    });
  }

  // Hidden Vents
  const vents: HiddenVent[] = [
    {
      id: `endless-vent-${sectorNumber}`,
      name: `Duct Route ${sectorNumber}`,
      entrance: { x: 120, y: height - 120 },
      exit: { x: width - 160, y: 140 },
      radius: 24,
    },
  ];

  // Guards
  const guards: Guard[] = [];
  const baseGuardCount = 3 + Math.min(sectorNumber * 2, 10);

  // Available types by sector
  const possibleTypes: GuardType[] = ['scout'];
  if (sectorNumber >= 2) possibleTypes.push('drone');
  if (sectorNumber >= 3) possibleTypes.push('sniper');
  if (sectorNumber >= 4) possibleTypes.push('enforcer');

  for (let i = 0; i < baseGuardCount; i++) {
    const type = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
    const gx = 280 + Math.random() * (width - 400);
    const gy = 120 + Math.random() * (height - 240);

    const speed =
      type === 'drone'
        ? 2.2 + Math.min(sectorNumber * 0.1, 0.8)
        : type === 'enforcer'
        ? 1.4
        : type === 'sniper'
        ? 0.8
        : 1.7 + Math.min(sectorNumber * 0.08, 0.6);

    const viewDist =
      type === 'sniper'
        ? 380
        : type === 'drone'
        ? 180
        : type === 'enforcer'
        ? 240
        : 220;

    const fov =
      type === 'sniper'
        ? (24 * Math.PI) / 180
        : type === 'drone'
        ? (90 * Math.PI) / 180
        : type === 'enforcer'
        ? (75 * Math.PI) / 180
        : (65 * Math.PI) / 180;

    // Generate patrol path
    const p1 = { x: gx, y: gy };
    const p2 = {
      x: Math.max(100, Math.min(width - 100, gx + (Math.random() - 0.5) * 300)),
      y: Math.max(100, Math.min(height - 100, gy + (Math.random() - 0.5) * 300)),
    };

    guards.push({
      id: `endless-g-${sectorNumber}-${i}`,
      type,
      x: gx,
      y: gy,
      radius: type === 'enforcer' ? 20 : type === 'drone' ? 16 : 18,
      speed,
      rotation: Math.random() * Math.PI * 2,
      targetRotation: Math.random() * Math.PI * 2,
      viewDistance: viewDist,
      fov,
      patrolPoints: [p1, p2],
      currentPatrolIndex: 0,
      state: 'patrol',
      stateTimer: 0,
      isArmored: type === 'enforcer',
    });
  }

  return {
    id: 100 + sectorNumber,
    name: `Sector ${sectorNumber}: Endless Breach`,
    sectorName: `ENDLESS - SECTOR ${sectorNumber}`,
    description: `High-threat infinite simulation. Clear all ${guards.length} hostiles to proceed.`,
    width,
    height,
    playerStart: { x: 100, y: height / 2 },
    walls,
    lasers,
    terminals,
    vents,
    guards,
    parTime: 40 + sectorNumber * 5,
    coinReward: 200 + sectorNumber * 100,
  };
}
