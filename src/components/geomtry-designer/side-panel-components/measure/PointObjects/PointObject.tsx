/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import {IPoint} from '@gd/measure/IDatumObjects';
import {isElementPoint} from '@gd/measure/IPointObjects';
import Box from '@mui/material/Box';
import {ElementPoint} from './ElementPoint';

export const pointClasses = ['ElementPoint'] as const;
export type PointClasses = typeof pointClasses[number];

export function getPointObjectClass(point: IPoint): PointClasses | '' {
  if (isElementPoint(point)) return 'ElementPoint';
  return '';
}

export function PointObject(params: {point?: IPoint; type: PointClasses | ''}) {
  const {point, type} = params;
  let content: JSX.Element | null = null;
  if (type === 'ElementPoint')
    content = (
      <ElementPoint elementPoint={isElementPoint(point) ? point : undefined} />
    );
  return content;
}
