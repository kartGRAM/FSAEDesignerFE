import * as React from 'react';
import {Leva, useControls} from 'leva';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {
  setGroundGridShow,
  setGDSceneGridSize,
  setGDSceneShowOBBs,
  setGDSceneGridSegmentLength
} from '@store/reducers/uiGeometryDesigner';

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
    ShowGrids: {
      value: !!showGrids,
      onChange: (c: boolean) => {
        dispatch(setGroundGridShow(c));
      }
    },
    GridSize: {
      value: gridSize ?? 5000,
      min: 0,
      max: 50000,
      step: 10,
      onChange: (c: number) => {
        dispatch(setGDSceneGridSize(c));
      }
    },
    GridSegmentLength: {
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
    ShowOBBs: {
      value: !!showOBB,
      onChange: (c: boolean) => {
        dispatch(setGDSceneShowOBBs(c));
      }
    }
  }));

  return (
    <>
      <Leva />
      <SkidpadConfigUI />
    </>
  );
};

const SkidpadConfigUI = () => {
  return null;
};
