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
  { id: 'fill', label: 'Fill', icon: 'fa-fill-drip', hint: 'Flood the whole canvas with colour' },
  { id: 'stamp', label: 'Stamp', icon: 'fa-stamp', hint: 'Plop a condiment on the page' },
];

const DoodleMaker = ({ open, onClose, onUseDoodle, uploadImage }) => {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);

  const [tool, setTool] = useState('brush');
  const [color, setColor] = useState('#003399');
  const [size, setSize] = useState(8);
  const [stamp, setStamp] = useState('🌭');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const drawing = useRef(false);
  const last = useRef(null);
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

  // ─── Set up the canvas when the maker opens ───
  // The component renders nothing until `open` is true, so on the first pass
  // the canvas does not exist yet. Keying off `open` (and bailing out when the
  // ref is still empty) is what keeps this from dereferencing a null canvas
  // and taking the whole app down with it.
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, STAGE_W, STAGE_H);
    // Reopening the maker starts a fresh sheet rather than restoring the last
    // drawing, so reset the history stack to that blank state.
    history.current = [];
    historyIndex.current = -1;
    pushHistory();
  }, [open]);

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

  const startStroke = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = posFromEvent(e);

    if (tool === 'fill') {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, STAGE_W, STAGE_H);
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
    if (tool === 'eraser' || tool === 'fill') setTool('brush');
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
                className={`dm-swatch ${color === c && tool !== 'eraser' ? 'is-active' : ''}`}
                style={{ background: c }}
                onClick={() => { setColor(c); if (tool === 'eraser') setTool('brush'); }}
                title={c}
                aria-label={`Colour ${c}`}
              />
            ))}
            <button type="button" className="dm-swatch dm-surprise" onClick={surpriseColor} title="Surprise me!">
              <i className="fas fa-dice"></i>
            </button>
          </div>
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
          width={STAGE_W}
          height={STAGE_H}
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
