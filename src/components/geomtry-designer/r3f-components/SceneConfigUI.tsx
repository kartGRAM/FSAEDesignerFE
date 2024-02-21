import * as React from 'react';
import {Leva, useControls} from 'leva';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {
  setGroundGridShow,
  setGDSceneGridSize,
  setGDSceneShowOBBs,
  setGDSceneSkidpadViewerState,
  initialSteadySkidpadViewerState,
  setGDSceneGridSegmentLength
} from '@store/reducers/uiGeometryDesigner';
import {isSkidpadSolver} from '@gd/kinematics/SkidpadSolver';

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

  useControls('Grid', () => ({
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
  }));

  useControls('Advanced', () => ({
    'Show OBBs': {
      value: !!showOBB,
      onChange: (c: boolean) => {
        dispatch(setGDSceneShowOBBs(c));
      }
    }
  }));

  const solver = useSelector(
    (state: RootState) => state.uitgd.KinematicsSolver
  );

  return (
    <>
      <Leva />
      {solver && isSkidpadSolver(solver) ? <SkidpadConfigUI /> : null}
    </>
  );
};

const SkidpadConfigUI = () => {
  const dispatch = useDispatch();

  const config = useSelector(
    (state: RootState) =>
      state.uigd.present.gdSceneState.steadySkidpadViewerState ??
      initialSteadySkidpadViewerState
  );

  useControls('Skidpad View', () => ({
    'Show lap time': {
      value: config.showLapTime,
      onChange: (c: boolean) => {
        dispatch(setGDSceneSkidpadViewerState({...config, showLapTime: c}));
      }
    },
    'Show velocity': {
      value: config.showVelocity,
      onChange: (c: boolean) => {
        dispatch(setGDSceneSkidpadViewerState({...config, showVelocity: c}));
      }
    },
    'Show omega': {
      value: config.showOmega,
      onChange: (c: boolean) => {
        dispatch(setGDSceneSkidpadViewerState({...config, showOmega: c}));
      }
    },
    'Show center radius': {
      value: config.showCenterRadius,
      onChange: (c: boolean) => {
        dispatch(
          setGDSceneSkidpadViewerState({...config, showCenterRadius: c})
        );
      }
    },
    'Show inner radius': {
      value: config.showInnerRadius,
      onChange: (c: boolean) => {
        dispatch(setGDSceneSkidpadViewerState({...config, showInnerRadius: c}));
      }
    },
    'Show start line': {
      value: config.showStartLine,
      onChange: (c: boolean) => {
        dispatch(setGDSceneSkidpadViewerState({...config, showStartLine: c}));
      }
    },
    'Show center line': {
      value: config.showCenterLine,
      onChange: (c: boolean) => {
        dispatch(setGDSceneSkidpadViewerState({...config, showCenterLine: c}));
      }
    },
    'Show inner line': {
      value: config.showInnerLine,
      onChange: (c: boolean) => {
        dispatch(setGDSceneSkidpadViewerState({...config, showInnerLine: c}));
      }
    },
    'Show outer line': {
      value: config.showOuterLine,
      onChange: (c: boolean) => {
        dispatch(setGDSceneSkidpadViewerState({...config, showOuterLine: c}));
      }
    },
    'Show inner cones': {
      value: config.showInnerCones,
      onChange: (c: boolean) => {
        dispatch(setGDSceneSkidpadViewerState({...config, showInnerCones: c}));
      }
    },
    'Cone Interval': {
      value: config.coneInterval,
      min: 0.5,
      max: 20,
      step: 0.5,
      onChange: (c: number) => {
        dispatch(setGDSceneSkidpadViewerState({...config, coneInterval: c}));
      }
    },
    'Road Width': {
      value: config.roadWidth,
      min: 0,
      max: 30,
      step: 0.5,
      onChange: (c: number) => {
        dispatch(setGDSceneSkidpadViewerState({...config, roadWidth: c}));
      }
    }
  }));
  return null;
};
