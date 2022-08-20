import * as React from 'react';
import Typography from '@mui/material/Typography';
import {styled} from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import {useDispatch} from 'react-redux';
import {treeViewDragExpanded} from '@store/reducers/uiTempGeometryDesigner';

const createElement = (name: string) => {
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
  createElement('Frame'),
  createElement('SpringDumper'),
  createElement('Tire')
];

export default function ElementsRoot() {
  const handleDragStart = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.dataTransfer.effectAllowed = 'move';
    },
    []
  );
  const dispatch = useDispatch();

  const handleDragEnd = React.useCallback(() => {
    dispatch(treeViewDragExpanded([]));
  }, []);

  return (
    <>
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
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <Typography
                  component="span"
                  variant="subtitle1"
                  color="inherit"
                  sx={{
                    width: '100%',
                    position: 'relative',
                    p: 4,
                    pt: 2,
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
    </>
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
