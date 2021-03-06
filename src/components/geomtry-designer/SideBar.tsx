/* eslint-disable no-unused-vars */
import * as React from 'react';
import {styled, Theme, CSSObject} from '@mui/material/styles';
import MuiDrawer, {DrawerProps} from '@mui/material/Drawer';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import HomeRepairServiceIcon from '@mui/icons-material/HomeRepairService';
import SettingsInputComponentIcon from '@mui/icons-material/SettingsInputComponent';
import BrushIcon from '@mui/icons-material/Brush';
import SettingsIcon from '@mui/icons-material/Settings';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import ComputerIcon from '@mui/icons-material/Computer';
import {useSelector, useDispatch} from 'react-redux';
import {NumberToRGB} from '@app/utils/helpers';
import {RootState} from '@store/store';
import {
  SidePanelTab,
  selectSidePanelTab
} from '@app/store/reducers/uiTempGeometryDesigner';

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
  bgColor: number;
}

// eslint-disable-next-line no-undef
const Drawer = styled<(props: MyDrawerProps) => JSX.Element>(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'bgColor'
})(({theme, open, bgColor}) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  '& .MuiDrawer-root': {
    backgroundColor: NumberToRGB(bgColor),
    position: 'static',
    height: '100%'
  },
  '& .MuiPaper-root': {
    backgroundColor: NumberToRGB(bgColor),
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

export default function MiniDrawer() {
  const bgColor: number = useSelector(
    (state: RootState) => state.uigd.present.sidebarState.backgroundColor
  );
  const selectedBgColor: number = useSelector(
    (state: RootState) => state.uigd.present.sidebarState.selectedBgColor
  );
  const selectedTab: string = useSelector(
    (state: RootState) => state.uitgd.sidePanelState.selectedTab
  );
  const iconColor: number = useSelector(
    (state: RootState) => state.uigd.present.sidebarState.iconColor
  );
  const open = false;
  const dispatch = useDispatch();

  const panelSelect = (selectedTab: SidePanelTab) => {
    dispatch(selectSidePanelTab({tab: selectedTab}));
  };

  return (
    <Drawer variant="permanent" open={false} bgColor={bgColor}>
      <Divider />
      <List>
        {[
          {text: 'elements', icon: <HomeRepairServiceIcon />},
          {text: 'parameters', icon: <SettingsInputComponentIcon />},
          {text: 'analysis', icon: <AutoGraphIcon />},
          {text: 'style', icon: <BrushIcon />},
          {text: 'visualization', icon: <ComputerIcon />}
        ].map((item) => (
          <ListItem key={item.text} disablePadding sx={{display: 'block'}}>
            <ListItemButton
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                backgroundColor:
                  item.text === selectedTab
                    ? `${NumberToRGB(selectedBgColor)}!important`
                    : undefined
              }}
              onClick={() => {
                panelSelect(item.text as SidePanelTab);
              }}
              onKeyDown={(e) => {
                if (e.key === 'enter') {
                  panelSelect(item.text as SidePanelTab);
                }
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                  color: NumberToRGB(iconColor)
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} sx={{opacity: open ? 1 : 0}} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List
        sx={{
          justifyContent: 'bottom'
        }}
      >
        {[{text: 'settings', icon: <SettingsIcon />}].map((item) => (
          <ListItem key={item.text} disablePadding sx={{display: 'block'}}>
            <ListItemButton
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                backgroundColor:
                  item.text === selectedTab
                    ? `${NumberToRGB(selectedBgColor)}!important`
                    : undefined
              }}
              onClick={() => {
                panelSelect(item.text as SidePanelTab);
              }}
              onKeyDown={(e) => {
                if (e.key === 'enter') {
                  panelSelect(item.text as SidePanelTab);
                }
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                  color: NumberToRGB(iconColor)
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} sx={{opacity: open ? 1 : 0}} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}
