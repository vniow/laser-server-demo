import WebsocketClient from './websocket.js';
import dat from './dat.gui.js';

class SimulatorOptions {
  constructor() {
    this.positionDelay = 0;
    this.afterglowAmount = 30;
    this.xyResolution = 1;
    this.numberOfPoints = '';
    this.totalPoints = '';
    this.showBlanking = false;
    this.showDots = false;
    this.forceTotalRender = true;
  }
}

const options = new SimulatorOptions();
var gui = new dat.GUI();
gui.add(options, 'positionDelay', 0, 10).step(1);
gui.add(options, 'afterglowAmount', 0, 300);
gui.add(options, 'showBlanking');
gui.add(options, 'showDots');
gui.add(options, 'forceTotalRender');
gui.add(options, 'xyResolution', 0, 1);
gui.add(options, 'numberOfPoints').listen();
gui.add(options, 'totalPoints').listen();
gui.width = 300;

let points = [];
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let lastRenderTime;

// add an event listener to the canvas that listens for a "click" event
canvas.addEventListener('click', function (event) {
  try {
    const x = event.clientX;
    const y = event.clientY;
    const data = { type: 'CLICK', data: { x, y } };
    ws.send(JSON.stringify(data));
    console.log('Sent message:', data);
  } catch (err) {
    console.error('Error sending message:', err);
  }
});

document.addEventListener('keydown', function (event) {
  if (event.code === 'Space') {
    try {
      const data = { type: 'SPACEBAR' };
      ws.send(JSON.stringify(data));
      console.log('Sent message:', data);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  }
});

function handleResize() {
  const pixelRatio = window.devicePixelRatio;

  ctx.scale(pixelRatio, pixelRatio);
  canvas.width = Math.floor(canvas.clientWidth * pixelRatio);
  canvas.height = Math.floor(canvas.clientHeight * pixelRatio);
  ctx.lineWidth = pixelRatio;
}
handleResize();
window.onresize = handleResize;

// Listen to changes in device pixel ratio.
window
  .matchMedia('screen and (min-resolution: 2dppx)')
  .addListener(handleResize);

function calculateRelativePosition(position) {
  return position / options.xyResolution;
}

function calculateColor(raw) {
  return Math.round(raw * 255);
}

function render() {
  const currentTime = new Date();
  if (lastRenderTime) {
    const frameInterval = currentTime - lastRenderTime;
    // We add variable afterglow depending on the time until the last render.
    ctx.fillStyle = `rgba(0, 0, 0, ${
      options.afterglowAmount ? frameInterval / options.afterglowAmount : 1
    })`;
  }
  lastRenderTime = currentTime;

  // This rectangle will use the afterglow style from the code above.
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  points.forEach(function (point, i) {
    // To simulate the behaviour of an actual laser, controlling the color
    // of the lasers is faster than moving the scanners to a position.
    // "Accurate and Efficient Drawing Method for Laser Projection" describes this as:
    // "... the command ???turn on beam??? takes less time to execute than the actual ???jump??? command."
    const colorIndex = i + options.positionDelay;
    const color =
      points[colorIndex < points.length ? colorIndex : points.length - 1];

    // Prevent drawing unnecessary lines.
    const isBlanking = !color || !(color.r || color.g || color.b);
    if ((!options.showBlanking && isBlanking) || i === 0) return;
    const previousPoint = points[i - 1];
    if (previousPoint.x === point.x && previousPoint.y === point.y) return;

    ctx.beginPath();
    ctx.moveTo(
      calculateRelativePosition(previousPoint.x) * canvas.width,
      calculateRelativePosition(previousPoint.y) * canvas.height
    );
    const canvasPointX = calculateRelativePosition(point.x) * canvas.width;
    const canvasPointY = calculateRelativePosition(point.y) * canvas.height;
    const canvasColor = `rgb(${calculateColor(color.r)}, ${calculateColor(
      color.g
    )}, ${calculateColor(color.b)})`;
    ctx.lineTo(canvasPointX, canvasPointY);

    if (isBlanking) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    } else {
      ctx.strokeStyle = canvasColor;
    }
    ctx.stroke();
    if (options.showDots && !isBlanking) {
      ctx.fillStyle = canvasColor;
      ctx.beginPath();
      ctx.arc(canvasPointX, canvasPointY, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  requestAnimationFrame(render);
}
requestAnimationFrame(render);

// Get the hostname of the current page and remove the port number if it exists
const host = window.document.location.host.replace(/:.*/, '');

// Create a new instance of the WebsocketClient
const ws = new WebsocketClient();

// Open a new WebSocket connection to the server using the hostname and port number (8080)
ws.open('ws://' + host + ':8080');

// Set a function to be called when a message is received from the server
ws.onmessage = function (event) {
  // Parse the message payload as JSON
  const payload = JSON.parse(event.data);
  // If the message type is "POINTS"
  if (payload.type === 'POINTS') {
    if (options.forceTotalRender) {
      // Add the new points to the existing points
      points = points.concat(payload.data);
      // Keep the last "totalPoints" number of points, discarding the rest
      points = points.slice(Math.max(points.length - options.totalPoints, 0));
    } else {
      // Replace the existing points with the new points
      points = payload.data;
    }
    return;
  }
  // If the message type is "POINTS_INFO"
  if (payload.type === 'POINTS_INFO') {
    // Update the numberOfPoints and totalPoints options with the received data
    options.numberOfPoints = String(payload.data.numpoints);
    options.totalPoints = String(payload.data.totalPoints);
  }
};
