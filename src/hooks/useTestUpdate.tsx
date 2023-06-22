import {useSelector, useDispatch} from 'react-redux';
import {
  saveTestLocalState,
  testUpdateNotify
} from '@store/reducers/uiTempGeometryDesigner';
import {ITest} from '@gd/analysis/ITest';
import {RootState} from '@store/store';

export default function useTestUpdate(test: ITest | undefined) {
  useSelector(
    (state: RootState) =>
      state.uitgd.testState.notifyChanged[test?.nodeID ?? '']
  );
  const dispatch = useDispatch();
  return {
    updateWithSave: () => {
      if (test) dispatch(saveTestLocalState(test));
    },
    updateOnly: () => {
      if (test) dispatch(testUpdateNotify(test));
    }
  };
}