import React, { useLayoutEffect, useRef, useState } from 'react';

// The game UI is a fixed-pixel canvas. We scale the whole canvas to fit the viewport —
// the same effect as manual browser zoom, but automatic. Only the RATIO matters for how
// much screen gets used: it should match the game's real proportions (~16:10) so there's
// no wasted canvas on the right. Absolute size just needs to be >= the game's intrinsic
// size so nothing clips. Tune to taste.
const DESIGN_W = 1600;
const DESIGN_H = 1000;

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
        overflow: 'hidden', // content is scaled to fit, so nothing visible is clipped; this
                            // trims the transform's leftover layout box (no phantom scroll)
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
