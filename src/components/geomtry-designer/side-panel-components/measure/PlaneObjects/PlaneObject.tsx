/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import {IPlane, IDatumObject} from '@gd/measure/IDatumObjects';
import {
  isNormalConstantPlane,
  isThreePointsPlane,
  isAxisPointPlane,
  isFromBasePlane,
  isFromElementBasePlane
} from '@gd/measure/IPlaneObjects';
import {ThreePointsPlane} from './ThreePointsPlane';
import {AxisPointPlane} from './AxisPointPlane';
import {FromElementBasePlane} from './FromElementBasePlane';
import {FromBasePlane} from './FromBasePlane';
import {NormalConstantPlane} from './NormalConstantPlane';

export const planeClasses = [
  'NormalConstantPlane',
  'ThreePointsPlane',
  'AxisPointPlane',
  'FromBasePlane',
  'FromElementBasePlane'
] as const;
export type PlaneClasses = typeof planeClasses[number];

export function getPlaneObjectClass(plane: IPlane): PlaneClasses | '' {
  if (isNormalConstantPlane(plane)) return 'NormalConstantPlane';
  if (isThreePointsPlane(plane)) return 'ThreePointsPlane';
  if (isAxisPointPlane(plane)) return 'AxisPointPlane';
  if (isFromBasePlane(plane)) return 'FromBasePlane';
  if (isFromElementBasePlane(plane)) return 'FromElementBasePlane';
  return '';
}

export function PlaneObject(params: {
  plane?: IPlane;
  type: PlaneClasses | '';
  setApplyReady: React.Dispatch<React.SetStateAction<IDatumObject | undefined>>;
}) {
  const {plane, type, setApplyReady} = params;
  let content: JSX.Element | null = null;
  if (type === 'ThreePointsPlane')
    content = (
      <ThreePointsPlane
        threePointsPlane={isThreePointsPlane(plane) ? plane : undefined}
        setApplyReady={setApplyReady}
      />
    );
  else if (type === 'NormalConstantPlane')
    content = (
      <NormalConstantPlane
        plane={isNormalConstantPlane(plane) ? plane : undefined}
        setApplyReady={setApplyReady}
      />
    );
  else if (type === 'AxisPointPlane')
    content = (
      <AxisPointPlane
        plane={isAxisPointPlane(plane) ? plane : undefined}
        setApplyReady={setApplyReady}
      />
    );
  else if (type === 'FromElementBasePlane')
    content = (
      <FromElementBasePlane
        plane={isFromElementBasePlane(plane) ? plane : undefined}
        setApplyReady={setApplyReady}
      />
    );
  else if (type === 'FromBasePlane')
    content = (
      <FromBasePlane
        plane={isFromBasePlane(plane) ? plane : undefined}
        setApplyReady={setApplyReady}
      />
    );
  return content;
}
