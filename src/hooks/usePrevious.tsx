import {useEffect, useRef} from 'react';

export default function usePrevious<T>(value: T, initial: T) {
  const ref = useRef<T>(initial);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}
