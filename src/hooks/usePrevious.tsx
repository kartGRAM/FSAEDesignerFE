import {useRef} from 'react';

export default function usePrevious<T>(value: T, initial?: T) {
  const ref = useRef<T>(initial ?? value);
  const ret = ref.current;
  ref.current = value;
  return ret;
}
