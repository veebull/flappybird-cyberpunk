import React, { useEffect, useRef, useState } from 'react';
import { useCallback } from 'react';

const INITIAL_SPEED = 4;
const SPEED_INCREMENT = 0.2;
const GRAVITY = 0.8;
const JUMP_FORCE = -12;
const PIPE_SPACING = 200;
const PIPE_WIDTH = 120;

const backgroundMusic = new Audio('https://dl.dropboxusercontent.com/scl/fi/v9ys8t9kc1166vqcmwvx1/cyberpunk-background.mp3?rlkey=v0k1234567890');
backgroundMusic.loop = true;
const jumpSound = new Audio('https://dl.dropboxusercontent.com/scl/fi/abc123def456/cyber-bounce.mp3?rlkey=v0k1234567890');

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  
  const gameStateRef = useRef({
    bird: { y: 250, velocity: 0 },
    pipes: [] as { x: number; height: number; neonOffset: number }[],
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
    frame: 0,
    speed: INITIAL_SPEED,
  });

  const createParticles = (x: number, y: number, color: string = '#0ff') => {
    for (let i = 0; i < 15; i++) {
      gameStateRef.current.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        life: 1,
        color,
      });
    }
  };

  const drawDrone = (ctx: CanvasRenderingContext2D, x: number, y: number, rotation: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    // Drone body
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 25, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Neon glow
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 10;
    ctx.stroke();

    // Propellers
    const propellerOffset = gameStateRef.current.frame % 4 * 2;
    ctx.beginPath();
    ctx.moveTo(-30 + propellerOffset, -10);
    ctx.lineTo(-20 - propellerOffset, -10);
    ctx.moveTo(20 + propellerOffset, -10);
    ctx.lineTo(30 - propellerOffset, -10);
    ctx.strokeStyle = '#f0f';
    ctx.stroke();

    ctx.restore();
  };

  const drawBuilding = (ctx: CanvasRenderingContext2D, x: number, height: number, isUpper: boolean) => {
    const gradient = ctx.createLinearGradient(x, isUpper ? 0 : height, x + PIPE_WIDTH, isUpper ? height : ctx.canvas.height);
    gradient.addColorStop(0, '#1a1a1a');
    gradient.addColorStop(1, '#2a2a2a');

    // Main building
    ctx.fillStyle = gradient;
    ctx.fillRect(x, isUpper ? 0 : height, PIPE_WIDTH, isUpper ? height : ctx.canvas.height - height);

    // Neon edges
    ctx.strokeStyle = '#f0f';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#f0f';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    if (isUpper) {
      ctx.moveTo(x, height);
      ctx.lineTo(x + PIPE_WIDTH, height);
    } else {
      ctx.moveTo(x, height);
      ctx.lineTo(x + PIPE_WIDTH, height);
    }
    ctx.stroke();

    // Windows
    ctx.shadowBlur = 0;
    const windowSize = 10;
    const windowSpacing = 25;
    const startY = isUpper ? windowSize : height + windowSize;
    const endY = isUpper ? height - windowSize : ctx.canvas.height - windowSize;

    for (let y = startY; y < endY; y += windowSpacing) {
      for (let wx = x + 20; wx < x + PIPE_WIDTH - 20; wx += windowSpacing) {
        if (Math.random() > 0.3) {
          ctx.fillStyle = `rgba(0, 255, 255, ${Math.random() * 0.5 + 0.5})`;
          ctx.fillRect(wx, y, windowSize, windowSize);
        }
      }
    }
  };

  const toggleSound = () => {
    setIsMuted(!isMuted);
    if (isMuted) {
      backgroundMusic.play();
    } else {
      backgroundMusic.pause();
    }
  };

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
        backgroundMusic.currentTime = 0;
        backgroundMusic.play();
      }
    }
    if (!gameOver) {
      gameStateRef.current.bird.velocity = JUMP_FORCE;
      createParticles(100, gameStateRef.current.bird.y, '#f0f');
      if (!isMuted) {
        jumpSound.currentTime = 0;
        jumpSound.play();
      }
    }
  }, [gameOver, gameStarted, isMuted]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Make canvas responsive
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;
      
      const containerWidth = container.clientWidth;
      const containerHeight = window.innerHeight * 0.8;
      
      // Maintain aspect ratio
      const aspectRatio = 800 / 600;
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
    resizeCanvas();

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    canvas.addEventListener('click', jump);

    const gameLoop = () => {
      if (!ctx) return;
      const state = gameStateRef.current;

      // Clear canvas with a dark gradient background
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, '#000000');
      bgGradient.addColorStop(1, '#1a0b2e');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw distant city background
      for (let i = 0; i < 20; i++) {
        const x = (state.frame * 0.5 + i * 100) % canvas.width;
        const height = 100 + Math.sin(i * 0.5) * 50;
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x, canvas.height - height, 40, height);
        
        // Add some neon windows
        for (let j = 0; j < 5; j++) {
          ctx.fillStyle = `rgba(0, 255, 255, ${Math.random() * 0.3})`;
          ctx.fillRect(x + Math.random() * 30, canvas.height - Math.random() * height, 4, 4);
        }
      }

      if (gameStarted && !gameOver) {
        // Update bird
        state.bird.velocity += GRAVITY;
        state.bird.y += state.bird.velocity;

        // Generate pipes
        if (state.frame % 100 === 0) {
          const height = Math.random() * (canvas.height - 300) + 150;
          state.pipes.push({ x: canvas.width, height, neonOffset: Math.random() * Math.PI });
        }

        // Update pipes and speed
        state.pipes.forEach((pipe) => {
          pipe.x -= state.speed;
          
          // Check collision
          const birdBox = {
            x: 100 - 20,
            y: state.bird.y - 15,
            width: 40,
            height: 30,
          };

          if (
            birdBox.x + birdBox.width > pipe.x &&
            birdBox.x < pipe.x + PIPE_WIDTH &&
            (birdBox.y < pipe.height || birdBox.y + birdBox.height > pipe.height + PIPE_SPACING)
          ) {
            setGameOver(true);
            setHighScore(prev => Math.max(prev, score));
            createParticles(100, state.bird.y, '#f00');
            if (!isMuted) {
              backgroundMusic.pause();
            }
          }

          // Score point
          if (pipe.x + PIPE_WIDTH < 98 && pipe.x + PIPE_WIDTH >= 94) {
            setScore(s => s + 1);
            state.speed += SPEED_INCREMENT;
            createParticles(100, state.bird.y, '#0f0');
          }
        });

        // Remove off-screen pipes
        state.pipes = state.pipes.filter(pipe => pipe.x > -PIPE_WIDTH);

        // Update particles
        state.particles.forEach(particle => {
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.life -= 0.02;
        });
        state.particles = state.particles.filter(particle => particle.life > 0);

        state.frame++;
      }

      // Draw buildings (pipes)
      state.pipes.forEach(pipe => {
        drawBuilding(ctx, pipe.x, pipe.height, true);
        drawBuilding(ctx, pipe.x, pipe.height + PIPE_SPACING, false);
      });

      // Draw drone (bird)
      drawDrone(ctx, 100, state.bird.y, state.bird.velocity * 0.04);

      // Draw particles
      state.particles.forEach(particle => {
        ctx.fillStyle = `${particle.color}${Math.floor(particle.life * 255).toString(16).padStart(2, '0')}`;
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw UI
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#0ff';
      ctx.fillStyle = '#0ff';
      ctx.font = '48px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(score.toString(), canvas.width / 2, 50);

      if (!gameStarted) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#0ff';
        ctx.fillStyle = '#0ff';
        ctx.font = '36px "Press Start 2P", monospace';
        ctx.fillText('CYBER DRONE', canvas.width / 2, canvas.height / 2 - 50);
        ctx.font = '24px "Press Start 2P", monospace';
        ctx.fillText('Click or Press Space', canvas.width / 2, canvas.height / 2 + 50);
      }

      if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#f0f';
        ctx.fillStyle = '#f0f';
        ctx.font = '36px "Press Start 2P", monospace';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 100);
        ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2);
        ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height / 2 + 50);
        ctx.font = '24px "Press Start 2P", monospace';
        ctx.fillText('Click or Press Space to Restart', canvas.width / 2, canvas.height / 2 + 120);
      }

      requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('click', jump);
      backgroundMusic.pause();
    };
  }, [jump, score, gameOver, gameStarted, highScore, isMuted]);

  return (
    <div className="w-full min-h-screen bg-black flex flex-col items-center justify-center px-4">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border-4 border-[#0ff] rounded-lg shadow-2xl shadow-[#0ff] max-w-full"
      />
      <div className="mt-4 text-[#0ff] text-center space-y-2">
        <button
          onClick={toggleSound}
          className="px-4 py-2 bg-transparent border-2 border-[#0ff] rounded-lg hover:bg-[#0ff] hover:text-black transition-colors duration-300"
        >
          {isMuted ? '🔇 Sound Off' : '🔊 Sound On'}
        </button>
        <p className="text-sm mt-2">Press Space or Click to fly</p>
      </div>
    </div>
  );
}</content>