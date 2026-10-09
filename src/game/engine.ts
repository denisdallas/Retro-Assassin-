import {
  BossEntity,
  DecoyEntity,
  EnvironmentalSwitch,
  FloatingText,
  GadgetItem,
  GadgetType,
  Guard,
  HiddenVent,
  LaserTrap,
  LevelData,
  Particle,
  PlayerStats,
  Point,
  RemoteMine,
  SmokeCloud,
  Terminal,
  Wall,
} from '../types/game';
import { sound } from '../audio/soundEngine';
import { SKINS, BLADE_TRAILS } from './shopData';

export interface GameEngineState {
  player: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    rotation: number;
    speed: number;
    isCamo: boolean;
    camoTimer: number;
    adrenalineTimer: number;
  };
  guards: Guard[];
  boss: BossEntity | null;
  lasers: LaserTrap[];
  switches: EnvironmentalSwitch[];
  terminals: Terminal[];
  vents: HiddenVent[];
  walls: Wall[];
  smokeClouds: SmokeCloud[];
  decoys: DecoyEntity[];
  mines: RemoteMine[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  gadgets: Record<GadgetType, GadgetItem>;
  selectedGadget: GadgetType;
  combo: number;
  comboTimer: number;
  maxCombo: number;
  timeElapsed: number;
  survivalDuration: number;
  alertsTriggered: number;
  kills: number;
  creditsEarned: number;
  score: number;
  isGameOver: boolean;
  isVictory: boolean;
  isEndless: boolean;
  gameStatusText: string;
  interactingTerminal: Terminal | null;
  terminalHackProgress: number;
  lastHaptic: number;
  lastSwitchToggle: number;
}

// Line intersection helper
export function lineIntersectsRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): boolean {
  // Check if either end is inside
  if (
    (x1 >= rx && x1 <= rx + rw && y1 >= ry && y1 <= ry + rh) ||
    (x2 >= rx && x2 <= rx + rw && y2 >= ry && y2 <= ry + rh)
  ) {
    return true;
  }

  // Check intersection with each of 4 edges
  const edges = [
    { x3: rx, y3: ry, x4: rx + rw, y4: ry },
    { x3: rx + rw, y3: ry, x4: rx + rw, y4: ry + rh },
    { x3: rx, y3: ry + rh, x4: rx + rw, y4: ry + rh },
    { x3: rx, y3: ry, x4: rx, y4: ry + rh },
  ];

  for (const edge of edges) {
    const denom = (edge.y4 - edge.y3) * (x2 - x1) - (edge.x4 - edge.x3) * (y2 - y1);
    if (denom === 0) continue;
    const ua = ((edge.x4 - edge.x3) * (y1 - edge.y3) - (edge.y4 - edge.y3) * (x1 - edge.x3)) / denom;
    const ub = ((x2 - x1) * (y1 - edge.y3) - (y2 - y1) * (x1 - edge.x3)) / denom;
    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
      return true;
    }
  }

  return false;
}

