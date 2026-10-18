import { useState, useRef, useEffect } from 'react';

export default function SignaturePad({ onSignature, initialValue, width = 400, height = 180 }) {
  const canvasRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (initialValue) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setIsEmpty(false);
      };
      img.src = initialValue;
      return;
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1a7b32';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    function startDrawing(e) {
      isDrawing = true;
      lastX = e.nativeEvent ? e.nativeEvent.offsetX : e.offsetX;
      lastY = e.nativeEvent ? e.nativeEvent.offsetY : e.offsetY;
      setError('');
    }

    function draw(e) {
      if (!isDrawing) return;
      e.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const x = (e.nativeEvent ? e.nativeEvent.clientX : e.clientX) - rect.left;
      const y = (e.nativeEvent ? e.nativeEvent.clientY : e.clientY) - rect.top;

      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();
      lastX = x;
      lastY = y;
      setIsEmpty(false);
    }

    function stopDrawing() {
      isDrawing = false;
      ctx.beginPath();
    }

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseout', stopDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
    };
  }, [initialValue]);

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onSignature(null);
  }

  function confirmSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isEmpty) {
      setError('Please draw your signature before confirming.');
      return;
    }

    const dataUrl = canvas.toDataURL('image/png');
    onSignature(dataUrl);
    setError('');
  }

  function getDisplayValue() {
    if (initialValue && !isEmpty) {
      return (
        <img
          src={initialValue}
          alt="Signature"
          style={{ maxWidth: '100%', maxHeight: height - 10, objectFit: 'contain' }}
        />
      );
    }
    return null;
  }

  return (
    <div style={{ maxWidth: width }}>
      <div
        style={{
          border: '2px dashed var(--kvb-border)',
          borderRadius: 12,
          background: '#f9faf7',
          position: 'relative',
          height: height,
          touchAction: 'none',
        }}
      >
        {!initialValue && (
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            style={{ width: '100%', height: '100%', cursor: 'crosshair', touchAction: 'none' }}
          />
        )}
        {getDisplayValue()}
      </div>

      {error && <div className="form-error" style={{ marginTop: 8, fontSize: 13 }}>{error}</div>}

      <div className="action-row" style={{ marginTop: 12 }}>
        <button type="button" className="btn btn-secondary" onClick={clearSignature} style={{ flex: 1 }}>
          Clear
        </button>
        <button type="button" className="btn btn-primary" onClick={confirmSignature} style={{ flex: 1 }}>
          Confirm Signature
        </button>
      </div>
    </div>
  );
}
