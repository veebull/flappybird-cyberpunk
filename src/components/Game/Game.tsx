import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  GRAVITY,
  INITIAL_SPEED,
  JUMP_FORCE,
  PIPE_SPACING,
  PIPE_WIDTH,
  SPEED_INCREMENT,
} from './constants';
import { gameAudio } from './Audio';
import {
  drawBackground,
  drawBuilding,
  drawDrone,
  drawParticles,
} from './renderer';
import type { GameState, Particle } from './types';

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const gameStateRef = useRef<GameState>({
    bird: { y: 250, velocity: 0 },
    pipes: [],
    particles: [],
    frame: 0,
    speed: INITIAL_SPEED,
  });

  const createParticles = useCallback(
    (x: number, y: number, color = '#0ff') => {
      const newParticles: Particle[] = Array.from({ length: 15 }, () => ({
        x,
        y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        life: 1,
        color,
      }));
      gameStateRef.current.particles.push(...newParticles);
    },
    []
  );

  const toggleSound = useCallback(() => {
    setIsMuted((prev) => {
      const newMuted = !prev;
      if (newMuted) {
        gameAudio.stopBackground();
      } else {
        gameAudio.init();
        if (gameStarted && !gameOver) {
          gameAudio.playBackground();
        }
      }
      return newMuted;
    });
  }, [gameStarted, gameOver]);

  const jump = useCallback(() => {
    if (!gameStarted || gameOver) {
      setGameStarted(true);
      setGameOver(false);
      setScore(0);
      gameStateRef.current = {
        bird: { y: 250, velocity: 0 },
        pipes: [],
        particles: [],
        frame: 0,
        speed: INITIAL_SPEED,
      };
      if (!isMuted) {
        gameAudio.playBackground();
      }
    }
    if (!gameOver) {
      gameStateRef.current.bird.velocity = JUMP_FORCE;
      createParticles(100, gameStateRef.current.bird.y, '#f0f');
      if (!isMuted) {
        gameAudio.playJump();
      }
    }
  }, [gameOver, gameStarted, isMuted, createParticles]);

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        jump();
      }
    },
    [jump]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      handleKeyPress(e);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyPress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;

      const containerWidth = container.clientWidth;
      const containerHeight = window.innerHeight * 0.8;

      const aspectRatio = CANVAS_WIDTH / CANVAS_HEIGHT;
      let width = containerWidth;
      let height = width / aspectRatio;

      if (height > containerHeight) {
        height = containerHeight;
        width = height * aspectRatio;
      }

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('click', jump);
    resizeCanvas();

    let lastTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    const gameLoop = (timestamp: number) => {
      if (!ctx) return;

      const deltaTime = timestamp - lastTime;
      if (deltaTime < frameInterval) {
        requestAnimationFrame(gameLoop);
        return;
      }

      lastTime = timestamp - (deltaTime % frameInterval);

      const state = gameStateRef.current;

      drawBackground(ctx, state.frame);

      if (gameStarted && !gameOver) {
        // Update bird
        state.bird.velocity += GRAVITY;
        state.bird.y += state.bird.velocity;

        // Generate pipes
        if (state.frame % 100 === 0) {
          // Remove old pipes that are far off screen
          state.pipes = state.pipes.filter((pipe) => pipe.x > -PIPE_WIDTH * 2);

          // Only generate new pipe if we have less than 3 pipes
          if (state.pipes.length < 3) {
            const height = Math.random() * (CANVAS_HEIGHT - 300) + 150;
            state.pipes.push({
              x: CANVAS_WIDTH,
              height,
              neonOffset: Math.random() * Math.PI,
            });
          }
        }

        // Update pipes and check collisions
        state.pipes.forEach((pipe) => {
          pipe.x -= state.speed;

          const birdBox = {
            x: 100 - 20,
            y: state.bird.y - 15,
            width: 40,
            height: 30,
          };

          if (
            birdBox.x + birdBox.width > pipe.x &&
            birdBox.x < pipe.x + PIPE_WIDTH &&
            (birdBox.y < pipe.height ||
              birdBox.y + birdBox.height > pipe.height + PIPE_SPACING)
          ) {
            handleGameOver();
            createParticles(100, state.bird.y, '#f00');
            state.speed = 0;
            if (!isMuted) {
              gameAudio.stopBackground();
            }
          }

          // Score point
          if (
            !gameOver &&
            pipe.x + PIPE_WIDTH < 98 &&
            pipe.x + PIPE_WIDTH >= 94
          ) {
            setScore((prev) => {
              const newScore = prev + 1;
              gameStateRef.current.speed =
                INITIAL_SPEED + newScore * SPEED_INCREMENT;
              return newScore;
            });
            createParticles(100, state.bird.y, '#0f0');
          }
        });

        // Clean up off-screen pipes
        state.pipes = state.pipes.filter((pipe) => pipe.x > -PIPE_WIDTH);

        // Update particles
        state.particles.forEach((particle) => {
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.life -= 0.02;
        });
        state.particles = state.particles.filter(
          (particle) => particle.life > 0
        );

        state.frame++;
      }

      // Draw game elements
      state.pipes.forEach((pipe) => {
        drawBuilding(ctx, pipe.x, pipe.height, true);
        drawBuilding(ctx, pipe.x, pipe.height + PIPE_SPACING, false);
      });

      drawDrone(
        ctx,
        100,
        state.bird.y,
        state.bird.velocity * 0.04,
        state.frame
      );
      drawParticles(ctx, state);

      // Draw UI
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#0ff';
      ctx.fillStyle = '#0ff';
      ctx.font = '48px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(score.toString(), CANVAS_WIDTH / 2, 50);

      if (!gameStarted) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#0ff';
        ctx.fillStyle = '#0ff';
        ctx.font = '36px "Press Start 2P", monospace';
        ctx.fillText('CYBER DRONE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
        ctx.font = '24px "Press Start 2P", monospace';
        ctx.fillText(
          'Click or Press Space',
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 50
        );
      }

      if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#f0f';
        ctx.fillStyle = '#f0f';
        ctx.font = '36px "Press Start 2P", monospace';
        ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100);
        ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.fillText(
          `High Score: ${highScore}`,
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 50
        );
        ctx.font = '24px "Press Start 2P", monospace';
        ctx.fillText(
          'Click or Press Space to Restart',
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 120
        );
      }

      requestAnimationFrame(gameLoop);
    };

    gameLoop(0);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('click', jump);
      gameAudio.stopBackground();
    };
  }, [jump, score, gameOver, gameStarted, highScore, isMuted, createParticles]);

  const handleGameOver = useCallback(() => {
    setGameOver(true);
    setHighScore((prev) => Math.max(prev, score));

    // Reset game state
    gameStateRef.current = {
      bird: { y: 250, velocity: 0 },
      pipes: [],
      particles: [],
      frame: 0,
      speed: 0, // Set to 0 immediately on game over
    };

    if (!isMuted) {
      gameAudio.stopBackground();
    }
  }, [score, isMuted]);

  return (
    <div className='w-full min-h-screen bg-black flex flex-col items-center justify-center px-4'>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className='border-4 border-[#0ff] rounded-lg shadow-2xl shadow-[#0ff] max-w-full'
      />
      <div className='mt-4 text-[#0ff] text-center space-y-2'>
        <button
          onClick={toggleSound}
          className='px-4 py-2 bg-transparent border-2 border-[#0ff] rounded-lg hover:bg-[#0ff] hover:text-black transition-colors duration-300'
        >
          {isMuted ? '🔇 Sound Off' : '🔊 Sound On'}
        </button>
        <p className='text-sm mt-2'>Press Space or Click to fly</p>
      </div>
    </div>
  );
}