export function distSq(p1: Point, p2: Point): number {
  return (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
}

export function hasLineOfSight(p1: Point, p2: Point, walls: Wall[]): boolean {
  for (const wall of walls) {
    if (lineIntersectsRect(p1.x, p1.y, p2.x, p2.y, wall.x, wall.y, wall.w, wall.h)) {
      return false;
    }
  }
  return true;
}

export function createInitialEngineState(
  level: LevelData,
  stats: PlayerStats,
  isEndless: boolean = false
): GameEngineState {
  const skin = SKINS.find((s) => s.id === stats.equippedSkin) || SKINS[0];
  const speedPerkMult = 1 + (stats.perks.speedLevel - 1) * 0.1;
  const baseSpeed = 3.6 * (1 + skin.speedBonus) * speedPerkMult;
  const gadgetBonus = stats.perks.gadgetLevel - 1;

  // Deep clone guards
  const guards: Guard[] = level.guards.map((g) => ({
    ...g,
    patrolPoints: g.patrolPoints.map((p) => ({ ...p })),
    state: 'patrol',
    stateTimer: 0,
    stunTimer: 0,
  }));

  // Deep clone boss if present
  let boss: BossEntity | null = null;
  if (level.boss) {
    boss = {
      ...level.boss,
      patrolPoints: level.boss.patrolPoints.map((p) => ({ ...p })),
      warningAreas: [],
    };
  }

  // Deep clone lasers
  const lasers: LaserTrap[] = level.lasers.map((l) => ({ ...l }));

  // Deep clone environmental switches
  const switches: EnvironmentalSwitch[] = (level.switches || []).map((s) => ({ ...s }));

  // Deep clone terminals
  const terminals: Terminal[] = level.terminals.map((t) => ({ ...t, hacked: false }));

  // Deep clone vents
  const vents: HiddenVent[] = level.vents.map((v) => ({ ...v }));

  return {
    player: {
      x: level.playerStart.x,
      y: level.playerStart.y,
      vx: 0,
      vy: 0,
      radius: 16,
      rotation: 0,
      speed: baseSpeed,
      isCamo: false,
      camoTimer: 0,
      adrenalineTimer: 0,
    },
    guards,
    boss,
    lasers,
    switches,
    terminals,
    vents,
    walls: level.walls,
    smokeClouds: [],
    decoys: [],
    mines: [],
    particles: [],
    floatingTexts: [],
    selectedGadget: 'smoke',
    gadgets: {
      smoke: {
        type: 'smoke',
        name: 'Smoke Bomb',
        description: 'Blinds guards & blocks vision',
        icon: 'Cloud',
        charges: 2 + gadgetBonus,
        maxCharges: 2 + gadgetBonus,
        cooldown: 8,
        currentCooldown: 0,
      },
      mine: {
        type: 'mine',
        name: 'Remote Mine',
        description: 'Deploy & detonate to eliminate',
        icon: 'Bomb',
        charges: 2 + gadgetBonus,
        maxCharges: 2 + gadgetBonus,
        cooldown: 8,
        currentCooldown: 0,
      },
      emp: {
        type: 'emp',
        name: 'EMP Pulse',
        description: 'Disables lasers & stuns guards',
        icon: 'Zap',
        charges: 1 + gadgetBonus,
        maxCharges: 1 + gadgetBonus,
        cooldown: 14,
        currentCooldown: 0,
      },
      camo: {
        type: 'camo',
        name: 'Active Camo',
        description: 'Stealth cloak for 3.5s',
        icon: 'EyeOff',
        charges: 2 + gadgetBonus,
        maxCharges: 2 + gadgetBonus,
        cooldown: 12,
        currentCooldown: 0,
      },
    },
    combo: 0,
    comboTimer: 0,
    maxCombo: 0,
    timeElapsed: 0,
    survivalDuration: 0,
    alertsTriggered: 0,
    kills: 0,
    creditsEarned: 0,
    score: 0,
    isGameOver: false,
    isVictory: false,
    isEndless,
    gameStatusText: '',
    interactingTerminal: null,
    terminalHackProgress: 0,
    lastHaptic: 0,
    lastSwitchToggle: 0,
  };
}

export function updateEngine(
  state: GameEngineState,
  dt: number,
  input: { dx: number; dy: number; tapMoveTarget?: Point | null },
  stats: PlayerStats
) {
  if (state.isGameOver || state.isVictory) return;

  state.timeElapsed += dt;
  if (state.isEndless) {
    state.survivalDuration += dt;
    state.score = state.kills * 100 + Math.floor(state.survivalDuration * 10) + state.creditsEarned;
  }

  const skin = SKINS.find((s) => s.id === stats.equippedSkin) || SKINS[0];
  const reachPerkMult = 1 + (stats.perks.reachLevel - 1) * 0.12;
  const strikeRange = (54 * (1 + skin.reachBonus)) * reachPerkMult;
  const detectionGrace = 0.35 + (skin.id === 'ghost' ? 0.4 : 0) + (stats.perks.stealthLevel - 1) * 0.2;
  const creditMultiplier = skin.id === 'gold' ? 1.5 : 1.0;

  // 1. Combo Timer
  if (state.comboTimer > 0) {
    state.comboTimer -= dt;
    if (state.comboTimer <= 0) {
      state.combo = 0;
    }
  }

  // 2. Adrenaline Timer
  let currentSpeed = state.player.speed;
  if (state.player.adrenalineTimer > 0) {
    state.player.adrenalineTimer -= dt;
    currentSpeed *= 1.25;
  }

  // 3. Camo Timer
  if (state.player.camoTimer > 0) {
    state.player.camoTimer -= dt;
    if (state.player.camoTimer <= 0) {
      state.player.isCamo = false;
    }
  }

  // 4. Gadget Cooldowns
  Object.values(state.gadgets).forEach((g) => {
    if (g.currentCooldown > 0) {
      g.currentCooldown = Math.max(0, g.currentCooldown - dt);
    }
  });

  // 5. Player Movement
  let targetVx = 0;
  let targetVy = 0;

  if (input.tapMoveTarget) {
    const tdx = input.tapMoveTarget.x - state.player.x;
    const tdy = input.tapMoveTarget.y - state.player.y;
    const tDist = Math.sqrt(tdx * tdx + tdy * tdy);
    if (tDist > 8) {
      targetVx = (tdx / tDist) * currentSpeed;
      targetVy = (tdy / tDist) * currentSpeed;
      state.player.rotation = Math.atan2(tdy, tdx);
    }
  } else if (input.dx !== 0 || input.dy !== 0) {
    const len = Math.sqrt(input.dx * input.dx + input.dy * input.dy);
    const normLen = Math.min(len, 1);
    targetVx = (input.dx / (len || 1)) * currentSpeed * normLen;
    targetVy = (input.dy / (len || 1)) * currentSpeed * normLen;
    state.player.rotation = Math.atan2(input.dy, input.dx);
  }

  // Move with collision against walls
  const nextX = state.player.x + targetVx;
  const nextY = state.player.y + targetVy;

  // Resolve X
  let canMoveX = true;
  for (const wall of state.walls) {
    if (
      nextX + state.player.radius > wall.x &&
      nextX - state.player.radius < wall.x + wall.w &&
      state.player.y + state.player.radius > wall.y &&
      state.player.y - state.player.radius < wall.y + wall.h
    ) {
      canMoveX = false;
      break;
    }
  }
  if (canMoveX) state.player.x = nextX;

  // Resolve Y
  let canMoveY = true;
  for (const wall of state.walls) {
    if (
      state.player.x + state.player.radius > wall.x &&
      state.player.x - state.player.radius < wall.x + wall.w &&
      nextY + state.player.radius > wall.y &&
      nextY - state.player.radius < wall.y + wall.h
    ) {
      canMoveY = false;
      break;
    }
  }
  if (canMoveY) state.player.y = nextY;

  // Footstep sound & movement particles
  if (Math.abs(targetVx) > 0.5 || Math.abs(targetVy) > 0.5) {
    if (Math.random() < 0.1) {
      sound.playFootstep();
    }
    // Subtle blade trail / shadow dust
    if (Math.random() < 0.35) {
      const trail = BLADE_TRAILS.find((t) => t.id === stats.equippedTrail) || BLADE_TRAILS[0];
      state.particles.push({
        x: state.player.x + (Math.random() - 0.5) * 8,
        y: state.player.y + (Math.random() - 0.5) * 8,
        vx: -targetVx * 0.15 + (Math.random() - 0.5) * 0.4,
        vy: -targetVy * 0.15 + (Math.random() - 0.5) * 0.4,
        color: trail.particleColor,
        size: 2.5 + Math.random() * 2,
        alpha: 0.7,
        life: 0.3,
        maxLife: 0.3,
        type: 'slice',
      });
    }
  }

  // 6. Update Smoke Clouds
  for (let i = state.smokeClouds.length - 1; i >= 0; i--) {
    const smoke = state.smokeClouds[i];
    smoke.remaining -= dt;
    if (smoke.remaining <= 0) {
      state.smokeClouds.splice(i, 1);
    } else {
      if (smoke.radius < smoke.maxRadius) {
        smoke.radius = Math.min(smoke.maxRadius, smoke.radius + dt * 100);
      }
      // Smoke puff particles
      if (Math.random() < 0.25) {
        state.particles.push({
          x: smoke.x + (Math.random() - 0.5) * smoke.radius * 1.5,
          y: smoke.y + (Math.random() - 0.5) * smoke.radius * 1.5,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          color: '#94a3b8',
          size: 6 + Math.random() * 8,
          alpha: 0.35,
          life: 0.6,
          maxLife: 0.6,
          type: 'smoke',
        });
      }
    }
  }

  // 7. Update Decoys and Mines
  for (let i = state.decoys.length - 1; i >= 0; i--) {
    const decoy = state.decoys[i];
    decoy.remaining -= dt;
    decoy.pulseTimer += dt;
    if (decoy.pulseTimer > 0.8) {
      decoy.pulseTimer = 0;
      sound.playDecoy();
    }
    if (decoy.remaining <= 0) {
      state.decoys.splice(i, 1);
    }
  }

  // Remote Mines pulsing
  state.mines.forEach((mine) => {
    mine.pulseTimer += dt;
    if (mine.pulseTimer >= 0.9) {
      mine.pulseTimer = 0;
      sound.playMineBeep();
    }
  });

  // Environmental Switches
  state.switches.forEach((sw) => {
    const pDist = Math.sqrt(distSq(state.player, sw));
    if (pDist < sw.radius + state.player.radius + 10 && Date.now() - state.lastSwitchToggle > 1000) {
      state.lastSwitchToggle = Date.now();
      sw.isOn = !sw.isOn;
      sound.playSwitchToggle();
      triggerHaptic([30, 25]);
      const targetLaser = state.lasers.find((l) => l.id === sw.targetLaserId);
      if (targetLaser) {
        targetLaser.active = sw.isOn;
        if (!sw.isOn) {
          targetLaser.timer = targetLaser.cycleTime;
        }
      }
      state.floatingTexts.push({
        id: `sw-${Date.now()}`,
        x: sw.x,
        y: sw.y - 30,
        text: sw.isOn ? 'SECURITY LASER ARMED' : 'SECURITY LASER DISABLED',
        color: sw.isOn ? '#ef4444' : '#10b981',
        alpha: 1.0,
        life: 1.5,
      });
    }

    // Guard interaction with switch
    if (sw.controllableByGuard && !sw.isOn) {
      state.guards.forEach((g) => {
        if (g.state !== 'dead') {
          const gDist = Math.sqrt(distSq(g, sw));
          if (gDist < sw.radius + g.radius + 8) {
            sw.isOn = true;
            sound.playAlertBuzzer();
            const targetLaser = state.lasers.find((l) => l.id === sw.targetLaserId);
            if (targetLaser) {
              targetLaser.active = true;
            }
            state.floatingTexts.push({
              id: `guard-sw-${Date.now()}`,
              x: sw.x,
              y: sw.y - 30,
              text: 'GUARD RE-ARMED LASER!',
              color: '#f59e0b',
              alpha: 1.0,
              life: 1.8,
            });
          }
        }
      });
    }
  });

  // 8. Update Laser Traps
  state.lasers.forEach((laser) => {
    // Moving lasers
    if (laser.moving && laser.initialX1 !== undefined && laser.initialY1 !== undefined) {
      const speed = laser.moveSpeed || 1;
      const range = laser.moveRange || 200;
      const offset = Math.sin(state.timeElapsed * speed) * (range / 2) + range / 2;
      if (laser.moveAxis === 'x') {
        laser.x1 = laser.initialX1 + offset;
        laser.x2 = (laser.initialX2 || laser.initialX1) + offset;
      } else {
        laser.y1 = laser.initialY1 + offset;
        laser.y2 = (laser.initialY2 || laser.initialY1) + offset;
      }
    }

    // Active cycle
    laser.timer = (laser.timer + dt) % laser.cycleTime;
    laser.active = laser.timer < laser.activeDuration;

    // Check collision with player
    if (laser.active && !state.player.isCamo) {
      const dist = pointToSegmentDistance(
        state.player.x,
        state.player.y,
        laser.x1,
        laser.y1,
        laser.x2,
        laser.y2
      );
      if (dist < state.player.radius + 4) {
        // Trigger Laser Alarm / Instant Defeat
        triggerDefeat(state, 'SECURITY BREACH: Vaporized by high-energy laser trap.');
        sound.playLaserZap();
      }
    }
  });

  // 9. Update Terminals Interaction
  let nearTerminal: Terminal | null = null;
  state.terminals.forEach((term) => {
    if (!term.hacked) {
      const d = Math.sqrt(distSq(state.player, { x: term.x, y: term.y }));
      if (d < term.radius + state.player.radius + 15) {
        nearTerminal = term;
      }
    }
  });

  if (nearTerminal) {
    state.interactingTerminal = nearTerminal;
    state.terminalHackProgress += dt * 0.75; // Takes ~1.3 seconds
    if (state.terminalHackProgress >= 1.0) {
      (nearTerminal as Terminal).hacked = true;
      state.terminalHackProgress = 0;
      state.interactingTerminal = null;
      sound.playTerminalHack();

      // Disable linked lasers or boss shields
      state.lasers.forEach((l) => {
        if (l.terminalId === (nearTerminal as Terminal).id) {
          l.active = false;
          l.activeDuration = 0;
        }
      });

      if ((nearTerminal as Terminal).targetId === 'boss-shield' && state.boss) {
        state.boss.shieldActive = false;
        state.floatingTexts.push({
          id: `boss-shield-down-${Date.now()}`,
          x: state.boss.x,
          y: state.boss.y - 45,
          text: 'SHIELD DISRUPTED!',
          color: '#00f0ff',
          alpha: 1.0,
          life: 2.0,
        });
      }

      state.floatingTexts.push({
        id: `term-hacked-${Date.now()}`,
        x: (nearTerminal as Terminal).x,
        y: (nearTerminal as Terminal).y - 30,
        text: 'OVERRIDE COMPLETE!',
        color: '#10b981',
        alpha: 1.0,
        life: 1.5,
      });
    }
  } else {
    state.interactingTerminal = null;
    state.terminalHackProgress = 0;
  }

  // 10. Update Vents
  state.vents.forEach((vent) => {
    const dEnt = Math.sqrt(distSq(state.player, vent.entrance));
    const dExit = Math.sqrt(distSq(state.player, vent.exit));

    if (dEnt < vent.radius + state.player.radius) {
      // Teleport to exit
      state.player.x = vent.exit.x + 20;
      state.player.y = vent.exit.y;
      sound.playVentEnter();
      spawnVentTeleportParticles(state, vent.entrance, vent.exit);
    } else if (dExit < vent.radius + state.player.radius) {
      // Teleport to entrance
      state.player.x = vent.entrance.x - 20;
      state.player.y = vent.entrance.y;
      sound.playVentEnter();
      spawnVentTeleportParticles(state, vent.exit, vent.entrance);
    }
  });

  // 11. Check Player Assassinations on Guards
  const allEnemies: Guard[] = [...state.guards];
  if (state.boss && state.boss.state !== 'dead') allEnemies.push(state.boss);

  for (const enemy of allEnemies) {
    if (enemy.state === 'dead') continue;

    const d = Math.sqrt(distSq(state.player, enemy));
    if (d <= strikeRange && hasLineOfSight(state.player, enemy, state.walls)) {
      // Check armored guard angle
      if (enemy.isArmored && enemy.stunTimer! <= 0) {
        // Enforcer shield check: Angle from guard's facing direction
        const angleToPlayer = Math.atan2(state.player.y - enemy.y, state.player.x - enemy.x);
        let angleDiff = Math.abs(normalizeAngle(angleToPlayer - enemy.rotation));
        if (angleDiff < Math.PI * 0.45) {
          // Attacked from front! Shield blocks & deflects
          if (Date.now() - state.lastHaptic > 500) {
            state.lastHaptic = Date.now();
            sound.playAlertBuzzer();
            state.floatingTexts.push({
              id: `shield-blocked-${Date.now()}`,
              x: enemy.x,
              y: enemy.y - 30,
              text: 'SHIELD BLOCKED! FLANK FROM BEHIND',
              color: '#f59e0b',
              alpha: 1.0,
              life: 1.2,
            });
          }
          continue;
        }
      }

      // Check Boss shield
      if (enemy.type === 'boss') {
        const boss = state.boss!;
        if (boss.shieldActive) {
          if (Date.now() - state.lastHaptic > 600) {
            state.lastHaptic = Date.now();
            sound.playAlertBuzzer();
            state.floatingTexts.push({
              id: `boss-shield-${Date.now()}`,
              x: boss.x,
              y: boss.y - 45,
              text: 'ENERGY SHIELD ACTIVE! HACK TERMINALS',
              color: '#ef4444',
              alpha: 1.0,
              life: 1.5,
            });
          }
          continue;
        }

        // Damage Boss!
        boss.health--;
        sound.playKnifeSlash();
        triggerHaptic([30, 40, 50]);
        spawnAssassinationParticles(state, boss.x, boss.y);

        if (boss.health <= 0) {
          boss.state = 'dead';
          state.kills++;
          sound.playBossAlarm();
          state.floatingTexts.push({
            id: `boss-dead-${Date.now()}`,
            x: boss.x,
            y: boss.y - 45,
            text: 'CYBER-COLOSSUS DESTROYED!',
            color: '#10b981',
            alpha: 1.0,
            life: 3.0,
          });
          checkVictory(state, stats);
        } else {
          // Boss phase transition
          boss.phase++;
          boss.shieldActive = true; // reactivate shield
          // Reset terminals so player must hack again
          state.terminals.forEach((t) => {
            if (t.targetId === 'boss-shield') t.hacked = false;
          });
          boss.attackCooldown = 1.0;
          state.floatingTexts.push({
            id: `boss-hit-${Date.now()}`,
            x: boss.x,
            y: boss.y - 45,
            text: `CORE HIT! HP: ${boss.health}/${boss.maxHealth}`,
            color: '#f59e0b',
            alpha: 1.0,
            life: 1.8,
          });
        }
        break;
      }

      // Standard / Special Guard Assassination!
      enemy.state = 'dead';
      state.kills++;
      sound.playKnifeSlash();
      triggerHaptic([20, 25, 30]);

      // Combo Chain
      state.combo++;
      state.comboTimer = 4.0;
      if (state.combo > state.maxCombo) {
        state.maxCombo = state.combo;
      }
      sound.playComboUp(state.combo);

      // Adrenaline speed burst
      state.player.adrenalineTimer = 1.2;

      // Credits earned
      const baseCredit = enemy.type === 'enforcer' ? 80 : enemy.type === 'sniper' ? 60 : 45;
      const comboBonus = state.combo > 1 ? (state.combo - 1) * 20 : 0;
      const totalEarned = Math.round((baseCredit + comboBonus) * creditMultiplier);
      state.creditsEarned += totalEarned;

      // Visuals
      spawnAssassinationParticles(state, enemy.x, enemy.y);
      state.floatingTexts.push({
        id: `kill-${Date.now()}-${Math.random()}`,
        x: enemy.x,
        y: enemy.y - 25,
        text: state.combo > 1 ? `COMBO x${state.combo} +${totalEarned} CR` : `STRIKE +${totalEarned} CR`,
        color: state.combo > 1 ? '#00f0ff' : '#10b981',
        alpha: 1.0,
        life: 1.4,
      });

      checkVictory(state, stats);
      break;
    }
  }

  // 12. Guard AI & Vision Cone Checks
  state.guards.forEach((guard) => {
    if (guard.state === 'dead') return;

    // Stun recovery
    if (guard.stunTimer && guard.stunTimer > 0) {
      guard.stunTimer -= dt;
      if (guard.stunTimer <= 0) {
        guard.state = 'patrol';
      }
      return;
    }

    // Vision Check against Player
    let playerSpotted = false;
    if (!state.player.isCamo) {
      // Is player inside smoke cloud?
      let inSmoke = false;
      for (const smoke of state.smokeClouds) {
        if (distSq(state.player, smoke) < smoke.radius * smoke.radius) {
          inSmoke = true;
          break;
        }
      }

      if (!inSmoke) {
        const d = Math.sqrt(distSq(guard, state.player));
        if (d <= guard.viewDistance) {
          const angleToPlayer = Math.atan2(state.player.y - guard.y, state.player.x - guard.x);
          const angleDiff = Math.abs(normalizeAngle(angleToPlayer - guard.rotation));

          // Drones also have 360 degree close radar (65px)
          const isDroneCloseRadar = guard.type === 'drone' && d < 65;

          if (angleDiff <= guard.fov / 2 || isDroneCloseRadar) {
            // Line of sight raycast
            if (hasLineOfSight(guard, state.player, state.walls)) {
              // Also ensure ray doesn't pass through a smoke cloud
              let rayBlockedBySmoke = false;
              for (const smoke of state.smokeClouds) {
                if (
                  pointToSegmentDistance(smoke.x, smoke.y, guard.x, guard.y, state.player.x, state.player.y) <
                  smoke.radius
                ) {
                  rayBlockedBySmoke = true;
                  break;
                }
              }

              if (!rayBlockedBySmoke) {
                playerSpotted = true;
              }
            }
          }
        }
      }
    }

    if (playerSpotted) {
      if (state.isEndless) {
        guard.state = 'alert';
        state.alertsTriggered++;
        sound.playAlertBuzzer();
        sound.playGunshot();
        triggerDefeat(state, 'DETECTED: In Endless Mode, stealth compromise results in immediate extraction failure.');
        return;
      }

      // Guard is spotting player!
      guard.targetRotation = Math.atan2(state.player.y - guard.y, state.player.x - guard.x);
      guard.rotation = rotateTowards(guard.rotation, guard.targetRotation, 10 * dt);

      guard.stateTimer += dt;
      if (guard.stateTimer >= detectionGrace) {
        // FULL ALERT! Guard shoots or eliminates player
        guard.state = 'alert';
        state.alertsTriggered++;
        sound.playAlertBuzzer();
        sound.playGunshot();
        triggerDefeat(state, 'SPOTTED: Guard raised security alarm and eliminated operative.');
        return;
      }
    } else {
      // Player not spotted, decay alert timer
      if (guard.stateTimer > 0) {
        guard.stateTimer = Math.max(0, guard.stateTimer - dt * 1.5);
      }

      // Check Holo-Decoys to investigate
      if (state.decoys.length > 0 && guard.state === 'patrol') {
        const nearestDecoy = state.decoys[0];
        const distToDecoy = Math.sqrt(distSq(guard, nearestDecoy));
        if (distToDecoy < 350) {
          guard.state = 'investigate';
          guard.investigateTarget = { x: nearestDecoy.x, y: nearestDecoy.y };
        }
      }

      // Patrol / Investigate movement
      if (guard.state === 'investigate' && guard.investigateTarget) {
        const dx = guard.investigateTarget.x - guard.x;
        const dy = guard.investigateTarget.y - guard.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 20) {
          guard.state = 'patrol';
          guard.investigateTarget = undefined;
        } else {
          guard.targetRotation = Math.atan2(dy, dx);
          guard.rotation = rotateTowards(guard.rotation, guard.targetRotation, 4 * dt);
          guard.x += (dx / dist) * guard.speed * 0.9;
          guard.y += (dy / dist) * guard.speed * 0.9;
        }
      } else if (guard.state === 'patrol' && guard.patrolPoints.length > 0) {
        const target = guard.patrolPoints[guard.currentPatrolIndex];
        const dx = target.x - guard.x;
        const dy = target.y - guard.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 15) {
          guard.currentPatrolIndex = (guard.currentPatrolIndex + 1) % guard.patrolPoints.length;
        } else {
          guard.targetRotation = Math.atan2(dy, dx);
          guard.rotation = rotateTowards(guard.rotation, guard.targetRotation, 3.5 * dt);
          guard.x += (dx / dist) * guard.speed;
          guard.y += (dy / dist) * guard.speed;
        }
      }
    }
  });

  // 13. Boss AI
  if (state.boss && state.boss.state !== 'dead') {
    const boss = state.boss;
    boss.attackCooldown -= dt;

    // Boss patrol movement
    const target = boss.patrolPoints[boss.currentPatrolIndex];
    const dx = target.x - boss.x;
    const dy = target.y - boss.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 20) {
      boss.currentPatrolIndex = (boss.currentPatrolIndex + 1) % boss.patrolPoints.length;
    } else {
      boss.targetRotation = Math.atan2(dy, dx);
      boss.rotation = rotateTowards(boss.rotation, boss.targetRotation, 2.0 * dt);
      boss.x += (dx / dist) * boss.speed;
      boss.y += (dy / dist) * boss.speed;
    }

    // Boss attack patterns & mortar zones
    if (boss.attackCooldown <= 0) {
      boss.attackCooldown = 4.0;
      // Spawn hazard warning circle near player
      boss.warningAreas.push({
        x: state.player.x + (Math.random() - 0.5) * 40,
        y: state.player.y + (Math.random() - 0.5) * 40,
        radius: 70,
        timer: 1.8,
        maxTimer: 1.8,
      });
      sound.playBossAlarm();
    }

    // Update warning hazard zones
    for (let i = boss.warningAreas.length - 1; i >= 0; i--) {
      const hazard = boss.warningAreas[i];
      hazard.timer -= dt;
      if (hazard.timer <= 0) {
        // Mortar explosion!
        sound.playEmp();
        spawnExplosionParticles(state, hazard.x, hazard.y, hazard.radius);
        const pDist = Math.sqrt(distSq(state.player, hazard));
        if (pDist <= hazard.radius && !state.player.isCamo) {
          triggerDefeat(state, 'TERMINATED: Struck by Cyber-Colossus orbital mortar salvo.');
        }
        boss.warningAreas.splice(i, 1);
      }
    }

    // Boss vision detection
    if (!state.player.isCamo) {
      const bDist = Math.sqrt(distSq(boss, state.player));
      if (bDist <= boss.viewDistance) {
        const angle = Math.atan2(state.player.y - boss.y, state.player.x - boss.x);
        const diff = Math.abs(normalizeAngle(angle - boss.rotation));
        if (diff <= boss.fov / 2 && hasLineOfSight(boss, state.player, state.walls)) {
          triggerDefeat(state, 'INCINERATED: Caught in Cyber-Colossus primary thermal beam.');
        }
      }
    }
  }

  // 14. Update Particles
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= dt;
    p.alpha = Math.max(0, p.life / p.maxLife);
    if (p.life <= 0) {
      state.particles.splice(i, 1);
    }
  }

  // 15. Update Floating Texts
  for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
    const ft = state.floatingTexts[i];
    ft.y -= dt * 25;
    ft.life -= dt;
    ft.alpha = Math.max(0, ft.life / 1.5);
    if (ft.life <= 0) {
      state.floatingTexts.splice(i, 1);
    }
  }
}

