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
  deps: string[] | undefined = undefined
) {
  const previous = React.useRef<number | undefined>(undefined);
  const [values, setValues] = React.useState(
    deps?.map((dep) => (test ? (test as any)[dep] : undefined))
  );

  useSelector((state: RootState) => {
    if (test && updateNotify && !deps) {
      return state.uitgd.testState.notifyChanged[test.nodeID];
    }
    if (test && updateNotify && deps && values) {
      if (
        previous.current !== state.uitgd.testState.notifyChanged[test.nodeID]
      ) {
        previous.current = state.uitgd.testState.notifyChanged[test.nodeID];
        let i = 0;
        for (const value of values) {
          if (value !== (test as any)[deps[i]]) {
            setValues(deps.map((dep) => (test as any)[dep]));
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
    }, [test]),
    updateOnly: React.useCallback(() => {
      if (test) dispatch(testUpdateNotify(test));
    }, [test])
  };
}
