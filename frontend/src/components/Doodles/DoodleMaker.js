import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';

// ─── A small, hand-rolled doodle maker ───────────────────────────────────
// Everything here runs on a plain <canvas> with pointer events, so it works
// with a mouse, a stylus and a finger without extra libraries.
//
// The canvas keeps a fixed internal resolution (STAGE_W x STAGE_H) and is
// scaled to fit its container with CSS. Pointer coordinates are therefore
// mapped from the element's on-screen box back into canvas space, which keeps
// drawing accurate at any zoom level or device pixel ratio.

const STAGE_W = 900;
const STAGE_H = 700;

// Device-pixel scale for the backing store, capped to bound memory and the
// cost of the pixel-level flood fill. Computed once so the canvas attributes
// are stable across renders.
const initialScale = () =>
  Math.min(3, Math.max(1, (typeof window !== 'undefined' && window.devicePixelRatio) || 1));
const INITIAL_SCALE = initialScale();
const initialWidth = Math.round(STAGE_W * INITIAL_SCALE);
const initialHeight = Math.round(STAGE_H * INITIAL_SCALE);
const MAX_HISTORY = 30;

// SnowSnakes palette: the condiments the whole site is built around, plus the
// site's own blue/pink. "Surprise me" picks from these at random.
const COLORS = [
  '#003399', // site blue
  '#ff00ff', // site pink
  '#ffcc00', // mustard yellow
  '#e63946', // ketchup red
  '#ff7f11', // sriracha orange
  '#2ecc71', // relish green
  '#8e44ad', // grape violet
  '#6d4c41', // vin negar brown
  '#ff9ecb', // miracle whip pink
  '#00ccff', // ice blue
  '#ffffff',
  '#000000',
];

// The condiment cast, as rubber stamps.
const STAMPS = ['🌭', '🥫', '🍅', '🌶️', '🧅', '🥒', '🧈', '🐍', '❄️', '🧊', '🍔', '🎨'];

const TOOLS = [
  { id: 'brush', label: 'Brush', icon: 'fa-paintbrush', hint: 'Draw a smooth line' },
  { id: 'marker', label: 'Marker', icon: 'fa-highlighter', hint: 'Draw a fat, see-through line' },
  { id: 'spray', label: 'Spray', icon: 'fa-spray-can', hint: 'Splatter paint like a spray can' },
  { id: 'eraser', label: 'Eraser', icon: 'fa-eraser', hint: 'Rub bits out' },
  { id: 'fill', label: 'Fill', icon: 'fa-fill-drip', hint: 'Fill inside a closed shape' },
  { id: 'stamp', label: 'Stamp', icon: 'fa-stamp', hint: 'Plop a condiment on the page' },
];

