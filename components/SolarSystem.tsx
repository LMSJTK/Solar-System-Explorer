import React, { useRef, useEffect, useCallback } from 'react';
import { Joystick } from './Joystick';
import { SolarHud } from './huds/SolarHud';
import { ArcadeHud } from './huds/ArcadeHud';
import { OrbitHud } from './huds/OrbitHud';
import { RaidenHud } from './huds/RaidenHud';
import { INITIAL_BODIES, MAX_SPEED, SHIP_ACCELERATION, SHIP_FRICTION } from '../constants';
import { CelestialBody, ShipState, Vector2D, Star, Asteroid, OrbitSimState } from '../types';
import { getPlanetDescription, chatWithShipComputer } from '../services/geminiService';
import { audioService } from '../services/audioService';
import { useGameState } from '../hooks/useGameState';
import { useArcadeEngine } from '../hooks/useArcadeEngine';
import { useRaidenEngine } from '../hooks/useRaidenEngine';
import { useShipComputer } from '../hooks/useShipComputer';
import { renderSolarSystem, renderArcadeMode, renderOrbitSimulator, renderRaidenMode } from '../utils/renderFunctions';
import { saveArcadeHighScore, saveRaidenHighScore } from '../utils/localStorage';

export const SolarSystem: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Game State (using custom reducer hook)
  const {
    state,
    setGameMode,
    setAutopilot,
    setClosestBody,
    setAiDescription,
    setAiLoading,
    setFuel,
    setArcadeScore,
    setArcadeGameOver,
    setOrbitParams,
    setOrbitZoom,
    setRaidenScore,
    setRaidenHp,
    setRaidenShield,
    toggleMute,
    resetArcade,
    resetRaiden,
    toggleChat,
    addChatMessage,
    setChatLoading,
  } = useGameState();

  // Game Engine Hooks
  const arcadeEngine = useArcadeEngine();
  const raidenEngine = useRaidenEngine();

  // Ship Computer (AI scanning)
  useShipComputer({
    closestBody: state.closestBody,
    gameMode: state.gameMode,
    onDescriptionChange: setAiDescription,
    onLoadingChange: setAiLoading,
  });

  // --- Game State Refs ---
  const shipRef = useRef<ShipState>({
    position: { x: 800, y: 0 },
    velocity: { x: 0, y: 2 },
    rotation: 0,
    thrusting: false,
    trail: [],
    fuel: 100
  });

  const joystickVectorRef = useRef<Vector2D>({ x: 0, y: 0 });
  const touchMoveTargetRef = useRef<Vector2D | null>(null); // For direct touch control
  const keysRef = useRef<Set<string>>(new Set());
  const bodiesRef = useRef<CelestialBody[]>(JSON.parse(JSON.stringify(INITIAL_BODIES)));
  const autopilotTargetRef = useRef<string | null>(null);
  const starsRef = useRef<Star[]>([]);
  const asteroidsRef = useRef<Asteroid[]>([]);
  const cameraRef = useRef<Vector2D>({ x: 0, y: 0 });
  const cameraShakeRef = useRef(0);
  const fuelSyncFrameRef = useRef(0); // Throttle fuel state updates

  // --- Orbit Sim Refs ---
  const orbitSimRef = useRef<OrbitSimState>({
    satellite: { x: 250, y: 0, vx: 0, vy: 3 },
    trail: [],
    status: 'ready'
  });

  // Initialize Stars & Solar System Asteroids
  useEffect(() => {
    // Stars
    const stars: Star[] = [];
    for (let i = 0; i < 1000; i++) {
      stars.push({
        x: (Math.random() - 0.5) * 6000,
        y: (Math.random() - 0.5) * 6000,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random()
      });
    }
    starsRef.current = stars;

    // Solar System Asteroid Belt
    const asteroids: Asteroid[] = [];
    const beltInner = 480;
    const beltOuter = 600;
    for (let i = 0; i < 300; i++) {
      const orbitRadius = beltInner + Math.random() * (beltOuter - beltInner);
      const angle = Math.random() * Math.PI * 2;
      const numPoints = 5 + Math.floor(Math.random() * 5);
      const shape: number[] = [];
      for(let p=0; p<numPoints; p++) shape.push(0.7 + Math.random() * 0.6);

      asteroids.push({
        x: Math.cos(angle) * orbitRadius,
        y: Math.sin(angle) * orbitRadius,
        orbitRadius,
        orbitSpeed: 0.003 + Math.random() * 0.004,
        angle,
        size: 1.5 + Math.random() * 3,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        shape
      });
    }
    asteroidsRef.current = asteroids;
  }, []);

  const handleInteraction = () => {
    audioService.init();
  };

  // Input Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'f', 'enter'].includes(key)) {
        keysRef.current.add(key);
        handleInteraction();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleDeepScan = async () => {
    if (!state.closestBody) return;
    handleInteraction();
    setAiLoading(true);
    const desc = await getPlanetDescription(state.closestBody, true);
    setAiDescription(desc);
    setAiLoading(false);
  };

  const handleSendChatMessage = useCallback(async (message: string) => {
    handleInteraction();

    // Add user message
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      content: message,
      timestamp: Date.now(),
      planet: state.closestBody || undefined
    };
    addChatMessage(userMessage);

    // Get AI response
    setChatLoading(true);
    const conversationHistory = state.chatMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const response = await chatWithShipComputer(message, state.closestBody, conversationHistory);

    const assistantMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant' as const,
      content: response,
      timestamp: Date.now(),
      planet: state.closestBody || undefined
    };
    addChatMessage(assistantMessage);
    setChatLoading(false);
  }, [state.closestBody, state.chatMessages, addChatMessage, setChatLoading]);

  // --- Minigame Helpers: Arcade ---
  const startArcadeMinigame = useCallback(() => {
    setGameMode('arcade');
    resetArcade();
    setAutopilot(false);

    shipRef.current.position = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    shipRef.current.velocity = { x: 0, y: 0 };
    shipRef.current.rotation = -Math.PI / 2;

    arcadeEngine.reset();
    arcadeEngine.spawnAsteroids(5, window.innerWidth, window.innerHeight);
  }, [setGameMode, resetArcade, setAutopilot, arcadeEngine]);

  const handleArcadeExit = useCallback(() => {
    saveArcadeHighScore(state.arcadeScore);
    setGameMode('solar');
  }, [setGameMode, state.arcadeScore]);

  // --- Minigame Helpers: Orbit Sim ---
  const startOrbitSim = useCallback(() => {
    setGameMode('orbit');
    setAutopilot(false);
    resetOrbitSim();
  }, [setGameMode, setAutopilot]);

  const resetOrbitSim = useCallback(() => {
    orbitSimRef.current = {
      satellite: { x: state.orbitParams.distance, y: 0, vx: 0, vy: state.orbitParams.speed },
      trail: [],
      status: 'ready'
    };
  }, [state.orbitParams]);

  const launchOrbitSim = useCallback(() => {
    if (orbitSimRef.current.status !== 'ready') return;

    const rad = (state.orbitParams.angle * Math.PI) / 180;
    const vx = state.orbitParams.speed * Math.sin(rad);
    const vy = state.orbitParams.speed * Math.cos(rad);

    orbitSimRef.current.satellite = {
      x: state.orbitParams.distance,
      y: 0,
      vx: vx,
      vy: vy
    };
    orbitSimRef.current.status = 'running';
    audioService.playLaser();
  }, [state.orbitParams]);

  const applyPreset = useCallback((type: 'circular' | 'elliptical' | 'escape' | 'crash') => {
    const EARTH_MASS = 1800;
    let d = 250;
    let s = 0;
    let a = 0;

    switch(type) {
      case 'circular':
        d = 250;
        s = Math.sqrt(EARTH_MASS / d);
        a = 0;
        break;
      case 'elliptical':
        d = 200;
        s = Math.sqrt(EARTH_MASS / d) * 1.15;
        a = 0;
        break;
      case 'escape':
        d = 200;
        s = Math.sqrt((2 * EARTH_MASS) / d) + 0.5;
        a = 0;
        break;
      case 'crash':
        d = 300;
        s = 1.0;
        a = -45;
        break;
    }

    setOrbitParams({ distance: d, speed: Number(s.toFixed(2)), angle: a });
    orbitSimRef.current.status = 'ready';
    orbitSimRef.current.satellite.x = d;
    orbitSimRef.current.trail = [];
  }, [setOrbitParams]);

  // --- Minigame Helpers: Raiden (Mars) ---
  const startRaiden = useCallback(() => {
    setGameMode('raiden');
    setAutopilot(false);
    resetRaiden();

    const width = window.innerWidth;
    const height = window.innerHeight;
    raidenEngine.reset(width, height);
  }, [setGameMode, setAutopilot, resetRaiden, raidenEngine]);

  const handleRaidenExit = useCallback(() => {
    saveRaidenHighScore(state.raidenScore);
    setGameMode('solar');
  }, [setGameMode, state.raidenScore]);

  // --- Main Game Loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const loop = () => {
      // Use canvas client dimensions instead of window dimensions for proper mobile sizing
      const width = canvas.width = canvas.clientWidth;
      const height = canvas.height = canvas.clientHeight;

      const keys = keysRef.current;
      const joystick = joystickVectorRef.current;

      // -- Input Handling --
      let inputX = joystick.x;
      let inputY = joystick.y;

      // Touch-based directional control (ship moves toward touch point)
      if (touchMoveTargetRef.current && (state.gameMode === 'solar' || state.gameMode === 'arcade')) {
        const dx = touchMoveTargetRef.current.x - shipRef.current.position.x;
        const dy = touchMoveTargetRef.current.y - shipRef.current.position.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        // Only apply input if touch is far enough from ship
        if (dist > 30) {
          inputX = dx / dist;
          inputY = dy / dist;
        }
      }

      // Keyboard input
      if (keys.has('w') || keys.has('arrowup')) inputY -= 1;
      if (keys.has('s') || keys.has('arrowdown')) inputY += 1;
      if (keys.has('a') || keys.has('arrowleft')) inputX -= 1;
      if (keys.has('d') || keys.has('arrowright')) inputX += 1;

      const inputMag = Math.sqrt(inputX*inputX + inputY*inputY);
      if (inputMag > 1) { inputX /= inputMag; inputY /= inputMag; }

      // Manual Ship Control (Solar & Arcade)
      if (state.gameMode === 'solar' || state.gameMode === 'arcade') {
        if (inputX !== 0 || inputY !== 0) {
          if (state.gameMode === 'solar' && state.autopilotActive) {
            setAutopilot(false);
            autopilotTargetRef.current = null;
          }

          const inputAngle = Math.atan2(inputY, inputX);
          let diff = inputAngle - shipRef.current.rotation;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          shipRef.current.rotation += diff * 0.15;

          // Only thrust if we have fuel (in solar mode) or in arcade mode
          const canThrust = state.gameMode === 'arcade' || shipRef.current.fuel > 0;
          if (canThrust) {
            const acc = SHIP_ACCELERATION;
            shipRef.current.velocity.x += Math.cos(shipRef.current.rotation) * inputMag * acc;
            shipRef.current.velocity.y += Math.sin(shipRef.current.rotation) * inputMag * acc;
            shipRef.current.thrusting = true;

            // Consume fuel in solar mode
            if (state.gameMode === 'solar') {
              shipRef.current.fuel = Math.max(0, shipRef.current.fuel - 0.1 * inputMag);
            }

            audioService.setThrust(inputMag);
          } else {
            shipRef.current.thrusting = false;
            audioService.setThrust(0);
          }
        } else if (state.gameMode === 'solar' && state.autopilotActive && autopilotTargetRef.current) {
          // Solar Autopilot Logic
          const targetBody = bodiesRef.current.find(b => b.name === autopilotTargetRef.current);
          if (targetBody) {
            const targetX = Math.cos(targetBody.angle) * targetBody.orbitRadius;
            const targetY = Math.sin(targetBody.angle) * targetBody.orbitRadius;
            const targetVx = -Math.sin(targetBody.angle) * targetBody.orbitRadius * targetBody.orbitSpeed;
            const targetVy = Math.cos(targetBody.angle) * targetBody.orbitRadius * targetBody.orbitSpeed;

            const dx = targetX - shipRef.current.position.x;
            const dy = targetY - shipRef.current.position.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const targetAngle = Math.atan2(dy, dx);

            let diff = targetAngle - shipRef.current.rotation;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            shipRef.current.rotation += diff * 0.1;

            if (dist > targetBody.radius + 150) {
              if (shipRef.current.fuel > 0) {
                shipRef.current.velocity.x += Math.cos(shipRef.current.rotation) * SHIP_ACCELERATION * 0.8;
                shipRef.current.velocity.y += Math.sin(shipRef.current.rotation) * SHIP_ACCELERATION * 0.8;
                shipRef.current.thrusting = true;
                shipRef.current.fuel = Math.max(0, shipRef.current.fuel - 0.08);
                audioService.setThrust(0.5);
              } else {
                shipRef.current.thrusting = false;
                audioService.setThrust(0);
              }
            } else {
              const idealVx = (targetVx + (dx * 0.05));
              const idealVy = (targetVy + (dy * 0.05));
              const ax = (idealVx - shipRef.current.velocity.x) * 0.1;
              const ay = (idealVy - shipRef.current.velocity.y) * 0.1;
              shipRef.current.velocity.x += ax;
              shipRef.current.velocity.y += ay;
              const mag = Math.sqrt(ax*ax + ay*ay);
              const shouldThrust = mag > 0.05 && shipRef.current.fuel > 0;
              shipRef.current.thrusting = shouldThrust;
              if (shouldThrust) {
                shipRef.current.fuel = Math.max(0, shipRef.current.fuel - 0.03 * mag);
              }
              audioService.setThrust(shouldThrust ? Math.min(mag * 5, 0.3) : 0);
            }
          }
        } else {
          shipRef.current.thrusting = false;
          audioService.setThrust(0);
        }
      }

      // Physics Update
      if (state.gameMode === 'arcade') {
        // Arcade Mode Physics
        if (keys.has(' ')) {
          arcadeEngine.fireBullet(shipRef.current.position, shipRef.current.rotation, shipRef.current.velocity, state.arcadeGameOver);
        }

        if (!state.arcadeGameOver) {
          shipRef.current.position.x += shipRef.current.velocity.x;
          shipRef.current.position.y += shipRef.current.velocity.y;

          if (shipRef.current.position.x < 0) shipRef.current.position.x = width;
          if (shipRef.current.position.x > width) shipRef.current.position.x = 0;
          if (shipRef.current.position.y < 0) shipRef.current.position.y = height;
          if (shipRef.current.position.y > height) shipRef.current.position.y = 0;

          shipRef.current.velocity.x *= 0.99;
          shipRef.current.velocity.y *= 0.99;
        }

        const { collision, scoreGain } = arcadeEngine.updatePhysics(width, height, shipRef.current.position, state.arcadeGameOver);
        if (scoreGain > 0) {
          setArcadeScore(state.arcadeScore + scoreGain);
          cameraShakeRef.current = 5; // Small shake on asteroid destroy
        }
        if (collision) {
          setArcadeGameOver(true);
          shipRef.current.thrusting = false;
          cameraShakeRef.current = 15; // Big shake on ship destroy
        }

        if (arcadeEngine.asteroidsRef.current.length === 0 && !state.arcadeGameOver) {
          arcadeEngine.spawnAsteroids(5 + Math.floor(state.arcadeScore / 1000), width, height);
        }

      } else if (state.gameMode === 'orbit') {
        // Orbit Simulator Physics
        const sim = orbitSimRef.current;

        if (sim.status === 'ready') {
          sim.satellite.x = state.orbitParams.distance;
          sim.satellite.y = 0;
          sim.satellite.vx = 0;
          sim.satellite.vy = 0;
        } else if (sim.status === 'running') {
          const earthMass = 1800;
          const rSq = sim.satellite.x**2 + sim.satellite.y**2;
          const r = Math.sqrt(rSq);

          if (r < 45) {
            sim.status = 'crashed';
            audioService.playExplosion();
          } else if (r > 5000) {
            sim.status = 'escaped';
          } else {
            const force = earthMass / rSq;
            const ax = -force * (sim.satellite.x / r);
            const ay = -force * (sim.satellite.y / r);

            sim.satellite.vx += ax;
            sim.satellite.vy += ay;
            sim.satellite.x += sim.satellite.vx;
            sim.satellite.y += sim.satellite.vy;

            if (sim.trail.length > 500) sim.trail.shift();
            if (Math.random() > 0.1) sim.trail.push({x: sim.satellite.x, y: sim.satellite.y});
          }
        }

      } else if (state.gameMode === 'raiden') {
        // --- RAIDEN (MARS) PHYSICS ---
        const shouldShoot = keys.has(' ') || keys.has('f') || keys.has('enter') || inputMag > 0.1;
        const result = raidenEngine.updatePhysics(width, height, inputX, inputY, inputMag, shouldShoot);

        setRaidenScore(result.score);
        setRaidenHp(result.hp);
        setRaidenShield(result.shield);

      } else {
        // --- Solar Mode Physics ---
        bodiesRef.current.forEach(body => {
          if (body.orbitSpeed > 0) body.angle += body.orbitSpeed;
        });
        asteroidsRef.current.forEach(roid => {
          roid.angle += roid.orbitSpeed;
          roid.rotation += roid.rotationSpeed;
          roid.x = Math.cos(roid.angle) * roid.orbitRadius;
          roid.y = Math.sin(roid.angle) * roid.orbitRadius;
        });

        shipRef.current.velocity.x *= SHIP_FRICTION;
        shipRef.current.velocity.y *= SHIP_FRICTION;
        const speed = Math.sqrt(shipRef.current.velocity.x**2 + shipRef.current.velocity.y**2);
        if (speed > MAX_SPEED * 1.5) {
          const ratio = (MAX_SPEED * 1.5) / speed;
          shipRef.current.velocity.x *= ratio;
          shipRef.current.velocity.y *= ratio;
        }
        shipRef.current.position.x += shipRef.current.velocity.x;
        shipRef.current.position.y += shipRef.current.velocity.y;

        // Update ship trail
        if (!shipRef.current.trail) shipRef.current.trail = [];
        if (shipRef.current.trail.length > 100) shipRef.current.trail.shift();
        if (speed > 0.5) { // Only add trail when moving
          shipRef.current.trail.push({ x: shipRef.current.position.x, y: shipRef.current.position.y });
        }

        // Fuel recharge mechanics
        // 1. Constant base recharge (solar panels always collect ambient light)
        let rechargeRate = 0.02; // Slow constant recharge

        // 2. Enhanced solar recharge when near the Sun
        const distToSun = Math.sqrt(shipRef.current.position.x**2 + shipRef.current.position.y**2);
        if (distToSun < 200) { // Within 200 units of the Sun
          // Recharge rate increases the closer you are (up to 0.5 per frame when very close)
          rechargeRate = Math.max(0.1, (200 - distToSun) / 400);
        }

        shipRef.current.fuel = Math.min(100, shipRef.current.fuel + rechargeRate);

        cameraRef.current.x += (shipRef.current.position.x - cameraRef.current.x) * 0.1;
        cameraRef.current.y += (shipRef.current.position.y - cameraRef.current.y) * 0.1;

        let nearest = null;
        let minDist = 300;
        bodiesRef.current.forEach(body => {
          const bx = Math.cos(body.angle) * body.orbitRadius;
          const by = Math.sin(body.angle) * body.orbitRadius;
          const dist = Math.sqrt((bx - shipRef.current.position.x)**2 + (by - shipRef.current.position.y)**2);
          if (dist < minDist + body.radius) {
            nearest = body.name;
            minDist = dist;
          }
        });
        if (nearest !== state.closestBody) setClosestBody(nearest);

        // Sync fuel to state for UI updates (throttled to every 5 frames = ~12 updates/sec)
        fuelSyncFrameRef.current++;
        if (fuelSyncFrameRef.current >= 5) {
          fuelSyncFrameRef.current = 0;
          setFuel(shipRef.current.fuel);
        }
      }

      // 2. Render
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, width, height);
      ctx.save();

      if (state.gameMode === 'orbit') {
        renderOrbitSimulator(ctx, width, height, state.orbitZoom, orbitSimRef.current, state.orbitParams);
      } else if (state.gameMode === 'raiden') {
        renderRaidenMode(ctx, width, height, raidenEngine.stateRef.current);
      } else if (state.gameMode === 'arcade') {
        renderArcadeMode(ctx, shipRef.current, arcadeEngine.bulletsRef.current, arcadeEngine.asteroidsRef.current, state.arcadeGameOver);
      } else {
        renderSolarSystem(ctx, width, height, cameraRef.current, starsRef.current, bodiesRef.current, asteroidsRef.current, shipRef.current, state.autopilotActive, autopilotTargetRef.current, cameraShakeRef.current);
      }

      // Decay camera shake
      if (cameraShakeRef.current > 0.1) {
        cameraShakeRef.current *= 0.9;
      } else {
        cameraShakeRef.current = 0;
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [state, arcadeEngine, raidenEngine, setArcadeScore, setArcadeGameOver, setRaidenScore, setRaidenHp, setRaidenShield, setClosestBody, setAutopilot, setFuel]);

  const engageAutopilot = useCallback((target: string) => {
    handleInteraction();
    autopilotTargetRef.current = target;
    setAutopilot(true, target);
  }, [setAutopilot]);

  const toggleMuteHandler = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleInteraction();
    const muted = audioService.toggleMute();
    toggleMute();
  };

  // Canvas touch handlers for direct ship control
  const handleCanvasPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    handleInteraction();
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    // Convert to world coordinates
    const worldX = canvasX - rect.width / 2 + cameraRef.current.x;
    const worldY = canvasY - rect.height / 2 + cameraRef.current.y;

    touchMoveTargetRef.current = { x: worldX, y: worldY };
  }, []);

  const handleCanvasPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!touchMoveTargetRef.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    // Convert to world coordinates
    const worldX = canvasX - rect.width / 2 + cameraRef.current.x;
    const worldY = canvasY - rect.height / 2 + cameraRef.current.y;

    touchMoveTargetRef.current = { x: worldX, y: worldY };
  }, []);

  const handleCanvasPointerUp = useCallback(() => {
    touchMoveTargetRef.current = null;
  }, []);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden" onPointerDown={handleInteraction}>
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerCancel={handleCanvasPointerUp}
      />

      {/* --- SOLAR MODE HUD --- */}
      {state.gameMode === 'solar' && (
        <SolarHud
          shipRef={shipRef}
          autopilotActive={state.autopilotActive}
          autopilotTarget={state.autopilotTarget}
          closestBody={state.closestBody}
          aiDescription={state.aiDescription}
          isAiLoading={state.isAiLoading}
          isMuted={state.isMuted}
          fuel={state.fuel}
          chatOpen={state.chatOpen}
          chatMessages={state.chatMessages}
          chatLoading={state.chatLoading}
          onToggleMute={toggleMuteHandler}
          onEngageAutopilot={engageAutopilot}
          onStartArcade={startArcadeMinigame}
          onStartOrbitSim={startOrbitSim}
          onStartRaiden={startRaiden}
          onDeepScan={handleDeepScan}
          onToggleChat={toggleChat}
          onSendChatMessage={handleSendChatMessage}
        />
      )}

      {/* --- ARCADE MODE HUD --- */}
      {state.gameMode === 'arcade' && (
        <ArcadeHud
          score={state.arcadeScore}
          gameOver={state.arcadeGameOver}
          onExit={handleArcadeExit}
          onRestart={startArcadeMinigame}
          onFireBullet={() => arcadeEngine.fireBullet(shipRef.current.position, shipRef.current.rotation, shipRef.current.velocity, state.arcadeGameOver)}
        />
      )}

      {/* --- ORBIT SIM HUD --- */}
      {state.gameMode === 'orbit' && (
        <OrbitHud
          orbitSimRef={orbitSimRef}
          orbitParams={state.orbitParams}
          orbitZoom={state.orbitZoom}
          onExit={() => setGameMode('solar')}
          onSetOrbitParams={setOrbitParams}
          onSetOrbitZoom={setOrbitZoom}
          onLaunch={launchOrbitSim}
          onReset={resetOrbitSim}
          onApplyPreset={applyPreset}
        />
      )}

      {/* --- RAIDEN MODE HUD --- */}
      {state.gameMode === 'raiden' && (
        <RaidenHud
          raidenRef={raidenEngine.stateRef}
          score={state.raidenScore}
          hp={state.raidenHp}
          shield={state.raidenShield}
          onExit={handleRaidenExit}
          onRestart={startRaiden}
        />
      )}

      {/* Shared Controls (Joystick) - Hidden on mobile, use direct touch instead */}
      {state.gameMode !== 'orbit' && (
        <div className="absolute left-8 pointer-events-auto hidden md:block" style={{ bottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))' }}>
          <Joystick
            onStart={handleInteraction}
            onMove={(vec) => { joystickVectorRef.current = vec; }}
          />
        </div>
      )}
    </div>
  );
};
