import * as React from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {RootState} from '@store/store';
import Paper, {PaperProps} from '@mui/material/Paper';
import Draggable from 'react-draggable';

interface Props extends PaperProps {
  position: (state: RootState) => {x: number | null; y: number | null};
  setPosition: (payload: {x: number | null; y: number | null}) => any;
}

export default function PaperComponentDraggable({
  position,
  setPosition,
  ...props
}: Props) {
  const dispatch = useDispatch();
  // const {position, setPosition} = props;
  const {x, y} = useSelector(position);

  return (
    <Draggable
      bounds="parent"
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
      defaultPosition={x && y ? {x, y} : undefined}
      onStop={(e, data) => {
        dispatch(
          setPosition({
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
