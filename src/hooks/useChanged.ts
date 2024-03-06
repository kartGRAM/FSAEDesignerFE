import {useRef, useEffect} from 'react';

export function useChanged<T>(value: T, trigerOnMount: boolean) {
  const ref = useRef<T>(value);
  const onMount = useRef(true);

  useEffect(() => {
    onMount.current = false;
    return () => {
      onMount.current = true;
    };
  }, []);

  const ret = ref.current;
  ref.current = value;

  if (trigerOnMount && onMount.current) return true;

  return ret !== value;
}

export default useChanged;
