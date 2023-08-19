import * as React from 'react';
import {ITest} from '@gd/analysis/ITest';
import useTestUpdate from '@hooks/useTestUpdate';
import {useDispatch} from 'react-redux';
import store from '@store/store';
import {Toolbar, Tooltip, IconButton} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import {BackgroundVariant, useReactFlow} from 'reactflow';
import RedoIcon from '@mui/icons-material/Redo';
import UndoIcon from '@mui/icons-material/Undo';
import {setFlowCanvasBackgroundVariant} from '@store/reducers/uiGeometryDesigner';
import Button from '@mui/material/Button';

export const FlowCanvasToolbar = React.memo((props: {test: ITest}) => {
  const {test} = props;

  const dispatch = useDispatch();

  const {updateOnly} = useTestUpdate(test);
  const isValid = test.validate();
  const {running} = test.solver;

  const [onArrange, setOnArrange] = React.useState(false);

  const {fitView} = useReactFlow();

  React.useEffect(() => {
    fitView();
  }, [onArrange]);

  const redo = () => {
    test.localRedo();
    updateOnly();
  };

  const undo = () => {
    test.localUndo();
    updateOnly();
  };

  const arrange = () => {
    const {widthSpaceAligningNodes, heightSpaceAligningNodes} =
      store.getState().uigd.present.analysisPanelState;
    test.arrange(widthSpaceAligningNodes, heightSpaceAligningNodes);
    test.saveLocalState();
    setOnArrange((prev) => !prev);
  };

  return (
    <Toolbar sx={{minHeight: 'unset!important', pb: 0}}>
      <MyTooltip title="run">
        <IconButton
          sx={{padding: 0.5}}
          disabled={!isValid || running}
          onClick={() => {
            test.solver.run();
          }}
        >
          <PlayArrowIcon
            sx={{color: isValid && !running ? '#00aa00' : undefined}}
          />
        </IconButton>
      </MyTooltip>
      <MyTooltip title="stop">
        <IconButton
          sx={{padding: 0.5}}
          disabled={!running}
          onClick={() => {
            test.solver.stop();
          }}
        >
          <StopIcon sx={{color: running ? '#cc0000' : undefined}} />
        </IconButton>
      </MyTooltip>
      <Button
        onClick={() =>
          dispatch(setFlowCanvasBackgroundVariant(BackgroundVariant.Dots))
        }
      >
        dots
      </Button>
      <Button
        onClick={() =>
          dispatch(setFlowCanvasBackgroundVariant(BackgroundVariant.Lines))
        }
      >
        lines
      </Button>
      <Button
        onClick={() =>
          dispatch(setFlowCanvasBackgroundVariant(BackgroundVariant.Cross))
        }
      >
        cross
      </Button>
      <Button onClick={arrange} disabled={running}>
        arrange
      </Button>
      <MyTooltip title="undo">
        <IconButton
          disabled={!test.undoable || running}
          onClick={undo}
          color="primary"
        >
          <UndoIcon />
        </IconButton>
      </MyTooltip>
      <MyTooltip title="Redo">
        <IconButton
          disabled={!test.redoable || running}
          onClick={redo}
          color="primary"
        >
          <RedoIcon />
        </IconButton>
      </MyTooltip>
    </Toolbar>
  );
});

const MyTooltip = React.memo(
  (props: {title: string; children: React.ReactNode}) => {
    const {children, title} = props;
    const {uitgd} = store.getState();
    const zIndex = uitgd.fullScreenZIndex + uitgd.tooltipZIndex;
    return (
      <Tooltip
        title={title}
        componentsProps={{
          popper: {
            sx: {
              zIndex
            }
          }
        }}
      >
        <span>{children}</span>
      </Tooltip>
    );
  }
);
