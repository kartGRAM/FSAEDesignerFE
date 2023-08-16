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
  if (type === 'ThreePointsPlane')
    return (
      <ThreePointsPlane
        key={type}
        threePointsPlane={isThreePointsPlane(plane) ? plane : undefined}
        setApplyReady={setApplyReady}
      />
    );
  if (type === 'NormalConstantPlane')
    return (
      <NormalConstantPlane
        key={type}
        plane={isNormalConstantPlane(plane) ? plane : undefined}
        setApplyReady={setApplyReady}
      />
    );
  if (type === 'PointNormalPlane')
    return (
      <PointNormalPlane
        key={type}
        plane={isPointNormalPlane(plane) ? plane : undefined}
        setApplyReady={setApplyReady}
      />
    );
  if (type === 'AxisPointPlane')
    return (
      <AxisPointPlane
        key={type}
        plane={isAxisPointPlane(plane) ? plane : undefined}
        setApplyReady={setApplyReady}
      />
    );
  if (type === 'FromElementBasePlane')
    return (
      <FromElementBasePlane
        key={type}
        plane={isFromElementBasePlane(plane) ? plane : undefined}
        setApplyReady={setApplyReady}
      />
    );
  if (type === 'FromBasePlane')
    return (
      <FromBasePlane
        key={type}
        plane={isFromBasePlane(plane) ? plane : undefined}
        setApplyReady={setApplyReady}
      />
    );
  if (type === 'AxisPlaneAngle')
    return (
      <AxisPlaneAnglePlane
        key={type}
        plane={isAxisPlaneAnglePlane(plane) ? plane : undefined}
        setApplyReady={setApplyReady}
      />
    );
  return null;
}
