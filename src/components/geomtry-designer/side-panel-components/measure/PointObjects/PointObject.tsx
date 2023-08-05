/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import {IPoint, IDatumObject} from '@gd/measure/datum/IDatumObjects';
import {
  isFixedPoint,
  isElementPoint,
  isClosestPointOfTwoLines,
  isPlaneLineIntersection
} from '@gd/measure/datum/IPointObjects';
import {FixedPoint} from './FixedPoint';
import {ElementPoint} from './ElementPoint';
import {PlaneLineIntersection} from './PlaneLineIntersection';
import {ClosestPointOfTwoLines} from './ClosestPointOfTwoLines';

export const pointClasses = [
  'FixedPoint',
  'ElementPoint',
  'PlaneLineIntersection',
  'ClosestPointOfTwoLines'
] as const;
export type PointClasses = typeof pointClasses[number];

export function getPointObjectClass(point: IPoint): PointClasses | '' {
  if (isFixedPoint(point)) return 'FixedPoint';
  if (isElementPoint(point)) return 'ElementPoint';
  if (isPlaneLineIntersection(point)) return 'PlaneLineIntersection';
  if (isClosestPointOfTwoLines(point)) return 'ClosestPointOfTwoLines';
  return '';
}

export function PointObject(params: {
  point?: IPoint;
  type: PointClasses | '';
  setApplyReady: React.Dispatch<React.SetStateAction<IDatumObject | undefined>>;
}) {
  const {point, type, setApplyReady} = params;
  let content: JSX.Element | null = null;
  if (type === 'FixedPoint')
    content = (
      <FixedPoint
        point={isFixedPoint(point) ? point : undefined}
        setApplyReady={setApplyReady}
      />
    );
  else if (type === 'ElementPoint')
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
  else if (type === 'ClosestPointOfTwoLines')
    content = (
      <ClosestPointOfTwoLines
        point={isClosestPointOfTwoLines(point) ? point : undefined}
        setApplyReady={setApplyReady}
      />
    );
  return content;
}
