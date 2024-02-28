/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import {useSelector, useDispatch} from 'react-redux';
import store, {RootState} from '@store/store';
import {
  setAssemblyAndCollectedAssembly,
  setSolver,
  setAssembled,
  setDatumManager,
  setMeasureToolsManager,
  setROVariablesManager
} from '@store/reducers/uiTempGeometryDesigner';
// import {getKinematicConstrainedElements} from '@gd/KinematicFunctions';
import {KinematicsSolver} from '@gd/kinematics/KinematicsSolver';
import {SkidpadSolver} from '@gd/kinematics/SkidpadSolver';
import {getControl} from '@gd/controls/Controls';
import {Control} from '@gd/controls/IControls';
import {DatumManager} from '@gd/measure/datum/DatumManager';
import {MeasureToolsManager} from '@gd/measure/measureTools/MeasureToolsManager';
import {ROVariablesManager} from '@gd/measure/readonlyVariables/ROVariablesManager';
import {getAssembly} from '@gd/Elements';
import {isMovingElement} from '@gd/IElements';
import useUpdateEffect from '@hooks/useUpdateEffect';
import usePrevious from '@hooks/usePrevious';

export default function AssemblyCreactor() {
  const dispatch = useDispatch();
  const assembly = useSelector(
    (state: RootState) => state.dgd.present.topAssembly
  );

  const sameAssembly = usePrevious(assembly) === assembly;

  const datumObjects = useSelector(
    (state: RootState) => state.dgd.present.datumObjects
  );

  const sameDatumObjects = usePrevious(datumObjects) === datumObjects;

  const measureTools = useSelector(
    (state: RootState) => state.dgd.present.measureTools
  );

  const sameMeasureTools = usePrevious(measureTools) === measureTools;

  const readonlyVariables = useSelector(
    (state: RootState) => state.dgd.present.readonlyVariables
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
        collectedAssembly.children.filter((e) => isMovingElement(e)) as any[],
        state.measureTools
      );
      const roVariablesManager = new ROVariablesManager({
        assembly: iAssembly,
        measureToolsManager,
        data: state.readonlyVariables
      });
      roVariablesManager.update();
      dispatch(
        setAssemblyAndCollectedAssembly({
          assembly: iAssembly,
          collectedAssembly,
          datumManager,
          measureToolsManager,
          roVariablesManager
        })
      );
    } else {
      dispatch(setAssemblyAndCollectedAssembly(undefined));
    }
    // 実行時間を計測した処理
    const end = performance.now();
    // eslint-disable-next-line no-console
    console.log((end - start).toFixed(1));
  }, [assembly, dispatch]);

  useUpdateEffect(
    () => {
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
          state.uitgd.collectedAssembly!.children.filter((e) =>
            isMovingElement(e)
          ) as any[],
          state.dgd.present.measureTools
        );
        const roVariablesManager = new ROVariablesManager({
          assembly: state.uitgd.assembly!,
          measureToolsManager,
          data: state.dgd.present.readonlyVariables
        });
        roVariablesManager.update();
        dispatch(
          setDatumManager({
            datumManager,
            measureToolsManager,
            roVariablesManager
          })
        );
        // 実行時間を計測した処理
        const end = performance.now();
        // eslint-disable-next-line no-console
        console.log((end - start).toFixed(1));
      }
    },
    [datumObjects],
    !sameAssembly
  );

  useUpdateEffect(
    () => {
      if (measureTools) {
        const start = performance.now();
        // 依存変数入れていないので、現在の値を取得
        const state = store.getState();
        const measureToolsManager = new MeasureToolsManager(
          state.uitgd.datumManager!,
          state.uitgd.collectedAssembly!.children.filter((e) =>
            isMovingElement(e)
          ) as any[],
          measureTools
        );
        const roVariablesManager = new ROVariablesManager({
          assembly: state.uitgd.assembly!,
          measureToolsManager,
          data: state.dgd.present.readonlyVariables
        });
        roVariablesManager.update();
        dispatch(
          setMeasureToolsManager({
            measureToolsManager,
            roVariablesManager
          })
        );
        // 実行時間を計測した処理
        const end = performance.now();
        // eslint-disable-next-line no-console
        console.log((end - start).toFixed(1));
      }
    },
    [measureTools],
    !sameAssembly || !sameDatumObjects
  );

  useUpdateEffect(
    () => {
      if (readonlyVariables) {
        const start = performance.now();
        // 依存変数入れていないので、現在の値を取得
        const state = store.getState();
        const roVariablesManager = new ROVariablesManager({
          assembly: state.uitgd.assembly!,
          measureToolsManager: state.uitgd.measureToolsManager!,
          data: state.dgd.present.readonlyVariables
        });
        roVariablesManager.update();
        dispatch(
          setROVariablesManager({
            roVariablesManager
          })
        );
        // 実行時間を計測した処理
        const end = performance.now();
        // eslint-disable-next-line no-console
        console.log((end - start).toFixed(1));
      }
    },
    [readonlyVariables],
    !sameAssembly || !sameDatumObjects || !sameMeasureTools
  );

  // assembledに変化があった場合に実行
  useUpdateEffect(() => {
    if (assembled) {
      const state = store.getState();

      const assembly = state.uitgd.collectedAssembly;
      const {assemblyMode, pinCenterOfGravityOfFrame} =
        state.dgd.present.options;
      const childrenIDs = assembly?.children.map((child) => child.nodeID);
      const controls = state.dgd.present.controls.reduce((prev, current) => {
        const config = current.configuration ?? 'FixedFrame';
        if (assemblyMode !== config) return prev;
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
          const solver = new KinematicsSolver(
            assembly,
            assemblyMode,
            pinCenterOfGravityOfFrame,
            pinCenterOfGravityOfFrame,
            controls,
            0.001,
            true
          );
          dispatch(setSolver(solver));
          /* const params = state.uitgd.tests[2].steadySkidpadParams;
          if (params) {
            const solver = new SkidpadSolver(
              assembly,
              params,
              controls,
              0.001,
              1,
              true
            );
            dispatch(setSolver(solver));
          } */
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
    dispatch(setSolver(undefined));

    // else not assembled
    const {collectedAssembly} = store.getState().uitgd;
    // resetPositions& set dlCurrent to 0
    collectedAssembly?.arrange();
  }, [assembled, assembly]);

  return null;
}
