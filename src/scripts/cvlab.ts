// Hand-rolled image filters for the CV Lab. Each takes the source pixels
// and writes the result into `out`, with `k` (0..1) as the strength slider.

type Filter = (src: ImageData, out: ImageData, k: number) => void;

const PALETTE: [number, number, number][] = [
  [11, 11, 15], [47, 91, 255], [255, 46, 136], [255, 225, 77], [184, 255, 31], [25, 227, 255],
];

function grayOf(src: ImageData) {
  const g = new Float32Array(src.width * src.height);
  const d = src.data;
  for (let i = 0, p = 0; p < g.length; i += 4, p++) g[p] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
  return g;
}

// Sobel gradient. Edge brightness = magnitude, edge colour = direction,
// so you can see which way each edge runs.
const edges: Filter = (src, out, k) => {
  const { width: w, height: h } = src;
  const g = grayOf(src);
  const o = out.data;
  const cut = 20 + k * 160;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      const gx = -g[p - w - 1] - 2 * g[p - 1] - g[p + w - 1] + g[p - w + 1] + 2 * g[p + 1] + g[p + w + 1];
      const gy = -g[p - w - 1] - 2 * g[p - w] - g[p - w + 1] + g[p + w - 1] + 2 * g[p + w] + g[p + w + 1];
      const mag = Math.hypot(gx, gy);
      const i = p * 4;
      if (mag < cut) { o[i] = 11; o[i + 1] = 11; o[i + 2] = 15; o[i + 3] = 255; continue; }
      const angle = (Math.atan2(gy, gx) + Math.PI) / (Math.PI * 2);
      const c = PALETTE[1 + Math.floor(angle * 5) % 5];
      const a = Math.min(1, mag / 400 + 0.4);
      o[i] = c[0] * a; o[i + 1] = c[1] * a; o[i + 2] = c[2] * a; o[i + 3] = 255;
    }
  }
};

// Binary threshold, like cv2.threshold, rendered as a two-tone stencil.
const stencil: Filter = (src, out, k) => {
  const g = grayOf(src);
  const o = out.data;
  const t = 40 + k * 170;
  for (let p = 0; p < g.length; p++) {
    const i = p * 4;
    const c = g[p] > t ? [255, 46, 136] : [11, 11, 15];
    o[i] = c[0]; o[i + 1] = c[1]; o[i + 2] = c[2]; o[i + 3] = 255;
  }
};

// Colour quantisation: brightness bands mapped onto the site palette.
const pop: Filter = (src, out, k) => {
  const g = grayOf(src);
  const o = out.data;
  const levels = 3 + Math.round(k * 3);
  for (let p = 0; p < g.length; p++) {
    const band = Math.min(levels - 1, Math.floor((g[p] / 256) * levels));
    const c = PALETTE[Math.round((band / (levels - 1)) * (PALETTE.length - 1))];
    const i = p * 4;
    o[i] = c[0]; o[i + 1] = c[1]; o[i + 2] = c[2]; o[i + 3] = 255;
  }
};

// Pixel sort: inside each row, runs of bright pixels get sorted by brightness.
const sort: Filter = (src, out, k) => {
  const { width: w, height: h } = src;
  out.data.set(src.data);
  const g = grayOf(src);
  const o = out.data;
  const t = 200 - k * 170;
  const run: number[] = [];
  const flush = (y: number, end: number) => {
    if (run.length < 2) { run.length = 0; return; }
    const px = run.map((x) => { const i = (y * w + x) * 4; return [o[i], o[i + 1], o[i + 2], g[y * w + x]]; });
    px.sort((a, b) => a[3] - b[3]);
    const start = end - run.length;
    px.forEach((c, j) => { const i = (y * w + start + j) * 4; o[i] = c[0]; o[i + 1] = c[1]; o[i + 2] = c[2]; });
    run.length = 0;
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (g[y * w + x] > t) run.push(x);
      else flush(y, x);
    }
    flush(y, w);
  }
};

const FILTERS: Record<string, Filter | null> = { edges, stencil, pop, sort, none: null };

// Default picture so the lab has something to chew on before you upload.
function drawDemo(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#2f5bff'); bg.addColorStop(0.5, '#ff2e88'); bg.addColorStop(1, '#ffe14d');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = `hsla(${i * 40}, 90%, ${35 + i * 5}%, .85)`;
    ctx.beginPath();
    ctx.arc(80 + i * 75, 120 + Math.sin(i) * 80, 30 + (i % 4) * 18, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#0b0b0f';
  for (let x = 0; x < w; x += 48) ctx.fillRect(x, h - 90 - ((x * 7) % 110), 36, 200);
  ctx.font = '170px Bungee, sans-serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#0b0b0f';
  ctx.strokeText('HEX', w / 2, h / 2 + 60);
  ctx.fillStyle = '#b8ff1f';
  ctx.fillText('HEX', w / 2, h / 2 + 60);
}

export function initCvLab() {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-cv-canvas]');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const video = document.querySelector<HTMLVideoElement>('[data-cv-video]')!;
  const msEl = document.querySelector<HTMLElement>('[data-cv-ms]')!;
  const strength = document.querySelector<HTMLInputElement>('[data-cv-strength]')!;
  const camBtn = document.querySelector<HTMLButtonElement>('[data-cv-cam]')!;
  const { width: W, height: H } = canvas;

  // Source frame lives on its own canvas; the visible one shows the result.
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = W; srcCanvas.height = H;
  const sctx = srcCanvas.getContext('2d', { willReadFrequently: true })!;

  let filter = 'edges';
  let stream: MediaStream | null = null;

  const drawCover = (img: CanvasImageSource, iw: number, ih: number) => {
    const s = Math.max(W / iw, H / ih);
    const dw = iw * s, dh = ih * s;
    sctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  };

  const render = () => {
    const src = sctx.getImageData(0, 0, W, H);
    const f = FILTERS[filter];
    const t0 = performance.now();
    if (f) {
      const out = ctx.createImageData(W, H);
      f(src, out, +strength.value / 100);
      ctx.putImageData(out, 0, 0);
    } else ctx.putImageData(src, 0, 0);
    msEl.textContent = `${filter} · ${(performance.now() - t0).toFixed(1)} ms`;
  };

  document.fonts.ready.then(() => { drawDemo(sctx, W, H); render(); });

  for (const b of document.querySelectorAll<HTMLButtonElement>('[data-filter]')) {
    b.addEventListener('click', () => {
      filter = b.dataset.filter!;
      document.querySelectorAll('[data-filter]').forEach((x) => {
        x.classList.toggle('on', x === b);
        x.setAttribute('aria-checked', String(x === b));
      });
      if (!stream) render();
    });
  }
  strength.addEventListener('input', () => { if (!stream) render(); });

  document.querySelector<HTMLInputElement>('[data-cv-file]')!.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    stopCam();
    const img = new Image();
    img.onload = () => { drawCover(img, img.naturalWidth, img.naturalHeight); render(); URL.revokeObjectURL(img.src); };
    img.src = URL.createObjectURL(file);
  });

  function stopCam() {
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
    camBtn.textContent = '📷 Webcam';
  }

  camBtn.addEventListener('click', async () => {
    if (stream) { stopCam(); return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { width: 720, height: 480 } });
      video.srcObject = stream;
      await video.play();
      camBtn.textContent = '⏹ Stop cam';
      const loop = () => {
        if (!stream) return;
        drawCover(video, video.videoWidth, video.videoHeight);
        render();
        requestAnimationFrame(loop);
      };
      loop();
    } catch {
      msEl.textContent = 'no webcam found (or permission denied)';
      stopCam();
    }
  });
}
