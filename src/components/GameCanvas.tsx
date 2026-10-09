import React, { useEffect, useRef } from 'react';
import { GameEngineState } from '../game/engine';
import { BossEntity, PlayerStats, Point, Wall } from '../types/game';
import { SKINS, BLADE_TRAILS } from '../game/shopData';

interface GameCanvasProps {
  engineState: GameEngineState;
  stats: PlayerStats;
  onTapMove?: (point: Point | null) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ engineState, stats, onTapMove }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tapTargetRef = useRef<Point | null>(null);

  // Compute vision polygon for guards against walls
  const computeVisionPolygon = (
    gx: number,
    gy: number,
    viewDist: number,
    fov: number,
    rotation: number,
    walls: Wall[]
  ): Point[] => {
    const points: Point[] = [{ x: gx, y: gy }];
    const rayCount = 32;
    const startAngle = rotation - fov / 2;
    const step = fov / rayCount;

    for (let i = 0; i <= rayCount; i++) {
      const angle = startAngle + i * step;
      const rx = gx + Math.cos(angle) * viewDist;
      const ry = gy + Math.sin(angle) * viewDist;

      let closestDist = viewDist;
      let hitX = rx;
      let hitY = ry;

      // Find intersection against walls
      for (const wall of walls) {
        const segments = [
          { x1: wall.x, y1: wall.y, x2: wall.x + wall.w, y2: wall.y },
          { x1: wall.x + wall.w, y1: wall.y, x2: wall.x + wall.w, y2: wall.y + wall.h },
          { x1: wall.x + wall.w, y1: wall.y + wall.h, x2: wall.x, y2: wall.y + wall.h },
          { x1: wall.x, y1: wall.y + wall.h, x2: wall.x, y2: wall.y },
        ];

        for (const seg of segments) {
          const denom = (seg.y2 - seg.y1) * (rx - gx) - (seg.x2 - seg.x1) * (ry - gy);
          if (denom === 0) continue;
          const ua = ((seg.x2 - seg.x1) * (gy - seg.y1) - (seg.y2 - seg.y1) * (gx - seg.x1)) / denom;
          const ub = ((rx - gx) * (gy - seg.y1) - (ry - gy) * (gx - seg.x1)) / denom;

          if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
            const ix = gx + ua * (rx - gx);
            const iy = gy + ua * (ry - gy);
            const d = Math.sqrt((ix - gx) ** 2 + (iy - gy) ** 2);
            if (d < closestDist) {
              closestDist = d;
              hitX = ix;
              hitY = iy;
            }
          }
        }
      }

      points.push({ x: hitX, y: hitY });
    }

    return points;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const container = containerRef.current;
      if (!container) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = container.clientWidth;
      const height = container.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Camera follow player
      const p = engineState.player;
      const cameraX = width / 2 - p.x;
      const cameraY = height / 2 - p.y;

      ctx.translate(cameraX, cameraY);

      // Clear dark background
      ctx.fillStyle = '#060913';
      ctx.fillRect(-cameraX, -cameraY, width, height);

      // 1. Cyber Grid Floor
      const gridSize = 40;
      const startX = Math.floor((-cameraX) / gridSize) * gridSize;
      const endX = startX + width + gridSize;
      const startY = Math.floor((-cameraY) / gridSize) * gridSize;
      const endY = startY + height + gridSize;

      ctx.strokeStyle = 'rgba(14, 165, 233, 0.04)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = startX; x <= endX; x += gridSize) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
      }
      for (let y = startY; y <= endY; y += gridSize) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
      }
      ctx.stroke();

      // 2. Hidden Vents
      engineState.vents.forEach((vent) => {
        // Draw route line
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(vent.entrance.x, vent.entrance.y);
        ctx.lineTo(vent.exit.x, vent.exit.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Entrance & Exit Grates
        [vent.entrance, vent.exit].forEach((pt) => {
          ctx.fillStyle = '#022c22';
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, vent.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Grate slats
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(pt.x - 12, pt.y - 8);
          ctx.lineTo(pt.x + 12, pt.y - 8);
          ctx.moveTo(pt.x - 14, pt.y);
          ctx.lineTo(pt.x + 14, pt.y);
          ctx.moveTo(pt.x - 12, pt.y + 8);
          ctx.lineTo(pt.x + 12, pt.y + 8);
          ctx.stroke();
        });
      });

      // 3. Terminals
      engineState.terminals.forEach((term) => {
        const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.1;
        ctx.save();
        ctx.translate(term.x, term.y);

        // Terminal Base
        ctx.fillStyle = term.hacked ? '#064e3b' : '#1e1b4b';
        ctx.strokeStyle = term.hacked ? '#10b981' : '#6366f1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, term.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Pulsing Ring
        ctx.strokeStyle = term.hacked ? 'rgba(16, 185, 129, 0.4)' : 'rgba(99, 102, 241, 0.4)';
        ctx.beginPath();
        ctx.arc(0, 0, term.radius * pulse, 0, Math.PI * 2);
        ctx.stroke();

        // Terminal Core Icon
        ctx.fillStyle = term.hacked ? '#34d399' : '#818cf8';
        ctx.fillRect(-6, -6, 12, 12);

        // Hack progress ring
        if (engineState.interactingTerminal?.id === term.id) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, 0, term.radius + 6, -Math.PI / 2, -Math.PI / 2 + engineState.terminalHackProgress * Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      });

      // 4. Laser Traps
      engineState.lasers.forEach((laser) => {
        ctx.save();
        // Emitter endpoints
        ctx.fillStyle = laser.active ? '#ef4444' : '#334155';
        ctx.beginPath();
        ctx.arc(laser.x1, laser.y1, 6, 0, Math.PI * 2);
        ctx.arc(laser.x2, laser.y2, 6, 0, Math.PI * 2);
        ctx.fill();

        if (laser.active) {
          // Glow Outer Beam
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
          ctx.lineWidth = 10;
          ctx.beginPath();
          ctx.moveTo(laser.x1, laser.y1);
          ctx.lineTo(laser.x2, laser.y2);
          ctx.stroke();

          // Intense Core Beam
          ctx.strokeStyle = '#f87171';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(laser.x1, laser.y1);
          ctx.lineTo(laser.x2, laser.y2);
          ctx.stroke();

          // White Hot Center
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(laser.x1, laser.y1);
          ctx.lineTo(laser.x2, laser.y2);
          ctx.stroke();
        } else {
          // Inactive wire guide
          ctx.strokeStyle = 'rgba(71, 85, 105, 0.3)';
          ctx.setLineDash([4, 4]);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(laser.x1, laser.y1);
          ctx.lineTo(laser.x2, laser.y2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.restore();
      });

      // 5. Walls & Obstacles
      engineState.walls.forEach((wall) => {
        if (wall.type === 'crate') {
          // Tactical Storage Crate
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2;
          ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);

          // Crate cross brace
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(wall.x + 4, wall.y + 4);
          ctx.lineTo(wall.x + wall.w - 4, wall.y + wall.h - 4);
          ctx.moveTo(wall.x + wall.w - 4, wall.y + 4);
          ctx.lineTo(wall.x + 4, wall.y + wall.h - 4);
          ctx.stroke();
        } else {
          // Cyber Wall
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

          // Neon Edge Trim
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
          ctx.lineWidth = 2;
          ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);

          // Corner cyber accents
          ctx.fillStyle = '#0284c7';
          const cs = 4;
          ctx.fillRect(wall.x, wall.y, cs, cs);
          ctx.fillRect(wall.x + wall.w - cs, wall.y, cs, cs);
          ctx.fillRect(wall.x, wall.y + wall.h - cs, cs, cs);
          ctx.fillRect(wall.x + wall.w - cs, wall.y + wall.h - cs, cs, cs);
        }
      });

      // 6. Guards Vision Cones & Bodies
      const allEnemies = [...engineState.guards];
      if (engineState.boss && engineState.boss.state !== 'dead') {
        allEnemies.push(engineState.boss);
      }

      allEnemies.forEach((guard) => {
        if (guard.state === 'dead') return;

        // Vision Cone Rendering
        if (guard.stunTimer && guard.stunTimer > 0) {
          // Stunned: Show ZZZ or electric sparks
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 12px monospace';
          ctx.fillText('⚡ STUNNED ⚡', guard.x - 36, guard.y - 25);
        } else {
          const poly = computeVisionPolygon(
            guard.x,
            guard.y,
            guard.viewDistance,
            guard.fov,
            guard.rotation,
            engineState.walls
          );

          ctx.save();
          const coneGrad = ctx.createRadialGradient(
            guard.x,
            guard.y,
            5,
            guard.x,
            guard.y,
            guard.viewDistance
          );

          if (guard.type === 'sniper') {
            coneGrad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
            coneGrad.addColorStop(1, 'rgba(239, 68, 68, 0.05)');
          } else if (guard.type === 'drone') {
            coneGrad.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
            coneGrad.addColorStop(1, 'rgba(6, 182, 212, 0.04)');
          } else if (guard.type === 'enforcer') {
            coneGrad.addColorStop(0, 'rgba(245, 158, 11, 0.4)');
            coneGrad.addColorStop(1, 'rgba(245, 158, 11, 0.05)');
          } else if (guard.type === 'boss') {
            coneGrad.addColorStop(0, 'rgba(236, 72, 153, 0.5)');
            coneGrad.addColorStop(1, 'rgba(236, 72, 153, 0.08)');
          } else {
            coneGrad.addColorStop(0, 'rgba(251, 191, 36, 0.3)');
            coneGrad.addColorStop(1, 'rgba(251, 191, 36, 0.04)');
          }

          ctx.fillStyle = coneGrad;
          ctx.beginPath();
          ctx.moveTo(poly[0].x, poly[0].y);
          for (let i = 1; i < poly.length; i++) {
            ctx.lineTo(poly[i].x, poly[i].y);
          }
          ctx.closePath();
          ctx.fill();

          // Laser Sight Line for Snipers
          if (guard.type === 'sniper') {
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(guard.x, guard.y);
            const targetPoly = poly[Math.floor(poly.length / 2)];
            ctx.lineTo(targetPoly.x, targetPoly.y);
            ctx.stroke();
          }

          // Drone Omnidirectional Pulse Ring
          if (guard.type === 'drone') {
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(guard.x, guard.y, 65, 0, Math.PI * 2);
            ctx.stroke();
          }

          ctx.restore();
        }

        // Draw Guard Body
        ctx.save();
        ctx.translate(guard.x, guard.y);
        ctx.rotate(guard.rotation);

        if (guard.type === 'boss') {
          // BOSS COLOSSUS BODY
          const boss = guard as BossEntity;
          // Heavy mech chassis
          ctx.fillStyle = '#1e1b4b';
          ctx.strokeStyle = boss.shieldActive ? '#00f0ff' : '#ec4899';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, 0, boss.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Energy Shield Aura
          if (boss.shieldActive) {
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, boss.radius + 8, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Rear Power Core (WEAK POINT)
          ctx.fillStyle = boss.shieldActive ? '#3b82f6' : '#22c55e';
          ctx.beginPath();
          ctx.arc(-boss.radius * 0.75, 0, 10, 0, Math.PI * 2);
          ctx.fill();

          // Front Laser Cannon
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(boss.radius * 0.6, -6, 16, 12);
        } else if (guard.type === 'enforcer') {
          // Heavy Enforcer with Front Riot Shield
          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.arc(0, 0, guard.radius, 0, Math.PI * 2);
          ctx.fill();

          // Front Heavy Shield Arc
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(0, 0, guard.radius + 3, -Math.PI * 0.45, Math.PI * 0.45);
          ctx.stroke();

          // Helmet Visor
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(4, -4, 8, 8);
        } else if (guard.type === 'drone') {
          // Drone Quadcopter body
          ctx.fillStyle = '#0f766e';
          ctx.beginPath();
          ctx.arc(0, 0, guard.radius, 0, Math.PI * 2);
          ctx.fill();

          // Rotors
          ctx.strokeStyle = '#2dd4bf';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-18, -18);
          ctx.lineTo(18, 18);
          ctx.moveTo(-18, 18);
          ctx.lineTo(18, -18);
          ctx.stroke();

          // Sensor eye
          ctx.fillStyle = '#00f0ff';
          ctx.beginPath();
          ctx.arc(6, 0, 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (guard.type === 'sniper') {
          // Sniper Operative
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(0, 0, guard.radius, 0, Math.PI * 2);
          ctx.fill();

          // Long Rifle Barrel
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(8, -2, 18, 4);

          // Red Scope Eye
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(4, 0, 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Standard Scout
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(0, 0, guard.radius, 0, Math.PI * 2);
          ctx.fill();

          // Flashlight mount & Visor
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(6, -3, 8, 6);
        }

        ctx.restore();

        // Alert Exclamation Indicator above head
        if (guard.stateTimer && guard.stateTimer > 0) {
          ctx.save();
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 20px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('!', guard.x, guard.y - guard.radius - 8);
          ctx.restore();
        }
      });

      // 7. Boss Mortar Warning Areas
      if (engineState.boss?.warningAreas) {
        engineState.boss.warningAreas.forEach((w) => {
          ctx.save();
          ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Countdown radius
          const prog = 1 - w.timer / w.maxTimer;
          ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.beginPath();
          ctx.arc(w.x, w.y, w.radius * prog, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      // 8. Decoys and Remote Mines
      engineState.decoys.forEach((decoy) => {
        ctx.save();
        const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.3;
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(decoy.x, decoy.y, 20 * pulse, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.arc(decoy.x, decoy.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Render Remote Mines
      engineState.mines.forEach((mine) => {
        ctx.save();
        // Blast radius indicator
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(mine.x, mine.y, mine.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Mine Body
        ctx.fillStyle = '#1e1b4b';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mine.x, mine.y, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Flashing Detonation LED
        const isBlink = Math.sin(Date.now() * 0.012) > 0;
        ctx.fillStyle = isBlink ? '#ef4444' : '#450a0a';
        ctx.beginPath();
        ctx.arc(mine.x, mine.y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('MINE', mine.x, mine.y - 18);
        ctx.restore();
      });

      // Render Environmental Switches
      (engineState.switches || []).forEach((sw) => {
        ctx.save();
        ctx.translate(sw.x, sw.y);

        // Switch Console Body
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = sw.isOn ? '#ef4444' : '#10b981';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, sw.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Status Indicator Core
        ctx.fillStyle = sw.isOn ? '#ef4444' : '#10b981';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();

        // Label above switch
        ctx.fillStyle = sw.isOn ? '#fca5a5' : '#86efac';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(sw.isOn ? '⚡ LASER ACTIVE' : '✓ LASER OFF', 0, -sw.radius - 8);

        ctx.restore();
      });

      // 9. Smoke Clouds
      engineState.smokeClouds.forEach((smoke) => {
        ctx.save();
        const grad = ctx.createRadialGradient(smoke.x, smoke.y, 0, smoke.x, smoke.y, smoke.radius);
        grad.addColorStop(0, 'rgba(148, 163, 184, 0.85)');
        grad.addColorStop(0.7, 'rgba(100, 116, 139, 0.6)');
        grad.addColorStop(1, 'rgba(71, 85, 105, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(smoke.x, smoke.y, smoke.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 10. Tap-Move Target Ring
      if (tapTargetRef.current) {
        ctx.save();
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(tapTargetRef.current.x, tapTargetRef.current.y, 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 11. Player (The Assassin)
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      const skin = SKINS.find((s) => s.id === stats.equippedSkin) || SKINS[0];

      // Camo shimmer / opacity
      if (p.isCamo) {
        ctx.globalAlpha = 0.35;
      }

      // Melee strike blade reach guide (subtle faint ring)
      const reachPerkMult = 1 + (stats.perks.reachLevel - 1) * 0.12;
      const reachRadius = 54 * (1 + skin.reachBonus) * reachPerkMult;
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, reachRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Assassin Body
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Armor Suit Outline
      ctx.strokeStyle = skin.color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Dual Visor Eyes / Mask
      ctx.fillStyle = skin.accentColor;
      ctx.beginPath();
      ctx.arc(8, -4, 3, 0, Math.PI * 2);
      ctx.arc(8, 4, 3, 0, Math.PI * 2);
      ctx.fill();

      // Cyber Katana / Blade
      ctx.fillStyle = skin.color;
      ctx.fillRect(8, 10, 16, 3);

      ctx.restore();

      // 12. Particles
      engineState.particles.forEach((part) => {
        ctx.save();
        ctx.globalAlpha = part.alpha;
        ctx.fillStyle = part.color;
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 13. Floating Texts (Combo popups, rewards)
      engineState.floatingTexts.forEach((ft) => {
        ctx.save();
        ctx.globalAlpha = ft.alpha;
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 15px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = ft.color;
        ctx.shadowBlur = 8;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [engineState, stats]);

  // Touch & Pointer Tap-to-move handling
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const width = canvas.width / (Math.min(window.devicePixelRatio || 1, 2));
    const height = canvas.height / (Math.min(window.devicePixelRatio || 1, 2));

    const p = engineState.player;
    const cameraX = width / 2 - p.x;
    const cameraY = height / 2 - p.y;

    const worldX = clickX - cameraX;
    const worldY = clickY - cameraY;

    tapTargetRef.current = { x: worldX, y: worldY };
    if (onTapMove) {
      onTapMove({ x: worldX, y: worldY });
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full select-none overflow-hidden touch-none bg-gray-950">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        className="w-full h-full block cursor-crosshair touch-none"
      />
    </div>
  );
};
