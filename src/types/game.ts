export type GuardType = 'scout' | 'sniper' | 'drone' | 'enforcer' | 'boss';

export type GuardState = 'patrol' | 'investigate' | 'alert' | 'stunned' | 'dead';

export interface Point {
  x: number;
  y: number;
}

export interface Wall {
  x: number;
  y: number;
  w: number;
  h: number;
  type?: 'wall' | 'crate' | 'glass';
}

export interface LaserTrap {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  active: boolean;
  cycleTime: number; // in seconds
  activeDuration: number; // in seconds
  timer: number;
  terminalId?: string; // can be disabled by terminal
  moving?: boolean;
  moveAxis?: 'x' | 'y';
  moveRange?: number;
  moveSpeed?: number;
  initialX1?: number;
  initialY1?: number;
  initialX2?: number;
  initialY2?: number;
}

export interface Terminal {
  id: string;
  x: number;
  y: number;
  radius: number;
  targetType: 'laser' | 'door';
  targetId: string;
  hacked: boolean;
  label: string;
}

export interface HiddenVent {
  id: string;
  entrance: Point;
  exit: Point;
  radius: number;
  name: string;
}

export interface Guard {
  id: string;
  type: GuardType;
  x: number;
  y: number;
  radius: number;
  speed: number;
  rotation: number; // radians
  targetRotation: number;
  viewDistance: number;
  fov: number; // Field of view in radians
  patrolPoints: Point[];
  currentPatrolIndex: number;
  state: GuardState;
  stateTimer: number;
  investigateTarget?: Point;
  stunTimer?: number;
  isArmored?: boolean; // Can only be killed from behind or when stunned
  health?: number;
  maxHealth?: number;
  bossPhase?: number;
}

export interface BossEntity extends Guard {
  maxHealth: number;
  health: number;
  phase: number;
  shieldActive: boolean;
  attackCooldown: number;
  attackPattern: 'sweep' | 'barrage' | 'charge' | 'summon';
  warningAreas: { x: number; y: number; radius: number; timer: number; maxTimer: number }[];
}

export type GadgetType = 'smoke' | 'decoy' | 'emp' | 'camo';

export interface GadgetItem {
  type: GadgetType;
  name: string;
  description: string;
  icon: string;
  charges: number;
  maxCharges: number;
  cooldown: number;
  currentCooldown: number;
}

export interface SmokeCloud {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  duration: number;
  remaining: number;
}

export interface DecoyEntity {
  x: number;
  y: number;
  remaining: number;
  pulseTimer: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  type?: 'spark' | 'blood' | 'smoke' | 'emp' | 'laser' | 'slice';
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  life: number;
}

export interface LevelData {
  id: number;
  name: string;
  sectorName: string;
  description: string;
  width: number;
  height: number;
  playerStart: Point;
  walls: Wall[];
  guards: Guard[];
  boss?: BossEntity;
  lasers: LaserTrap[];
  terminals: Terminal[];
  vents: HiddenVent[];
  parTime: number; // Seconds for speed run challenge
  coinReward: number;
}

export interface SkinItem {
  id: string;
  name: string;
  cost: number;
  color: string;
  accentColor: string;
  description: string;
  speedBonus: number;
  reachBonus: number;
  perkText: string;
}

export interface BladeTrailItem {
  id: string;
  name: string;
  cost: number;
  color: string;
  particleColor: string;
  description: string;
}

export interface PerkUpgrade {
  id: string;
  name: string;
  level: number;
  maxLevel: number;
  baseCost: number;
  description: string;
  statBonus: string;
}

export interface PlayerStats {
  credits: number;
  unlockedLevels: number[];
  levelStars: Record<number, { completed: boolean; speedRun: boolean; ghostMode: boolean }>;
  equippedSkin: string;
  unlockedSkins: string[];
  equippedTrail: string;
  unlockedTrails: string[];
  perks: {
    speedLevel: number;
    reachLevel: number;
    stealthLevel: number;
    gadgetLevel: number;
  };
  highScores: {
    endlessBestSector: number;
    endlessBestKills: number;
    highestCombo: number;
  };
}
