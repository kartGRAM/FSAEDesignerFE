import React from 'react';
import {useSelector, useDispatch} from 'react-redux';
import store, {RootState} from '@store/store';
import {
  setAssemblyAndCollectedAssembly,
  setKinematicSolver,
  setAssembled
} from '@store/reducers/uiTempGeometryDesigner';
// import {getKinematicConstrainedElements} from '@gd/KinematicFunctions';
import {KinematicSolver} from '@gd/kinematics/Solver';

import {getAssembly} from '@gd/Elements';

export default function AssemblyCreactor() {
  const dispatch = useDispatch();
  const assembly = useSelector(
    (state: RootState) => state.dgd.present.topAssembly
  );
  const assembled = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.assembled
  );

  // アセンブリデータに変更があった場合に実行
  React.useEffect(() => {
    const start = performance.now();
    if (assembly) {
      const iAssembly = getAssembly(assembly);
      dispatch(
        setAssemblyAndCollectedAssembly({
          assembly: iAssembly,
          collectedAssembly: iAssembly.collectElements()
        })
      );
    } else {
      dispatch(setAssemblyAndCollectedAssembly(undefined));
    }
    // 実行時間を計測した処理
    const end = performance.now();
    // eslint-disable-next-line no-console
    console.log((end - start).toFixed(1));
  }, [assembly]);

  // assembledに変化があった場合に実行
  React.useEffect(() => {
    if (assembled) {
      const assembly = store.getState().uitgd.collectedAssembly;
      if (assembly) {
        try {
          // getKinematicConstrainedElements(assembly);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const solver = new KinematicSolver(assembly);
          dispatch(setKinematicSolver(solver));
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log(e);
          dispatch(setAssembled(false));
        }
      }
      return;
    }
    dispatch(setKinematicSolver(undefined));

    // else not assembled
    const {assembly} = store.getState().uitgd;
    // resetPositions
    assembly?.arrange();
  }, [assembled, assembly]);

  return null;
}
