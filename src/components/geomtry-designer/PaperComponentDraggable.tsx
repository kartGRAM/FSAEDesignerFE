import * as React from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {RootState} from '@store/store';
import {setPointOffsetToolDialogInitialPosition} from '@store/reducers/uiGeometryDesigner';
import Paper, {PaperProps} from '@mui/material/Paper';
import Draggable from 'react-draggable';

export default function PaperComponentDraggable(props: PaperProps) {
  const dispatch = useDispatch();
  const {x, y} = useSelector(
    (state: RootState) =>
      state.uigd.present.dialogState.pointOffsetToolDialogInitialPosition
  );
  return (
    <Draggable
      bounds="parent"
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
      defaultPosition={x && y ? {x, y} : undefined}
      onStop={(e, data) => {
        dispatch(
          setPointOffsetToolDialogInitialPosition({
            x: data.lastX,
            y: data.lastY
          })
        );
      }}
    >
      <Paper
        {...props}
        sx={{
          pointerEvents: 'auto'
        }}
      />
    </Draggable>
  );
}
