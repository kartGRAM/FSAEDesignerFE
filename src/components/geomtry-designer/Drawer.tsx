import {styled, Theme, CSSObject} from '@mui/material/styles';
import MuiDrawer, {DrawerProps} from '@mui/material/Drawer';
import {numberToRgb} from '@app/utils/helpers';

const openedMixin = (theme: Theme, widthOnOpen?: number): CSSObject => ({
  width: widthOnOpen,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen
  }),
  overflowX: 'hidden'
});

const closedMixin = (theme: Theme, widthOnClose?: number): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen
  }),
  overflowX: 'hidden',
  width: widthOnClose ?? `calc(${theme.spacing(7)} + 1px)`
});

interface MyDrawerProps extends DrawerProps {
  bgColor?: number;
  widthOnOpen?: number;
  widthOnClose?: number;
}

export const Drawer = styled<(props: MyDrawerProps) => JSX.Element>(MuiDrawer, {
  shouldForwardProp: (prop) =>
    prop !== 'bgColor' && prop !== 'widthOnOpen' && prop !== 'widthOnClose'
})(({theme, open, bgColor, widthOnOpen, widthOnClose}) => ({
  width: widthOnOpen,
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
    ...openedMixin(theme, widthOnOpen),
    '& .MuiDrawer-paper': openedMixin(theme, widthOnOpen)
  }),
  ...(!open && {
    ...closedMixin(theme),
    '& .MuiDrawer-paper': closedMixin(theme, widthOnClose)
  })
}));
export default Drawer;
