import {useRef, useEffect} from 'react';

type DependencyList = ReadonlyArray<unknown>;
type Destructor = () => void;
type EffectCallback = () => void | Destructor;
export default function useDidUpdateEffect(
  effect: EffectCallback,
  deps?: DependencyList,
  ignoreFlag?: boolean
) {
  const didMountRef = useRef(false);

  useEffect(() => {
    if (ignoreFlag) {
      return undefined;
    }
    if (didMountRef.current) {
      return effect();
    }
    didMountRef.current = true;
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
