import { DAC } from '@laser-dac/core';

import { Simulator } from './simulator/src';

import { Scene, Circle } from '@laser-dac/draw';

(async () => {
  const dac = new DAC();
  dac.use(new Simulator());
  await dac.start();

  const scene = new Scene({
    resolution: 500,
  });
  function renderFrame() {
    const circle = new Circle({
      x: 0.5,
      y: 0.5,
      radius: 0.2,
      color: [1, 0, 0],
    });
    scene.add(circle);
  }

  scene.start(renderFrame);
  dac.stream(scene);
})();