export function selectGadget(state: GameEngineState, type: GadgetType) {
  state.selectedGadget = type;
  sound.playUiClick();
}

// Gadget Execution
export function useGadget(state: GameEngineState, type: GadgetType, stats?: PlayerStats) {
  // If remote mine is already armed on the floor, detonating it doesn't require another charge!
  if (type === 'mine' && state.mines.length > 0) {
    sound.playExplosion();
    triggerHaptic([60, 40, 80]);

    let killsFromBlast = 0;
    const currentStats = stats || ({ equippedSkin: 'default', perks: { speedLevel: 1, reachLevel: 1, stealthLevel: 1, gadgetLevel: 1 } } as unknown as PlayerStats);
    const skin = SKINS.find((s) => s.id === currentStats.equippedSkin) || SKINS[0];
    const creditMultiplier = skin.id === 'gold' ? 1.5 : 1.0;

    state.mines.forEach((mine) => {
      spawnExplosionParticles(state, mine.x, mine.y, mine.radius);

      // Check all enemies in blast radius
      const allEnemies: Guard[] = [...state.guards];
      if (state.boss && state.boss.state !== 'dead') allEnemies.push(state.boss);

      allEnemies.forEach((enemy) => {
        if (enemy.state === 'dead') return;
        const d = Math.sqrt(distSq(enemy, mine));
        if (d <= mine.radius) {
          if (enemy.type === 'boss') {
            const boss = state.boss!;
            if (boss.shieldActive) {
              boss.shieldActive = false;
              state.floatingTexts.push({
                id: `mine-boss-shield-${Date.now()}`,
                x: boss.x,
                y: boss.y - 40,
                text: 'SHIELD OVERLOADED BY MINE BLAST!',
                color: '#00f0ff',
                alpha: 1.0,
                life: 2.0,
              });
            } else {
              boss.health--;
              if (boss.health <= 0) {
                boss.state = 'dead';
                state.kills++;
                sound.playBossAlarm();
              }
            }
          } else {
            enemy.state = 'dead';
            state.kills++;
            killsFromBlast++;
            state.combo++;
            state.comboTimer = 4.0;
            state.player.adrenalineTimer = 1.4;
            const earned = Math.round(70 * (state.combo > 1 ? 1 + state.combo * 0.25 : 1) * creditMultiplier);
            state.creditsEarned += earned;
          }
        }
      });

      // Temporarily disrupt lasers in blast
      state.lasers.forEach((laser) => {
        const d1 = Math.sqrt(distSq({ x: laser.x1, y: laser.y1 }, mine));
        const d2 = Math.sqrt(distSq({ x: laser.x2, y: laser.y2 }, mine));
        if (d1 < mine.radius || d2 < mine.radius) {
          laser.active = false;
          laser.timer = laser.cycleTime - 4.0;
        }
      });
    });

    state.mines = [];
    state.floatingTexts.push({
      id: `mine-blast-${Date.now()}`,
      x: state.player.x,
      y: state.player.y - 35,
      text: killsFromBlast > 0 ? `REMOTE DETONATION: ${killsFromBlast} PURGED!` : 'REMOTE MINE DETONATED',
      color: '#f43f5e',
      alpha: 1.0,
      life: 1.8,
    });

    if (stats) {
      checkVictory(state, stats);
    }
    return true;
  }

  const gadget = state.gadgets[type];
  if (!gadget || gadget.charges <= 0 || gadget.currentCooldown > 0 || state.isGameOver || state.isVictory) {
    return false;
  }

  gadget.charges--;
  gadget.currentCooldown = gadget.cooldown;

  if (type === 'smoke') {
    sound.playSmoke();
    triggerHaptic([30, 20]);
    state.smokeClouds.push({
      x: state.player.x,
      y: state.player.y,
      radius: 20,
      maxRadius: 135,
      duration: 6.5,
      remaining: 6.5,
    });
    state.floatingTexts.push({
      id: `smoke-${Date.now()}`,
      x: state.player.x,
      y: state.player.y - 30,
      text: 'NANITE SMOKE DEPLOYED (BLINDING GUARDS)',
      color: '#cbd5e1',
      alpha: 1.0,
      life: 1.5,
    });
    return true;
  }

  if (type === 'mine') {
    sound.playMinePlant();
    triggerHaptic([30, 25]);
    state.mines.push({
      id: `mine-${Date.now()}`,
      x: state.player.x,
      y: state.player.y,
      radius: 140,
      armed: true,
      pulseTimer: 0,
    });
    state.floatingTexts.push({
      id: `mine-arm-${Date.now()}`,
      x: state.player.x,
      y: state.player.y - 30,
      text: 'REMOTE MINE ARMED (PRESS DETONATE)',
      color: '#fbbf24',
      alpha: 1.0,
      life: 1.8,
    });
    return true;
  }

  if (type === 'emp') {
    sound.playEmp();
    triggerHaptic([60, 40, 60]);
    // Stun all guards within 320px
    state.guards.forEach((g) => {
      if (g.state !== 'dead') {
        const d = Math.sqrt(distSq(state.player, g));
        if (d < 320) {
          g.state = 'stunned';
          g.stunTimer = 4.5;
        }
      }
    });

    // Disable all lasers for 5 seconds
    state.lasers.forEach((l) => {
      l.active = false;
      l.timer = l.cycleTime - 5.0;
    });

    // EMP Shockwave particles
    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2;
      state.particles.push({
        x: state.player.x,
        y: state.player.y,
        vx: Math.cos(angle) * 8,
        vy: Math.sin(angle) * 8,
        color: '#38bdf8',
        size: 3.5,
        alpha: 1.0,
        life: 0.5,
        maxLife: 0.5,
        type: 'emp',
      });
    }

    state.floatingTexts.push({
      id: `emp-${Date.now()}`,
      x: state.player.x,
      y: state.player.y - 30,
      text: 'EMP SHOCKWAVE DISCHARGED',
      color: '#38bdf8',
      alpha: 1.0,
      life: 1.5,
    });
    return true;
  }

  if (type === 'camo') {
    sound.playCamo();
    triggerHaptic([40]);
    state.player.isCamo = true;
    state.player.camoTimer = 3.8;
    state.floatingTexts.push({
      id: `camo-${Date.now()}`,
      x: state.player.x,
      y: state.player.y - 30,
      text: 'OPTICAL CAMO ONLINE (3.8s)',
      color: '#a855f7',
      alpha: 1.0,
      life: 1.5,
    });
    return true;
  }

  return false;
}

