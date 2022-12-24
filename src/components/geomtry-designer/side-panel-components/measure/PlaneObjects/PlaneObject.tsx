/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import {IPlane, IDatumObject} from '@gd/measure/IDatumObjects';
import {isThreePointsPlane} from '@gd/measure/IPlaneObjects';
import {ThreePointsPlane} from './ThreePointsPlane';

export const planeClasses = ['ThreePointsPlane'] as const;
export type PlaneClasses = typeof planeClasses[number];

export function getPlaneObjectClass(point: IPlane): PlaneClasses | '' {
  if (isThreePointsPlane(point)) return 'ThreePointsPlane';
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
  return content;
}
