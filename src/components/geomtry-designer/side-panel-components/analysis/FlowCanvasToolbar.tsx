import * as React from 'react';
import {ITest} from '@gd/analysis/ITest';
import useTestUpdate from '@hooks/useTestUpdate';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {Toolbar, Tooltip, IconButton} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';

export function FlowCanvasToolbar(props: {test: ITest}) {
  const {test} = props;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {updateOnly} = useTestUpdate(test);
  const isValid = test.validate();
  const {running} = test;

  return (
    <Toolbar sx={{minHeight: 'unset!important', pb: 0}}>
      <MyTooltip title="run">
        <IconButton
          sx={{padding: 0.5}}
          disabled={!isValid || running}
          onClick={() => {
            test.run();
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
            test.stop();
          }}
        >
          <StopIcon sx={{color: running ? '#cc0000' : undefined}} />
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
