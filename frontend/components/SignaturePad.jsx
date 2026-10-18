'use client';

import { useEffect, useRef, useState } from 'react';

export default function SignaturePad({ label, value, onChange, disabled = false, height = 170 }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const inkRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });
  const [hasInk, setHasInk] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || disabled) return undefined;

    const context = canvas.getContext('2d');
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 480;

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.scale(ratio, ratio);
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#0f172a';

    if (value) {
      const image = new Image();
      image.onload = () => context.drawImage(image, 0, 0, width, height);
      image.src = value;
      inkRef.current = true;
      setHasInk(true);
    }

    const pointFrom = (event) => {
      const rect = canvas.getBoundingClientRect();
      const source = event.touches ? event.touches[0] : event;
      return { x: source.clientX - rect.left, y: source.clientY - rect.top };
    };

    const start = (event) => {
      if (disabled) return;
      event.preventDefault();
      drawingRef.current = true;
      lastPointRef.current = pointFrom(event);
      setError('');
    };

    const move = (event) => {
      if (!drawingRef.current || disabled) return;
      event.preventDefault();
      const point = pointFrom(event);
      context.beginPath();
      context.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      context.lineTo(point.x, point.y);
      context.stroke();
      lastPointRef.current = point;
      inkRef.current = true;
      setHasInk(true);
    };

    const stop = () => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      if (inkRef.current) onChange(canvas.toDataURL('image/png'));
    };

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', stop);
    canvas.addEventListener('mouseleave', stop);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', stop);

    return () => {
      canvas.removeEventListener('mousedown', start);
      canvas.removeEventListener('mousemove', move);
      canvas.removeEventListener('mouseup', stop);
      canvas.removeEventListener('mouseleave', stop);
      canvas.removeEventListener('touchstart', start);
      canvas.removeEventListener('touchmove', move);
      canvas.removeEventListener('touchend', stop);
    };
  }, [disabled, height, onChange, value]);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    inkRef.current = false;
    setHasInk(false);
    setError('');
    onChange('');
  };

  return (
    <div className="inspection-field inspection-field-full">
      <span className="inspection-field-label">{label}</span>
      <p className="inspection-field-hint">Sign using a mouse, finger, or stylus.</p>
      <div className="signature-pad">
        <canvas
          ref={canvasRef}
          className="signature-canvas"
          style={{ height: `${height}px` }}
          aria-label={`${label} signature pad`}
          role="img"
        />
        {!hasInk && !value && <span className="signature-placeholder">Sign here</span>}
      </div>
      {error && <p className="inspection-field-error">{error}</p>}
      <div className="signature-actions">
        <button type="button" className="btn btn-secondary btn-sm" onClick={clear} disabled={disabled}>
          Clear signature
        </button>
        {value && (
          <span className="signature-saved">
            <i className="fa fa-circle-check" aria-hidden="true" /> Signature captured
          </span>
        )}
      </div>
    </div>
  );
}
