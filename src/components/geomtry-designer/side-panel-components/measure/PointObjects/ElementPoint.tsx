/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import {RootState} from '@store/store';
import {useSelector} from 'react-redux';
import {IElementPoint} from '@gd/measure/IPointObjects';
import Box from '@mui/material/Box';

export function ElementPoint(props: {elementPoint?: IElementPoint}) {
  const {elementPoint} = props;
  const collectedAssembly = useSelector(
    (state: RootState) => state.uitgd.collectedAssembly
  );

  const selectedPoint = collectedAssembly?.children
    .find((child) => child.nodeID === elementPoint?.element)
    ?.getMeasurablePoints()
    .find((p) => p.nodeID === elementPoint?.point);
  return <Box component="div">aaa</Box>;
}
