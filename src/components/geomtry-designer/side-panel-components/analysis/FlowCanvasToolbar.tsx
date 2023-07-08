import * as React from 'react';
import {ITest} from '@gd/analysis/ITest';
import useTestUpdate from '@hooks/useTestUpdate';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {Toolbar, Tooltip, IconButton} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';

export function FlowCanvasToolbar(props: {test: ITest}) {
  const {test} = props;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {updateWithSave} = useTestUpdate(test);
  const isValid = test.validate();
  const {running, paused} = test;

  return (
    <Toolbar sx={{minHeight: 'unset!important', pb: 0}}>
      <MyTooltip title="run">
        <IconButton sx={{padding: 0.5}} disabled={!isValid || running}>
          <PlayArrowIcon />
        </IconButton>
      </MyTooltip>
      <MyTooltip title="pause">
        <IconButton sx={{padding: 0.5}} disabled={!running || paused}>
          <PauseIcon />
        </IconButton>
      </MyTooltip>
      <MyTooltip title="stop">
        <IconButton sx={{padding: 0.5}} disabled={!running}>
          <StopIcon />
        </IconButton>
      </MyTooltip>
    </Toolbar>
  );
}

function MyTooltip(props: {title: string; children: React.ReactNode}) {
  const {children, title} = props;
  const zIndex = useSelector(
    (state: RootState) =>
      state.uitgd.fullScreenZIndex + state.uitgd.tooltipZIndex
  );
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
