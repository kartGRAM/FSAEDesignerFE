import {useFrame} from '@react-three/fiber';
import {useSelector} from 'react-redux';
import {useKeyboardControls} from '@react-three/drei';
import {getControl} from '@gd/controls/Controls';
import {Control} from '@gd/controls/IControls';
import {RootState} from '@store/store';

export const KeyboardControls = () => {
  const [, get] = useKeyboardControls<string>();

  const assemblyMode = useSelector(
    (state: RootState) => state.dgd.present.options.assemblyMode
  );
  const controlsList = useSelector(
    (state: RootState) => state.dgd.present.controls
  )
    .filter(
      (c) =>
        c.type === 'keyboard' &&
        (c.configuration ?? 'FixedFrame') === assemblyMode
    )
    .reduce((prev, current) => {
      if (!prev[`controls:${current.inputButton}`])
        prev[`controls:${current.inputButton}`] = [];
      prev[`controls:${current.inputButton}`].push(getControl(current));
      return prev;
    }, {} as {[index: string]: Control[]});

  const solver = useSelector(
    (state: RootState) => state.uitgd.KinematicsSolver
  );
  const fixSpringDumperDuaringControl = useSelector(
    (state: RootState) =>
      state.dgd.present.options.fixSpringDumperDuaringControl
  );

  const time = {value: 0};

  useFrame((threeState, delta) => {
    if (!solver) return;
    if (solver.running) return;
    const state = get() as {[index: string]: boolean};
    const rollbackParams: {control: Control; value: unknown}[] = [];
    Object.keys(state).forEach((key) => {
      if (!state[key]) return;
      const controls = controlsList[key];
      if (!controls) return;
      const snapshot = solver.getSnapshot();
      controls.forEach((control) => {
        rollbackParams.push({
          control,
          value: control.preprocess(delta, solver)
        });
      });
      time.value += delta;
      if (!rollbackParams.length) return;
      try {
        solver.solve({
          constraintsOptions: {
            fixSpringDumpersAtCurrentPositions: fixSpringDumperDuaringControl,
            disableSpringElasticity: false
          },
          logOutput: true
        });
      } catch (e: any) {
        try {
          solver.restoreState(snapshot);
          rollbackParams.forEach(({control, value}) =>
            control.rollback(value, solver)
          );
          solver.solve({
            constraintsOptions: {
              fixSpringDumpersAtCurrentPositions: fixSpringDumperDuaringControl,
              disableSpringElasticity: false
            },
            logOutput: true
          });
        } catch (e: any) {
          // eslint-disable-next-line no-console
          console.log(e);
        }
      }
    });
  });
  return null;
};
