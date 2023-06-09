import {useFrame} from '@react-three/fiber';
import {useSelector} from 'react-redux';
import {useKeyboardControls} from '@react-three/drei';
import {getControl} from '@gd/controls/Controls';
import {Control} from '@gd/controls/IControls';
import {RootState} from '@store/store';

export const KeyboardControls = () => {
  const [, get] = useKeyboardControls<string>();

  const controlsList = useSelector(
    (state: RootState) => state.dgd.present.controls
  )
    .filter((c) => c.type === 'keyboard')
    .reduce((prev, current) => {
      if (!prev[`controls:${current.inputButton}`])
        prev[`controls:${current.inputButton}`] = [];
      prev[`controls:${current.inputButton}`].push(getControl(current));
      return prev;
    }, {} as {[index: string]: Control[]});

  const solver = useSelector((state: RootState) => state.uitgd.kinematicSolver);
  const fixSpringDumperDuaringControl = useSelector(
    (state: RootState) =>
      state.uigd.present.gdSceneState.fixSpringDumperDuaringControl
  );

  const time = {value: 0};

  useFrame((threeState, delta) => {
    if (!solver) return;
    if (solver.running) return;
    const state = get() as {[index: string]: boolean};
    const needToUpdate = {value: false};
    Object.keys(state).forEach((key) => {
      if (!state[key]) return;
      needToUpdate.value = true;
      const controls = controlsList[key];
      controls.forEach((control) => control.preprocess(delta, solver));
    });
    time.value += delta;
    if (!needToUpdate.value) return;
    solver.solve({
      constraintsOptions: {
        fixSpringDumpersAtCurrentPositions: fixSpringDumperDuaringControl
      }
    });
  });

  return null;
};
