import * as React from 'react';
import {Leva, useControls} from 'leva';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '@store/store';

export const SceneConfigUI = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const dispatch = useDispatch();

  const gridSize = useSelector(
    (state: RootState) => state.uigd.present.gdSceneState.gridSize
  );
  useControls(() => ({
    number: {
      value: gridSize ?? 5000,
      min: 0,
      max: 100000,
      step: 10
    }
  }));
  return <Leva />;
};
