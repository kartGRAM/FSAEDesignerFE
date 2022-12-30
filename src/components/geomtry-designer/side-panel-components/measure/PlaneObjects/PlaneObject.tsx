/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import {IPlane, IDatumObject} from '@gd/measure/IDatumObjects';
import {
  isThreePointsPlane,
  isAxisPointPlane,
  isFromBasePlane,
  isFromElementBasePlane
} from '@gd/measure/IPlaneObjects';
import {ThreePointsPlane} from './ThreePointsPlane';
import {AxisPointPlane} from './AxisPointPlane';
import {FromElementBasePlane} from './FromElementBasePlane';
import {FromBasePlane} from './FromBasePlane';

export const planeClasses = [
  'ThreePointsPlane',
  'AxisPointPlane',
  'FromBasePlane',
  'FromElementBasePlane'
] as const;
export type PlaneClasses = typeof planeClasses[number];

export function getPlaneObjectClass(point: IPlane): PlaneClasses | '' {
  if (isThreePointsPlane(point)) return 'ThreePointsPlane';
  if (isAxisPointPlane(point)) return 'AxisPointPlane';
  if (isFromBasePlane(point)) return 'FromBasePlane';
  if (isFromElementBasePlane(point)) return 'FromElementBasePlane';
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
