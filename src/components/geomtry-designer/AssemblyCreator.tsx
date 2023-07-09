import React from 'react';
import {useSelector, useDispatch} from 'react-redux';
import store, {RootState} from '@store/store';
import {
  setAssemblyAndCollectedAssembly,
  setKinematicSolver,
  setAssembled,
  setDatumManager,
  setMeasureToolsManager
} from '@store/reducers/uiTempGeometryDesigner';
// import {getKinematicConstrainedElements} from '@gd/KinematicFunctions';
import {KinematicSolver} from '@gd/kinematics/Solver';
import {getControl} from '@gd/controls/Controls';
import {Control} from '@gd/controls/IControls';
import {DatumManager} from '@gd/measure/DatumManager';
import {MeasureToolsManager} from '@gd/measure/MeasureToolsManager';

import {getAssembly} from '@gd/Elements';

export default function AssemblyCreactor() {
  const dispatch = useDispatch();
  const assembly = useSelector(
    (state: RootState) => state.dgd.present.topAssembly
  );

  const datumObjects = useSelector(
    (state: RootState) => state.dgd.present.datumObjects
  );

  const measureTools = useSelector(
    (state: RootState) => state.dgd.present.measureTools
  );

  const assembled = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.assembled
  );

  // アセンブリデータに変更があった場合に実行
  React.useEffect(() => {
    const start = performance.now();
    if (assembly) {
      // 依存変数に入れてないので、現在の値を取得する
      const state = store.getState().dgd.present;
      const iAssembly = getAssembly(assembly);
      const collectedAssembly = iAssembly.collectElements();
      const datumManager = new DatumManager(
        state.datumObjects,
        collectedAssembly
      );
      datumManager.update();
      const measureToolsManager = new MeasureToolsManager(
        datumManager,
        state.measureTools
      );
      dispatch(
        setAssemblyAndCollectedAssembly({
          assembly: iAssembly,
          collectedAssembly,
          datumManager,
          measureToolsManager
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

  React.useEffect(() => {
    if (datumObjects) {
      const start = performance.now();
      // 依存変数入れていないので、現在の値を取得
      const state = store.getState();
      // datumObjectsがあれば必ずcollectedAssemblyはある。
      const datumManager = new DatumManager(
        datumObjects,
        state.uitgd.collectedAssembly!
      );
      datumManager.update();
      const measureToolsManager = new MeasureToolsManager(
        datumManager,
        state.dgd.present.measureTools
      );
      dispatch(
        setDatumManager({
          datumManager,
          measureToolsManager
        })
      );
      // 実行時間を計測した処理
      const end = performance.now();
      // eslint-disable-next-line no-console
      console.log((end - start).toFixed(1));
    }
  }, [datumObjects]);

  React.useEffect(() => {
    if (measureTools) {
      const start = performance.now();
      // 依存変数入れていないので、現在の値を取得
      const state = store.getState().uitgd;
      const measureToolsManager = new MeasureToolsManager(
        state.datumManager!,
        measureTools
      );
      dispatch(
        setMeasureToolsManager({
          measureToolsManager
        })
      );
      // 実行時間を計測した処理
      const end = performance.now();
      // eslint-disable-next-line no-console
      console.log((end - start).toFixed(1));
    }
  }, [measureTools]);

  // assembledに変化があった場合に実行
  React.useEffect(() => {
    if (assembled) {
      const state = store.getState();

      const assembly = state.uitgd.collectedAssembly;
      const childrenIDs = assembly?.children.map((child) => child.nodeID);
      const controls = state.dgd.present.controls.reduce((prev, current) => {
        const control = getControl(current);
        current.targetElements
          .filter((element) => childrenIDs?.includes(element))
          .forEach((element) => {
            if (!prev[element]) prev[element] = [];
            prev[element].push(control);
          });
        return prev;
      }, {} as {[index: string]: Control[]});
      if (assembly) {
        try {
          const solver = new KinematicSolver(assembly, controls);
          dispatch(setKinematicSolver(solver));
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log(e);
          dispatch(setAssembled(false));
        }
      } else {
        dispatch(setAssembled(false));
      }
      return;
    }
    dispatch(setKinematicSolver(undefined));

    // else not assembled
    const {assembly} = store.getState().uitgd;
    // resetPositions& set dlCurrent to 0
    assembly?.arrange();
  }, [assembled, assembly]);

  return null;
}
