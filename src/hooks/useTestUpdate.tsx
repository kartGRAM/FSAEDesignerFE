import * as React from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {
  saveTestLocalState,
  testUpdateNotify
} from '@store/reducers/uiTempGeometryDesigner';
import {ITest} from '@gd/analysis/ITest';
import {RootState} from '@store/store';

export default function useTestUpdate(
  test: ITest | undefined,
  updateNotify = true,
  deps: string[] | undefined = undefined,
  solverDeps: string[] | undefined = undefined
) {
  const previous = React.useRef<number | undefined>(undefined);
  const [values, setValues] = React.useState([
    ...(deps?.map((dep) => (test ? (test as any)[dep] : undefined)) ?? []),
    ...(solverDeps?.map((dep) =>
      test ? (test.solver as any)[dep] : undefined
    ) ?? [])
  ]);

  useSelector((state: RootState) => {
    if (test && updateNotify && !(deps || solverDeps)) {
      return state.uitgd.testState.notifyChanged[test.nodeID];
    }
    if (test && updateNotify && (deps || solverDeps) && values.length) {
      if (
        previous.current !== state.uitgd.testState.notifyChanged[test.nodeID]
      ) {
        previous.current = state.uitgd.testState.notifyChanged[test.nodeID];
        let i = 0;
        for (const value of values) {
          let comp: any;
          if (deps && i < deps.length) comp = (test as any)[deps[i]];
          if (solverDeps && !deps) comp = (test.solver as any)[solverDeps[i]];
          if (deps && solverDeps && i >= deps.length)
            comp = (test.solver as any)[solverDeps[i - deps.length]];
          if (value !== comp) {
            setValues([
              ...(deps?.map((dep) => (test as any)[dep]) ?? []),
              ...(solverDeps?.map((dep) => (test.solver as any)[dep]) ?? [])
            ]);
            break;
          }
          ++i;
        }
      }
    }
    return null;
  });

  const dispatch = useDispatch();
  return {
    updateWithSave: React.useCallback(() => {
      if (test) dispatch(saveTestLocalState(test));
    }, [dispatch, test]),
    updateOnly: React.useCallback(() => {
      if (test) dispatch(testUpdateNotify(test));
    }, [dispatch, test])
  };
}
