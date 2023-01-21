import { DAC } from '@laser-dac/core';
import { Simulator } from './simulator/src';
import { Scene } from '@laser-dac/draw';
import { Bounds } from './Bounds';
import { Ball } from './Ball';

const radius = 0.03;
const bWidth = Math.max(Math.random(), radius * 2);
const bHeight = Math.max(Math.random(), radius * 2);

(async () => {
  const dac = new DAC();
  dac.use(new Simulator());
  await dac.start();

  const scene = new Scene({
    resolution: 500,
  });

  const bounds = new Bounds({
    x: 0.5 - bWidth / 2,
    y: 0.5 - bHeight / 2,
    width: bWidth,
    height: bHeight,
    color: [Math.random(), 1, Math.random()],
  });

  const ball = new Ball({
    radius: radius,
    x:
      Math.random() * (bounds.x + (bounds.width - radius) / 2 - bounds.x) +
      bounds.x +
      radius,
    y:
      Math.random() * (bounds.y + (bounds.height - radius) / 2 - bounds.y) +
      bounds.y +
      radius,

    color: [1, Math.random(), Math.random()],
  });
  function renderFrame() {
    scene.add(bounds);
    scene.add(ball);
    ball.updatePosition();
    ball.checkCollision(bounds);
  }

  scene.start(renderFrame);
  dac.stream(scene);
})();