// Helpers
function triggerDefeat(state: GameEngineState, reason: string) {
  state.isGameOver = true;
  state.gameStatusText = reason;
  triggerHaptic([100, 50, 100]);
}

function checkVictory(state: GameEngineState, stats: PlayerStats) {
  const allDead = state.guards.every((g) => g.state === 'dead') && (!state.boss || state.boss.state === 'dead');
  if (allDead) {
    state.isVictory = true;
    state.gameStatusText = 'FACILITY CLEARED — SECTOR COMPLETED';
    sound.playCoin();
    triggerHaptic([40, 60, 80]);
  }
}

function spawnAssassinationParticles(state: GameEngineState, x: number, y: number) {
  for (let i = 0; i < 28; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: Math.random() > 0.4 ? '#ff0055' : '#00f0ff',
      size: 3 + Math.random() * 4,
      alpha: 1.0,
      life: 0.4 + Math.random() * 0.3,
      maxLife: 0.7,
      type: 'blood',
    });
  }
}

function spawnVentTeleportParticles(state: GameEngineState, from: Point, to: Point) {
  for (let i = 0; i < 16; i++) {
    state.particles.push({
      x: from.x + (Math.random() - 0.5) * 20,
      y: from.y + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3,
      color: '#10b981',
      size: 3,
      alpha: 1.0,
      life: 0.4,
      maxLife: 0.4,
      type: 'slice',
    });
    state.particles.push({
      x: to.x + (Math.random() - 0.5) * 20,
      y: to.y + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3,
      color: '#10b981',
      size: 3,
      alpha: 1.0,
      life: 0.4,
      maxLife: 0.4,
      type: 'slice',
    });
  }
}

function spawnExplosionParticles(state: GameEngineState, x: number, y: number, radius: number) {
  for (let i = 0; i < 35; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 6;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: Math.random() > 0.5 ? '#f59e0b' : '#ef4444',
      size: 4 + Math.random() * 5,
      alpha: 1.0,
      life: 0.5 + Math.random() * 0.3,
      maxLife: 0.8,
      type: 'spark',
    });
  }
}

function triggerHaptic(pattern: number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignored if device doesn't support
    }
  }
}

function normalizeAngle(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function rotateTowards(current: number, target: number, maxStep: number): number {
  const diff = normalizeAngle(target - current);
  if (Math.abs(diff) <= maxStep) return target;
  return current + Math.sign(diff) * maxStep;
}

function pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (l2 === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * (x2 - x1);
  const projY = y1 + t * (y2 - y1);
  return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
}
