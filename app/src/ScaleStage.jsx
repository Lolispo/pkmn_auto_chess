import React, { useLayoutEffect, useRef, useState } from 'react';

// The game UI is a fixed-pixel canvas designed for roughly this size. Instead of a
// responsive rewrite, we scale the whole canvas to fit the viewport — the same effect
// as manually setting browser zoom, but automatic. Tune these two numbers to taste.
const DESIGN_W = 1920;
const DESIGN_H = 1080;

export default function ScaleStage({ children }) {
  const [scale, setScale] = useState(1);
  const outerRef = useRef(null);

  useLayoutEffect(() => {
    const recompute = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Fit the whole canvas within the viewport (letterbox rather than crop).
      setScale(Math.min(vw / DESIGN_W, vh / DESIGN_H));
    };
    recompute();
    window.addEventListener('resize', recompute);
    return () => window.removeEventListener('resize', recompute);
  }, []);

  return (
    <div
      ref={outerRef}
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        background: 'rgb(33, 33, 33)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          width: DESIGN_W,
          height: DESIGN_H,
          flex: '0 0 auto',
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
        }}
      >
        {children}
      </div>
    </div>
  );
}
