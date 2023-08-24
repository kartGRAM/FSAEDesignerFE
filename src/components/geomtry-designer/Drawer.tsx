import {styled, Theme, CSSObject} from '@mui/material/styles';
import MuiDrawer, {DrawerProps} from '@mui/material/Drawer';
import {numberToRgb} from '@app/utils/helpers';

const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen
  }),
  overflowX: 'hidden'
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`
  }
});

interface MyDrawerProps extends DrawerProps {
  bgColor?: number;
}

export const Drawer = styled<(props: MyDrawerProps) => JSX.Element>(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'bgColor'
})(({theme, open, bgColor}) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  '& .MuiDrawer-root': {
    backgroundColor: bgColor ? numberToRgb(bgColor) : undefined,
    position: 'static',
    height: '100%'
  },
  '& .MuiPaper-root': {
    backgroundColor: bgColor ? numberToRgb(bgColor) : undefined,
    position: 'static',
    height: '100%'
  },
  ...(open && {
    ...openedMixin(theme),
    '& .MuiDrawer-paper': openedMixin(theme)
  }),
  ...(!open && {
    ...closedMixin(theme),
    '& .MuiDrawer-paper': closedMixin(theme)
  })
}));
export default Drawer;
