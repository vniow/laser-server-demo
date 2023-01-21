import { Circle } from '@laser-dac/draw';
import { Bounds } from './Bounds';
// import { Collision } from './collisions';

export class Ball extends Circle {
  // set the ball velocity
  vx: number = 0.005;
  vy: number = 0.005;

  // moves the ball
  updatePosition() {
    this.x += this.vx;
    this.y += this.vy;
  }
  // check if the ball hits the paddle, blocks, or bounds
  checkCollision(bounds: Bounds) {
    // reverse the x direction if the ball hits the left or right bounds
    if (
      this.x - this.radius <= bounds.x ||
      this.x + this.radius > bounds.x + bounds.width
    ) {
      this.vx *= -1;
    }
    // reverse the y direction if the ball hits the top bounds
    if (
      this.y - this.radius <= bounds.y ||
      this.y + this.radius > bounds.y + bounds.height
    ) {
      this.vy *= -1;
    }
  }
}
