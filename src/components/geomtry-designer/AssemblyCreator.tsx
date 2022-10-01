/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import {useSelector, useDispatch} from 'react-redux';
import store, {RootState} from '@store/store';
import {
  setAssembly,
  setCollectedAssembly
} from '@store/reducers/uiTempGeometryDesigner';
import {IAssembly} from '@gd/IElements';
import * as math from 'mathjs';

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
      dispatch(setAssembly(iAssembly));
      dispatch(setCollectedAssembly(iAssembly.collectElements()));
    } else {
      dispatch(setAssembly(undefined));
      dispatch(setCollectedAssembly(undefined));
    }
    // 実行時間を計測した処理
    const end = performance.now();
    // eslint-disable-next-line no-console
    console.log(end - start);
  }, [assembly]);

  React.useEffect(() => {
    if (assembled) return;
    const start = performance.now();
    const assembly = store.getState().dgd.present.topAssembly;
    if (!assembled && assembly) {
      const iAssembly = getAssembly(assembly);
      dispatch(setAssembly(iAssembly));
      dispatch(setCollectedAssembly(iAssembly.collectElements()));
    }
    // 実行時間を計測した処理
    const end = performance.now();
    // eslint-disable-next-line no-console
    console.log(end - start);
  }, [assembled]);

  return null;
}

// 拘束式のヤコビアンを求める
export function getKinematicJacobianMatrix(assembly: IAssembly): math.Matrix {
  const {joints} = assembly;
  const {children} = assembly;
  const numConstrainsByJoint = joints.length * 3;
  const eulerParameterConstrains = children.length;
  let numConstrains = numConstrainsByJoint + eulerParameterConstrains;

  const {assemblyMode} = store.getState().uigd.present.gdSceneState;
  if (assemblyMode === 'FixedFrame') {
    numConstrains += 6;
  }
  const numGeneralizedCoordinates = children.length * 7; // OKオイラーパラメータ4+XYZ

  const matrix = math.zeros([
    numConstrains,
    numGeneralizedCoordinates
  ]) as math.Matrix;

  joints.forEach((joint) => {});

  return matrix;
}
