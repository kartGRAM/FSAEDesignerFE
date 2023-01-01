/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import {ILine, IDatumObject} from '@gd/measure/IDatumObjects';
import {
  isPointDirectionLine,
  isTwoPlaneIntersectionLine
} from '@gd/measure/ILineObjects';
import {TwoPlaneIntersectionLine} from './TwoPlaneIntersectionLine';
import {PointDirectionLine} from './PointDirectionLine';

export const lineClasses = [
  'PointDirectionLine',
  'TwoPlaneIntersectionLine'
] as const;
export type LineClasses = typeof lineClasses[number];

export function getLineObjectClass(line: ILine): LineClasses | '' {
  if (isTwoPlaneIntersectionLine(line)) return 'TwoPlaneIntersectionLine';
  if (isPointDirectionLine(line)) return 'PointDirectionLine';
  return '';
}

export function LineObject(params: {
  line?: ILine;
  type: LineClasses | '';
  setApplyReady: React.Dispatch<React.SetStateAction<IDatumObject | undefined>>;
}) {
  const {line, type, setApplyReady} = params;
  let content: JSX.Element | null = null;
  if (type === 'PointDirectionLine')
    content = (
      <PointDirectionLine
        line={isPointDirectionLine(line) ? line : undefined}
        setApplyReady={setApplyReady}
      />
    );
  else if (type === 'TwoPlaneIntersectionLine')
    content = (
      <TwoPlaneIntersectionLine
        line={isTwoPlaneIntersectionLine(line) ? line : undefined}
        setApplyReady={setApplyReady}
      />
    );
  return content;
}
