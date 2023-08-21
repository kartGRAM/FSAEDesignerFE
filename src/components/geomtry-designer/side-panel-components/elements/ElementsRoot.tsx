import * as React from 'react';
import Typography from '@mui/material/Typography';
import {styled, alpha} from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import {useDispatch, useSelector} from 'react-redux';
import {
  setDraggingNewElement,
  resetDragState
} from '@store/reducers/uiTempGeometryDesigner';
import {Elements} from '@gd/IElements';
import {RootState} from '@store/store';

const createElement = (name: Elements) => {
  return {
    name
  };
};

const elements = [
  createElement('AArm'),
  createElement('Assembly'),
  createElement('Bar'),
  createElement('BellCrank'),
  createElement('Body'),
  // createElement('Frame'),
  createElement('SpringDumper'),
  createElement('LinearBushing'),
  createElement('Tire')
];

export default function ElementsRoot() {
  const dispatch = useDispatch();

  const disabled = useSelector((state: RootState) => state.uitgd.uiDisabled);

  const handleDragStart = React.useCallback(
    (name: Elements, e: React.DragEvent<HTMLDivElement>) => {
      e.dataTransfer.effectAllowed = 'move';
      dispatch(setDraggingNewElement(name));
    },
    [dispatch]
  );

  const handleDragEnd = React.useCallback(() => {
    dispatch(resetDragState());
  }, [dispatch]);

  return (
    <Box component="div" sx={{position: 'relative'}}>
      <Typography variant="h6">Components</Typography>
      <Grid
        container
        rowSpacing={1}
        columnSpacing={{xs: 1, sm: 2, md: 3}}
        sx={{paddingLeft: '8px!important'}}
      >
        {elements.map((item) => (
          <Grid item xs={4} key={item.name} sx={{paddingLeft: '8px!important'}}>
            <Item>
              <Element
                tabIndex={0}
                draggable
                onDragStart={(e) => handleDragStart(item.name, e)}
                onDragEnd={handleDragEnd}
              >
                <Typography
                  component="span"
                  variant="subtitle1"
                  color="inherit"
                  sx={{
                    width: '100%',
                    position: 'relative',
                    color: '#FFFFFF'
                  }}
                >
                  {item.name}
                </Typography>
              </Element>
            </Item>
          </Grid>
        ))}
      </Grid>

      <Box
        component="div"
        sx={{
          backgroundColor: alpha('#000', 0.3),
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: disabled ? 'unset' : 'none'
        }}
      />
    </Box>
  );
}

const Element = styled(Box)(() => ({
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  display: 'flex',
  alignItems: 'center',
  '&:hover, &.Mui-focusVisible': {
    zIndex: 1,
    '& .MuiImageBackdrop-root': {
      opacity: 0.15
    },
    '& .MuiImageMarked-root': {
      opacity: 0
    }
  }
}));

const Item = styled(Paper)(({theme}) => ({
  position: 'relative',
  width: '100%!important',
  backgroundColor: '#111111',
  ...theme.typography.body2,
  marginLeft: theme.spacing(1),
  paddingBottom: theme.spacing(1),
  paddingRight: 0,
  paddingTop: '100%!important',
  textAlign: 'center',
  color: theme.palette.text.secondary
}));
