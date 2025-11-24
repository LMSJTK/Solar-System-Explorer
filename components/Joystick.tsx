import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Vector2D } from '../types';

interface JoystickProps {
  onMove: (vector: Vector2D) => void;
  onStart?: () => void;
}

export const Joystick: React.FC<JoystickProps> = ({ onMove, onStart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState<Vector2D>({ x: 0, y: 0 });
  const touchId = useRef<number | null>(null);

  const maxRadius = 50; // Maximum distance the stick can move

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    
    if (onStart) onStart();

    setActive(true);
    // Determine relative position immediately
    handleMove(clientX, clientY);
  }, [onStart]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Clamp to max radius
    if (distance > maxRadius) {
      const angle = Math.atan2(dy, dx);
      dx = Math.cos(angle) * maxRadius;
      dy = Math.sin(angle) * maxRadius;
    }

    setPosition({ x: dx, y: dy });

    // Normalize output (-1 to 1)
    onMove({
      x: dx / maxRadius,
      y: dy / maxRadius
    });
  }, [onMove]);

  const handleEnd = useCallback(() => {
    setActive(false);
    setPosition({ x: 0, y: 0 });
    onMove({ x: 0, y: 0 });
    touchId.current = null;
  }, [onMove]);

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (active) {
      handleMove(e.clientX, e.clientY);
    }
  };

  const onMouseUp = () => {
    if (active) handleEnd();
  };

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      touchId.current = touch.identifier;
      handleStart(touch.clientX, touch.clientY);
    }
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!active) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchId.current) {
        handleMove(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
        break;
      }
    }
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (!active) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchId.current) {
        handleEnd();
        break;
      }
    }
  };

  // Global event listeners for drag outside component
  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [active, handleMove, handleEnd]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-32 h-32 rounded-full border-2 border-cyan-500/50 bg-gray-900/50 backdrop-blur-sm touch-none select-none transition-opacity ${active ? 'opacity-100' : 'opacity-60'}`}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      <div 
        ref={stickRef}
        className="absolute top-1/2 left-1/2 w-12 h-12 -mt-6 -ml-6 bg-cyan-500 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.8)]"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: active ? 'none' : 'transform 0.2s ease-out'
        }}
      />
    </div>
  );
};
