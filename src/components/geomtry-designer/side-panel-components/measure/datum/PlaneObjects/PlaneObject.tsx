/* eslint-disable no-undef */
import React from 'react';
import {IPlane, IDatumObject} from '@gd/measure/datum/IDatumObjects';
import {
  isNormalConstantPlane,
  isPointNormalPlane,
  isThreePointsPlane,
  isAxisPointPlane,
  isFromBasePlane,
  isFromElementBasePlane,
  isAxisPlaneAnglePlane
} from '@gd/measure/datum/IPlaneObjects';
import {ThreePointsPlane} from './ThreePointsPlane';
import {PointNormalPlane} from './PointNormalPlane';
import {AxisPointPlane} from './AxisPointPlane';
import {FromElementBasePlane} from './FromElementBasePlane';
import {FromBasePlane} from './FromBasePlane';
import {NormalConstantPlane} from './NormalConstantPlane';
import {AxisPlaneAnglePlane} from './AxisPlaneAnglePlane';

export const planeClasses = [
  'NormalConstantPlane',
  'PointNormalPlane',
  'ThreePointsPlane',
  'AxisPointPlane',
  'FromBasePlane',
  'FromElementBasePlane',
  'AxisPlaneAngle'
] as const;
export type PlaneClasses = typeof planeClasses[number];

export function getPlaneObjectClass(plane: IPlane): PlaneClasses | '' {
  if (isNormalConstantPlane(plane)) return 'NormalConstantPlane';
  if (isPointNormalPlane(plane)) return 'PointNormalPlane';
  if (isThreePointsPlane(plane)) return 'ThreePointsPlane';
  if (isAxisPointPlane(plane)) return 'AxisPointPlane';
  if (isFromBasePlane(plane)) return 'FromBasePlane';
  if (isFromElementBasePlane(plane)) return 'FromElementBasePlane';
  if (isAxisPlaneAnglePlane(plane)) return 'AxisPlaneAngle';
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
        key={type}
        threePointsPlane={isThreePointsPlane(plane) ? plane : undefined}
        setApplyReady={setApplyReady}
      />
    );
  else if (type === 'NormalConstantPlane')
    content = (
      <NormalConstantPlane
        key={type}
        plane={isNormalConstantPlane(plane) ? plane : undefined}
        setApplyReady={setApplyReady}
      />
    );
  else if (type === 'PointNormalPlane')
    content = (
      <PointNormalPlane
        key={type}
        plane={isPointNormalPlane(plane) ? plane : undefined}
        setApplyReady={setApplyReady}
      />
    );
  else if (type === 'AxisPointPlane')
    content = (
      <AxisPointPlane
        key={type}
        plane={isAxisPointPlane(plane) ? plane : undefined}
        setApplyReady={setApplyReady}
      />
    );
  else if (type === 'FromElementBasePlane')
    content = (
      <FromElementBasePlane
        key={type}
        plane={isFromElementBasePlane(plane) ? plane : undefined}
        setApplyReady={setApplyReady}
      />
    );
  else if (type === 'FromBasePlane')
    content = (
      <FromBasePlane
        key={type}
        plane={isFromBasePlane(plane) ? plane : undefined}
        setApplyReady={setApplyReady}
      />
    );
  else if (type === 'AxisPlaneAngle')
    content = (
      <AxisPlaneAnglePlane
        key={type}
        plane={isAxisPlaneAnglePlane(plane) ? plane : undefined}
        setApplyReady={setApplyReady}
      />
    );
  return content;
}
