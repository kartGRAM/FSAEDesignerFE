import * as React from 'react';

export function useAnimationFrame(callback: () => void) {
  const reqIdRef = React.useRef<number>(-1);
  const loop = React.useCallback(() => {
    reqIdRef.current = requestAnimationFrame(loop);
    callback();
  }, [callback]);

  React.useEffect(() => {
    reqIdRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqIdRef.current);
  }, [loop]);
}
