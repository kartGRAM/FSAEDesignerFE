/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import {IPoint, IDatumObject} from '@gd/measure/IDatumObjects';
import {
  isElementPoint,
  isPlaneLineIntersection
} from '@gd/measure/IPointObjects';
import {ElementPoint} from './ElementPoint';
import {PlaneLineIntersection} from './PlaneLineIntersection';

export const pointClasses = ['ElementPoint', 'PlaneLineIntersection'] as const;
export type PointClasses = typeof pointClasses[number];

export function getPointObjectClass(point: IPoint): PointClasses | '' {
  if (isElementPoint(point)) return 'ElementPoint';
  if (isPlaneLineIntersection(point)) return 'PlaneLineIntersection';
  return '';
}

export function PointObject(params: {
  point?: IPoint;
  type: PointClasses | '';
  setApplyReady: React.Dispatch<React.SetStateAction<IDatumObject | undefined>>;
}) {
  const {point, type, setApplyReady} = params;
  let content: JSX.Element | null = null;
  if (type === 'ElementPoint')
    content = (
      <ElementPoint
        elementPoint={isElementPoint(point) ? point : undefined}
        setApplyReady={setApplyReady}
      />
    );
  else if (type === 'PlaneLineIntersection')
    content = (
      <PlaneLineIntersection
        point={isPlaneLineIntersection(point) ? point : undefined}
        setApplyReady={setApplyReady}
      />
    );
  return content;
}
