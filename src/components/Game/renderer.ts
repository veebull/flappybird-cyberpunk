import { CANVAS_WIDTH, PIPE_WIDTH } from './constants';
import type { GameState } from './types';

export function drawDrone(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rotation: number,
  frame: number
) {
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
  const propellerOffset = frame % 4 * 2;
  ctx.beginPath();
  ctx.moveTo(-30 + propellerOffset, -10);
  ctx.lineTo(-20 - propellerOffset, -10);
  ctx.moveTo(20 + propellerOffset, -10);
  ctx.lineTo(30 - propellerOffset, -10);
  ctx.strokeStyle = '#f0f';
  ctx.stroke();

  ctx.restore();
}

export function drawBuilding(
  ctx: CanvasRenderingContext2D,
  x: number,
  height: number,
  isUpper: boolean
) {
  const gradient = ctx.createLinearGradient(
    x,
    isUpper ? 0 : height,
    x + PIPE_WIDTH,
    isUpper ? height : ctx.canvas.height
  );
  gradient.addColorStop(0, '#1a1a1a');
  gradient.addColorStop(1, '#2a2a2a');

  // Main building
  ctx.fillStyle = gradient;
  ctx.fillRect(
    x,
    isUpper ? 0 : height,
    PIPE_WIDTH,
    isUpper ? height : ctx.canvas.height - height
  );

  // Neon edges
  ctx.strokeStyle = '#f0f';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#f0f';
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.moveTo(x, height);
  ctx.lineTo(x + PIPE_WIDTH, height);
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
}

export function drawBackground(ctx: CanvasRenderingContext2D, frame: number) {
  // Cache gradient
  if (!ctx.__bgGradient) {
    const bgGradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    bgGradient.addColorStop(0, '#000000');
    bgGradient.addColorStop(1, '#1a0b2e');
    ctx.__bgGradient = bgGradient;
  }
  
  ctx.fillStyle = ctx.__bgGradient;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Reduce number of buildings and only draw visible ones
  const buildingCount = Math.ceil(CANVAS_WIDTH / 100) + 1;
  for (let i = 0; i < buildingCount; i++) {
    const x = ((frame * 0.5 + i * 100) % CANVAS_WIDTH) - 50;
    if (x < -40 || x > CANVAS_WIDTH) continue;
    
    const height = 100 + Math.sin(i * 0.5) * 50;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x, ctx.canvas.height - height, 40, height);
  }
}

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  state: GameState
) {
  state.particles.forEach(particle => {
    ctx.fillStyle = `${particle.color}${Math.floor(particle.life * 255)
      .toString(16)
      .padStart(2, '0')}`;
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}