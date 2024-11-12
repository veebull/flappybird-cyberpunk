export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export interface Pipe {
  x: number;
  height: number;
  neonOffset: number;
}

export interface GameState {
  bird: {
    y: number;
    velocity: number;
  };
  pipes: Pipe[];
  particles: Particle[];
  frame: number;
  speed: number;
}