const DoodleMaker = ({ open, onClose, onUseDoodle, uploadImage }) => {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);

  const [tool, setTool] = useState('brush');
  const [color, setColor] = useState('#003399');
  // Tracks whether the active colour came from the spectrum picker rather than
  // a preset swatch, so the right control shows as selected.
  const [customColor, setCustomColor] = useState(false);
  const [size, setSize] = useState(8);
  const [stamp, setStamp] = useState('🌭');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const drawing = useRef(false);
  const last = useRef(null);
  // Which device-pixel scale the canvas is currently initialised at, or null
  // when it has not been set up yet.
  const initializedRef = useRef(null);
  // Device-pixel scale for the canvas backing store. The drawing tools all work
  // in the logical 900x700 space; only the backing store is scaled up, so a
  // retina screen or a zoomed-in browser renders crisp edges instead of
  // blocky ones. Capped at 3 to bound memory and fill cost.
  const [dprScale, setDprScale] = useState(() =>
    Math.min(3, Math.max(1, (typeof window !== 'undefined' && window.devicePixelRatio) || 1))
  );
  // Snapshot stack for undo/redo. The first entry is the blank canvas.
  const history = useRef([]);
  const historyIndex = useRef(-1);
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });

  const syncHistoryState = () => {
    setHistoryState({
      canUndo: historyIndex.current > 0,
      canRedo: historyIndex.current < history.current.length - 1,
    });
  };

  const pushHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const snapshot = canvas.toDataURL('image/png');
    // Drop any redo branch, then append.
    history.current = history.current.slice(0, historyIndex.current + 1);
    history.current.push(snapshot);
    if (history.current.length > MAX_HISTORY) history.current.shift();
    historyIndex.current = history.current.length - 1;
    syncHistoryState();
  };

  const restore = (dataUrl) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, STAGE_W, STAGE_H);
      ctx.drawImage(img, 0, 0);
    };
    img.src = dataUrl;
  };

  // ─── Set up / rescale the canvas when the maker opens ───
  // The component renders nothing until `open` is true, so on the first pass
  // the canvas does not exist yet. Keying off `open` (and bailing out when the
  // ref is still empty) is what keeps this from dereferencing a null canvas
  // and taking the whole app down with it.
  //
  // The backing store is sized to logical x dprScale while the CSS size stays
  // 900x700, and the context is scaled to match. Every tool therefore keeps
  // working in logical units, but the browser rasterises strokes at the higher
  // device resolution. If the scale changes (zoom, or the window moving to a
  // different monitor) whatever is already drawn is carried across.
  useEffect(() => {
    if (!open) {
      // Reopening should start from a clean sheet, so forget the setup state.
      initializedRef.current = null;
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ⚠️ The canvas attributes are seeded at the initial scale, so on the very
    // first open the element is ALREADY the right size. Comparing sizes alone
    // therefore concluded "nothing to do" and returned before painting the
    // white sheet, leaving the canvas transparent. Track initialization
    // explicitly instead of inferring it from dimensions.
    if (initializedRef.current === dprScale) {
      const ready = canvas.getContext('2d');
      ready.setTransform(dprScale, 0, 0, dprScale, 0, 0);
      ready.lineJoin = 'round';
      ready.lineCap = 'round';
      return;
    }

    // Preserve the current artwork across a rescale (null on first open).
    const previous = initializedRef.current !== null && canvas.width > 0
      ? canvas.toDataURL('image/png')
      : null;

    canvas.width = Math.round(STAGE_W * dprScale);
    canvas.height = Math.round(STAGE_H * dprScale);

    const ctx = canvas.getContext('2d');
    // Draw in logical coordinates from here on.
    ctx.setTransform(dprScale, 0, 0, dprScale, 0, 0);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, STAGE_W, STAGE_H);

    if (previous) {
      const img = new Image();
      img.onload = () => {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      };
      img.src = previous;
    }

    initializedRef.current = dprScale;

    // Reopening the maker starts a fresh sheet rather than restoring the last
    // drawing, so reset the history stack to that blank state.
    history.current = [];
    historyIndex.current = -1;
    pushHistory();
  }, [open, dprScale]);

  // Follow device-pixel-ratio changes (browser zoom, monitor switch) so the
  // canvas is never left rendering at a stale resolution. A resolution media
  // query fires even where the window itself does not resize, so both signals
  // are watched and the query is re-armed for the new ratio each time.
  useEffect(() => {
    const readScale = () => {
      const next = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
      setDprScale((current) => (Math.abs(current - next) < 0.01 ? current : next));
    };
    readScale();
    window.addEventListener('resize', readScale);

    let mq = null;
    function onRatioChange() {
      readScale();
      watchRatio();
    }
    function watchRatio() {
      if (mq) mq.removeEventListener('change', onRatioChange);
      mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      mq.addEventListener('change', onRatioChange);
    }
    watchRatio();

    return () => {
      window.removeEventListener('resize', readScale);
      if (mq) mq.removeEventListener('change', onRatioChange);
    };
  }, []);

  // Logical -> device pixels, for the pixel-level flood fill.
  const scale = dprScale;
  const DW = Math.round(STAGE_W * scale);
  const DH = Math.round(STAGE_H * scale);

  // ─── Map a pointer event onto canvas coordinates ───
  const posFromEvent = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * STAGE_W,
      y: ((e.clientY - rect.top) / rect.height) * STAGE_H,
    };
  };

  const sprayAt = (ctx, x, y) => {
    const radius = size * 2.2;
    const dots = Math.max(8, size * 3);
    for (let i = 0; i < dots; i++) {
      // sqrt keeps the dots evenly spread over the disc instead of clumping
      // in the middle.
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.sqrt(Math.random()) * radius;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, 1.1, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  const stampAt = (ctx, x, y) => {
    ctx.font = `${size * 4}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(stamp, x, y);
  };

  // ─── Flood fill ───
  // Fills the contiguous region under the pointer and stops at drawn lines, the
  // way a paint-bucket works. Walks the pixel buffer directly: a stack-based
  // scanline fill, because a naive per-pixel recursion would blow the call
  // stack on a canvas this size.
  //
  // Lines drawn here are anti-aliased, so a strict "exact colour match" test
  // would stop short of the stroke and leave a pale halo all the way around.
  // Instead the target colour is sampled as the average of the pointer's
  // neighbourhood, and pixels within a tolerance count as part of the region.
  const hexToRgb = (hex) => {
    const clean = hex.replace('#', '');
    const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
    };
  };

  const floodFill = (ctx, startX, startY, hexColor) => {
    // getImageData/putImageData ignore the context transform and work in device
    // pixels, so the logical click point is scaled up to match the backing store.
    const w = DW;
    const h = DH;
    const sx = Math.floor(startX * scale);
    const sy = Math.floor(startY * scale);
    if (sx < 0 || sy < 0 || sx >= w || sy >= h) return;

    const image = ctx.getImageData(0, 0, w, h);
    const data = image.data;

    // Sample the average colour over a small box so a click on an anti-aliased
    // edge does not sample a half-blended pixel as the target. The box is
    // defined in logical units and scaled, so it covers the same part of the
    // drawing at any device-pixel ratio.
    const sampleRadius = Math.max(2, Math.round(2 * scale));
    let sr = 0, sg = 0, sb = 0, sa = 0, n = 0;
    for (let dy = -sampleRadius; dy <= sampleRadius; dy++) {
      for (let dx = -sampleRadius; dx <= sampleRadius; dx++) {
        const px = sx + dx, py = sy + dy;
        if (px < 0 || py < 0 || px >= w || py >= h) continue;
        const i = (py * w + px) * 4;
        sr += data[i]; sg += data[i + 1]; sb += data[i + 2]; sa += data[i + 3]; n++;
      }
    }
    const target = { r: sr / n, g: sg / n, b: sb / n, a: sa / n };
    const { r: fr, g: fg, b: fb } = hexToRgb(hexColor);

    // Nothing to do if the region is already the requested colour.
    if (Math.abs(target.r - fr) < 2 && Math.abs(target.g - fg) < 2 &&
        Math.abs(target.b - fb) < 2 && target.a > 250) return;

    // 0..255 per channel. Generous enough to absorb anti-aliasing, tight enough
    // not to leak across a real stroke.
    const TOLERANCE = 60;
    const within = (i) =>
      Math.abs(data[i] - target.r) <= TOLERANCE &&
      Math.abs(data[i + 1] - target.g) <= TOLERANCE &&
      Math.abs(data[i + 2] - target.b) <= TOLERANCE &&
      Math.abs(data[i + 3] - target.a) <= TOLERANCE;

    // ⚠️ The jagged border problem.
    //
    // Strokes are anti-aliased, so at the boundary every pixel is a blend of
    // the old colour and the stroke. Filling those pixels opaquely gives a
    // staircase edge; leaving them alone (the classic paint-bucket behaviour)
    // leaves a pale halo all the way around. Neither reads as smooth.
    //
    // Instead the fill is composited by distance: a pixel exactly on the target
    // colour becomes fully filled, a pixel right at the stroke stays untouched,
    // and everything in between gets a partial alpha proportional to how close
    // it is. The existing pixel shows through that alpha, so the transition
    // takes on the edge's own anti-aliasing and the result looks like a solid
    // fill drawn up to a smooth line.
    const distance = (i) => Math.max(
      Math.abs(data[i] - target.r),
      Math.abs(data[i + 1] - target.g),
      Math.abs(data[i + 2] - target.b),
      Math.abs(data[i + 3] - target.a)
    );

    // The look of the edge must not change with resolution, so the smear is
    // expressed in logical pixels and converted to a per-channel distance for
    // the current scale. Otherwise a retina canvas would smooth over a wider
    // band of device pixels and produce a softer edge than a 1x one.
    const SMEAR_LOGICAL = 3;
    const SMEAR = Math.max(8, Math.round((SMEAR_LOGICAL * 255 * 1.6) / scale));

    const filled = new Uint8Array(w * h);
    const stack = [[sx, sy]];

    while (stack.length) {
      const [x, y] = stack.pop();
      let left = x;
      let right = x;
      const rowStart = y * w;
      // Walk left and right along this row for as long as the run matches.
      while (left > 0 && within((rowStart + left - 1) * 4)) left--;
      while (right < w - 1 && within((rowStart + right + 1) * 4)) right++;

      for (let px = left; px <= right; px++) {
        const p = rowStart + px;
        const i = p * 4;
        filled[p] = 1;

        const d = distance(i);
        // Opaque within the solid region; the rest of the smear fades the fill
        // out into whatever the edge already had.
        const solid = TOLERANCE + SMEAR;
        const alpha = d <= solid ? 1 : Math.max(0, 1 - (d - solid) / SMEAR);

        // Composite the fill over the existing pixel: colour channels blend by
        // alpha, and the pixel keeps its own alpha (the sheet is opaque).
        data[i] = Math.round(fr * alpha + data[i] * (1 - alpha));
        data[i + 1] = Math.round(fg * alpha + data[i + 1] * (1 - alpha));
        data[i + 2] = Math.round(fb * alpha + data[i + 2] * (1 - alpha));
        // The sheet is opaque, so alpha stays 255; only colour blends.
        data[i + 3] = 255;
      }

      // Seed the rows above and below, once per contiguous run.
      for (const ny of [y - 1, y + 1]) {
        if (ny < 0 || ny >= h) continue;
        let inRun = false;
        for (let px = left; px <= right; px++) {
          const p = ny * w + px;
          const matches = !filled[p] && within(p * 4);
          if (matches && !inRun) { stack.push([px, ny]); inRun = true; }
          else if (!matches) inRun = false;
        }
      }
    }

    ctx.putImageData(image, 0, 0);
  };

  const startStroke = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = posFromEvent(e);

    if (tool === 'fill') {
      // Flood fill must run with normal compositing; the eraser leaves
      // destination-out set, which would make the fill erase instead of paint.
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      floodFill(ctx, x, y, color);
      pushHistory();
      return;
    }
    if (tool === 'stamp') {
      stampAt(ctx, x, y);
      pushHistory();
      return;
    }

    drawing.current = true;
    last.current = { x, y };

    ctx.beginPath();
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = size * 2;
    } else if (tool === 'marker') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = color;
      ctx.lineWidth = size * 2.6;
    } else if (tool === 'spray') {
      ctx.globalCompositeOperation = 'source-over';
      sprayAt(ctx, x, y);
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
    }
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.01, y + 0.01);
    ctx.stroke();
  };

  const moveStroke = (e) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = posFromEvent(e);

    if (tool === 'spray') {
      sprayAt(ctx, x, y);
      last.current = { x, y };
      return;
    }

    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    last.current = { x, y };
  };

  const endStroke = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const ctx = canvasRef.current.getContext('2d');
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    pushHistory();
  };

  const undo = () => {
    if (historyIndex.current <= 0) return;
    historyIndex.current -= 1;
    restore(history.current[historyIndex.current]);
    syncHistoryState();
  };

  const redo = () => {
    if (historyIndex.current >= history.current.length - 1) return;
    historyIndex.current += 1;
    restore(history.current[historyIndex.current]);
    syncHistoryState();
  };

  const clearAll = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    // Keep the paper white rather than transparent, so "Clear" looks like a
    // fresh sheet instead of a hole in the page.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, STAGE_W, STAGE_H);
    pushHistory();
  };

  const surpriseColor = () => {
    const next = COLORS[Math.floor(Math.random() * COLORS.length)];
    setColor(next);
    setCustomColor(false);
    if (tool === 'eraser') setTool('brush');
  };

  // ─── Export ───
  const toBlob = (callback, type = 'image/png') => {
    const canvas = canvasRef.current;
    if (canvas.toBlob) canvas.toBlob(callback, type);
    else callback(null);
  };

  const download = () => {
    toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      // A timestamped name means repeat downloads never overwrite each other.
      const stampName = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      a.href = url;
      a.download = `snowsnakes-doodle-${stampName}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus('Downloaded! Check your downloads folder.');
    }, 'image/png');
  };

  const submit = async () => {
    if (!uploadImage) {
      setStatus('Uploading is not available right now.');
      return;
    }
    setBusy(true);
    setStatus('Uploading your doodle…');
    toBlob(async (blob) => {
      if (!blob) {
        setBusy(false);
        setStatus('Could not prepare the image. Try again.');
        return;
      }
      try {
        const url = await uploadImage(blob);
        if (!url) {
          setBusy(false);
          setStatus('Upload did not complete. Try again.');
          return;
        }
        setStatus('');
        if (onUseDoodle) onUseDoodle(url);
      } catch (err) {
        setBusy(false);
        setStatus('Upload failed. You can still download the doodle.');
      }
    }, 'image/png');
  };

  // Keyboard shortcuts, ignored while typing in a field.
  const handleKey = useCallback((e) => {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    else if (mod && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); redo(); }
    else if (e.key === '[') setSize((s) => Math.max(2, s - 2));
    else if (e.key === ']') setSize((s) => Math.min(48, s + 2));
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const currentTool = TOOLS.find((t) => t.id === tool);

  if (!open) return null;

  const maker = (
    <div className="doodle-maker">
      <div className="dm-toolbar">
        <div className="dm-group">
          <span className="dm-label">Tool</span>
          <div className="dm-tools">
            {TOOLS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`dm-tool ${tool === t.id ? 'is-active' : ''}`}
                onClick={() => setTool(t.id)}
                title={`${t.label} — ${t.hint}`}
                aria-pressed={tool === t.id}
              >
                <i className={`fas ${t.icon}`}></i>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="dm-group">
          <span className="dm-label">Colour</span>
          <div className="dm-colors">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`dm-swatch ${!customColor && color === c && tool !== 'eraser' ? 'is-active' : ''}`}
                style={{ background: c }}
                onClick={() => { setColor(c); setCustomColor(false); if (tool === 'eraser') setTool('brush'); }}
                title={c}
                aria-label={`Colour ${c}`}
              />
            ))}
            <button type="button" className="dm-swatch dm-surprise" onClick={surpriseColor} title="Surprise me!">
              <i className="fas fa-dice"></i>
            </button>
          </div>
          {/* Full spectrum picker. The native control is styled to look like
              another swatch, and hidden behind a label so it matches the row. */}
          <label
            className={`dm-swatch dm-spectrum ${customColor && tool !== 'eraser' ? 'is-active' : ''}`}
            style={{ background: customColor ? color : undefined }}
            title="Pick any colour"
          >
            <i className={`fas ${customColor ? 'fa-check' : 'fa-eye-dropper'}`}></i>
            <input
              type="color"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                setCustomColor(true);
                if (tool === 'eraser') setTool('brush');
              }}
              aria-label="Pick any colour"
            />
          </label>
        </div>

        <div className="dm-group">
          <span className="dm-label">
            {tool === 'stamp' ? 'Stamp' : 'Size'} <b>{tool === 'stamp' ? '' : size}</b>
          </span>
          {tool === 'stamp' ? (
            <div className="dm-stamps">
              {STAMPS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`dm-stamp ${stamp === s ? 'is-active' : ''}`}
                  onClick={() => setStamp(s)}
                  aria-label={`Stamp ${s}`}
                >
                  {s}
                </button>
              ))}
            </div>
          ) : (
            <input
              type="range"
              min="2"
              max="48"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              aria-label="Brush size"
            />
          )}
        </div>

        <div className="dm-group dm-actions">
          <span className="dm-label">Edit</span>
          <div className="dm-buttons">
            <button type="button" className="btn btn-secondary btn-sm" onClick={undo} disabled={!historyState.canUndo} title="Undo (Ctrl+Z)">
              <i className="fas fa-rotate-left"></i> Undo
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={redo} disabled={!historyState.canRedo} title="Redo (Ctrl+Y)">
              <i className="fas fa-rotate-right"></i> Redo
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={clearAll} title="Start over">
              <i className="fas fa-trash"></i> Clear
            </button>
          </div>
        </div>
      </div>

      <div className="dm-stage" ref={wrapRef}>
        <canvas
          ref={canvasRef}
          // React must never change these: writing width/height resets the
          // bitmap. They seed the first paint at the initial device-pixel
          // ratio, and the setup effect resizes the element itself for every
          // later scale change, so the drawing survives. CSS keeps the rendered
          // size at the logical 900x700 either way.
          width={initialWidth}
          height={initialHeight}
          className={`dm-canvas dm-cursor-${tool}`}
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); startStroke(e); }}
          onPointerMove={moveStroke}
          onPointerUp={endStroke}
          onPointerLeave={endStroke}
          onPointerCancel={endStroke}
        />
      </div>

      <div className="dm-footer">
        <div className="dm-hint">
          {currentTool ? `${currentTool.label}: ${currentTool.hint}` : ''}
          <span className="dm-keys"> · Ctrl+Z undo · [ ] size</span>
        </div>
        <div className="dm-status">{status}</div>
        <div className="dm-submit">
          <button type="button" className="btn btn-warning" onClick={download}>
            <i className="fas fa-download"></i> Download PNG
          </button>
          <button type="button" className="btn btn-success" onClick={submit} disabled={busy}>
            <i className={`fas ${busy ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
            {busy ? ' Submitting…' : ' Submit Doodle'}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal dm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎨 Doodle Maker</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {maker}
      </div>
    </div>,
    document.getElementById('modal-root')
  );
};

export default DoodleMaker;
