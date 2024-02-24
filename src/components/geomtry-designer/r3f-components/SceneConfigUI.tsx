import * as React from 'react';
import {Leva, useControls} from 'leva';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {
  setGroundGridShow,
  setGDSceneGridSize,
  setGDSceneShowOBBs,
  setGDSceneSkidpadViewerState,
  setGDSceneGridSegmentLength,
  setGDSceneForceViewerState,
  initialForceViewerState
} from '@store/reducers/uiGeometryDesigner';
import {isSkidpadSolver} from '@gd/kinematics/SkidpadSolver';
import {isForceSolver, IForceSolver} from '@gd/kinematics/ISolver';

export const SceneConfigUI = () => {
  const dispatch = useDispatch();

  const showGrids = useSelector(
    (state: RootState) => state.uigd.present.gdSceneState.showGroundPlaneGrid
  );
  const gridSize = useSelector(
    (state: RootState) => state.uigd.present.gdSceneState.gridSize
  );
  const segmentLength = useSelector(
    (state: RootState) => state.uigd.present.gdSceneState.gridSegmentLength
  );
  const showOBB = useSelector(
    (state: RootState) => state.uigd.present.gdSceneState.showOBB
  );

  useControls(
    'Grid',
    () => ({
      'Show grids': {
        value: !!showGrids,
        onChange: (c: boolean) => {
          dispatch(setGroundGridShow(c));
        }
      },
      'Grid size': {
        value: gridSize ?? 5000,
        min: 0,
        max: 50000,
        step: 10,
        onChange: (c: number) => {
          dispatch(setGDSceneGridSize(c));
        }
      },
      'Grid segment length': {
        value: segmentLength ?? 200,
        min: 0,
        max: 1000,
        step: 5,
        onChange: (c: number) => {
          dispatch(setGDSceneGridSegmentLength(c));
        }
      }
    }),
    {collapsed: true}
  );

  useControls(
    'Advanced',
    () => ({
      'Show OBBs': {
        value: !!showOBB,
        onChange: (c: boolean) => {
          dispatch(setGDSceneShowOBBs(c));
        }
      }
    }),
    {collapsed: true}
  );

  const solver = useSelector((state: RootState) => state.uitgd.solver);

  return (
    <>
      <Leva fill />
      {solver && isSkidpadSolver(solver) ? <SkidpadConfigUI /> : null}
      {solver && isForceSolver(solver) ? <ForceConfigUI /> : null}
    </>
  );
};

const SkidpadConfigUI = () => {
  const dispatch = useDispatch();

  const config = useSelector(
    (state: RootState) =>
      state.uigd.present.gdSceneState.steadySkidpadViewerState
  );
  const configRef = React.useRef(config);
  configRef.current = config;

  useControls(
    'Skidpad View',
    () => ({
      'Show lap time': {
        value: !!config.showLapTime,
        onChange: (c: boolean) => {
          dispatch(
            setGDSceneSkidpadViewerState({
              ...configRef.current,
              showLapTime: c
            })
          );
        }
      },
      'Show velocity': {
        value: !!config.showVelocity,
        onChange: (c: boolean) => {
          dispatch(
            setGDSceneSkidpadViewerState({
              ...configRef.current,
              showVelocity: c
            })
          );
        }
      },
      'Show omega': {
        value: !!config.showOmega,
        onChange: (c: boolean) => {
          dispatch(
            setGDSceneSkidpadViewerState({...configRef.current, showOmega: c})
          );
        }
      },
      'Show center radius': {
        value: !!config.showCenterRadius,
        onChange: (c: boolean) => {
          dispatch(
            setGDSceneSkidpadViewerState({
              ...configRef.current,
              showCenterRadius: c
            })
          );
        }
      },
      'Show inner radius': {
        value: !!config.showInnerRadius,
        onChange: (c: boolean) => {
          dispatch(
            setGDSceneSkidpadViewerState({
              ...configRef.current,
              showInnerRadius: c
            })
          );
        }
      },
      'Show start line': {
        value: !!config.showStartLine,
        onChange: (c: boolean) => {
          dispatch(
            setGDSceneSkidpadViewerState({
              ...configRef.current,
              showStartLine: c
            })
          );
        }
      },
      'Show center line': {
        value: !!config.showCenterLine,
        onChange: (c: boolean) => {
          dispatch(
            setGDSceneSkidpadViewerState({
              ...configRef.current,
              showCenterLine: c
            })
          );
        }
      },
      'Show inner line': {
        value: !!config.showInnerLine,
        onChange: (c: boolean) => {
          dispatch(
            setGDSceneSkidpadViewerState({
              ...configRef.current,
              showInnerLine: c
            })
          );
        }
      },
      'Show outer line': {
        value: !!config.showOuterLine,
        onChange: (c: boolean) => {
          dispatch(
            setGDSceneSkidpadViewerState({
              ...configRef.current,
              showOuterLine: c
            })
          );
        }
      },
      'Show inner cones': {
        value: !!config.showInnerCones,
        onChange: (c: boolean) => {
          dispatch(
            setGDSceneSkidpadViewerState({
              ...configRef.current,
              showInnerCones: c
            })
          );
        }
      },
      'Cone Interval': {
        value: config.coneInterval,
        min: 0.5,
        max: 20,
        step: 0.5,
        onChange: (c: number) => {
          dispatch(
            setGDSceneSkidpadViewerState({
              ...configRef.current,
              coneInterval: c
            })
          );
        }
      },
      'Road Width': {
        value: config.roadWidth,
        min: 0,
        max: 30,
        step: 0.5,
        onChange: (c: number) => {
          dispatch(
            setGDSceneSkidpadViewerState({...configRef.current, roadWidth: c})
          );
        }
      }
    }),
    {collapsed: true}
  );
  return null;
};

