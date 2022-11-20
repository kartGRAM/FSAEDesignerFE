import {useRef, useEffect} from 'react';

type DependencyList = ReadonlyArray<unknown>;
type Destructor = () => void;
type EffectCallback = () => void | Destructor;
export default function useDidUpdateEffect(
  effect: EffectCallback,
  deps?: DependencyList
) {
  const didMountRef = useRef(false);

  useEffect(() => {
    if (didMountRef.current) {
      return effect();
    }
    didMountRef.current = true;
    return undefined;
  }, deps);
}
