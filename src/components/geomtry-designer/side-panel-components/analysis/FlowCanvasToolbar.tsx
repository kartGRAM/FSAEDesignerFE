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
  const {updateOnly} = useTestUpdate(test);
  const isValid = test.validate();
  const {running, paused} = test;

  return (
    <Toolbar sx={{minHeight: 'unset!important', pb: 0}}>
      <MyTooltip title="run">
        <IconButton
          sx={{padding: 0.5}}
          disabled={!isValid || running}
          onClick={async () => {
            await test.run(updateOnly);
            updateOnly();
          }}
        >
          <PlayArrowIcon
            sx={{color: isValid && !running ? '#00aa00' : undefined}}
          />
        </IconButton>
      </MyTooltip>
      <MyTooltip title="pause">
        <IconButton
          sx={{padding: 0.5}}
          disabled={!running || paused}
          onClick={() => {
            test.pause(updateOnly);
          }}
        >
          <PauseIcon sx={{color: running && !paused ? '#0000cc' : undefined}} />
        </IconButton>
      </MyTooltip>
      <MyTooltip title="stop">
        <IconButton
          sx={{padding: 0.5}}
          disabled={!running && !paused}
          onClick={() => {
            test.stop(updateOnly);
          }}
        >
          <StopIcon sx={{color: running || paused ? '#cc0000' : undefined}} />
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