const ForceConfigUI = () => {
  const dispatch = useDispatch();

  const config = useSelector(
    (state: RootState) =>
      state.uigd.present.gdSceneState.forceViewerState ??
      initialForceViewerState
  );
  const configRef = React.useRef(config);
  configRef.current = config;

  const solver = useSelector(
    (state: RootState) => state.uitgd.solver
  ) as IForceSolver;

  useControls(
    'Force View',
    () => ({
      'Show colorbar': {
        value: !!config.showColorBar,
        onChange: (c: boolean) => {
          dispatch(
            setGDSceneForceViewerState({
              ...configRef.current,
              showColorBar: c
            })
          );
        }
      },
      'Colorbar value max': {
        value: solver.stdForce,
        min: 1,
        max: 100000,
        step: 1,
        onChange: (c: number) => {
          solver.stdForce = c;
        }
      },
      'Show parent name': {
        value: !!config.showParentName,
        onChange: (c: boolean) => {
          dispatch(
            setGDSceneForceViewerState({
              ...configRef.current,
              showParentName: c
            })
          );
        }
      },
      'Show magnitude': {
        value: !!config.showMagnitude,
        onChange: (c: boolean) => {
          dispatch(
            setGDSceneForceViewerState({
              ...configRef.current,
              showMagnitude: c
            })
          );
        }
      },
      'Show local xyz': {
        value: !!config.showLocalXYZ,
        onChange: (c: boolean) => {
          dispatch(
            setGDSceneForceViewerState({
              ...configRef.current,
              showLocalXYZ: c
            })
          );
        }
      },
      'Show global xyz': {
        value: !!config.showGlobalXYZ,
        onChange: (c: boolean) => {
          dispatch(
            setGDSceneForceViewerState({
              ...configRef.current,
              showGlobalXYZ: c
            })
          );
        }
      },
      'Show inertia force': {
        value: !!config.showInertiaForce,
        onChange: (c: boolean) => {
          dispatch(
            setGDSceneForceViewerState({
              ...configRef.current,
              showInertiaForce: c
            })
          );
        }
      },
      'Show tire friction': {
        value: !!config.showTireFriction,
        onChange: (c: boolean) => {
          dispatch(
            setGDSceneForceViewerState({
              ...configRef.current,
              showTireFriction: c
            })
          );
        }
      },
      'Show bearing force': {
        value: !!config.showBearingForce,
        onChange: (c: boolean) => {
          dispatch(
            setGDSceneForceViewerState({
              ...configRef.current,
              showBearingForce: c
            })
          );
        }
      },
      'Show bar force': {
        value: !!config.showBarForce,
        onChange: (c: boolean) => {
          dispatch(
            setGDSceneForceViewerState({
              ...configRef.current,
              showBarForce: c
            })
          );
        }
      },
      'Show spring force': {
        value: !!config.showSpringForce,
        onChange: (c: boolean) => {
          dispatch(
            setGDSceneForceViewerState({
              ...configRef.current,
              showSpringForce: c
            })
          );
        }
      },
      'Show torsion spring force': {
        value: !!config.showTorsionSpringForce,
        onChange: (c: boolean) => {
          dispatch(
            setGDSceneForceViewerState({
              ...configRef.current,
              showTorsionSpringForce: c
            })
          );
        }
      },
      'Show linear bushing force': {
        value: !!config.showLinearBushingForce,
        onChange: (c: boolean) => {
          dispatch(
            setGDSceneForceViewerState({
              ...configRef.current,
              showLinearBushingForce: c
            })
          );
        }
      },
      'Show aarm force': {
        value: !!config.showAArmForce,
        onChange: (c: boolean) => {
          dispatch(
            setGDSceneForceViewerState({
              ...configRef.current,
              showAArmForce: c
            })
          );
        }
      },
      'Show bellcrank force': {
        value: !!config.showBellCrankForce,
        onChange: (c: boolean) => {
          dispatch(
            setGDSceneForceViewerState({
              ...configRef.current,
              showBellCrankForce: c
            })
          );
        }
      },

      'Show body force': {
        value: !!config.showBodyForce,
        onChange: (c: boolean) => {
          dispatch(
            setGDSceneForceViewerState({
              ...configRef.current,
              showBodyForce: c
            })
          );
        }
      }
    }),
    {collapsed: true},
    [solver.stdForce]
  );
  return null;
};
