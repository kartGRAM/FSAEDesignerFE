import {createSlice} from '@reduxjs/toolkit';
import {alpha} from '@mui/material/styles';

export interface IAssemblyTreeViewState {
  fontColor: string;
  borderLeft: string;
}

export interface ISidebarState {
  backgroundColor: number;
  iconColor: number;
}

export interface IAppBarState {
  backgroundColor: number;
  fontColor: number;
}

export interface GDState {
  isFullScreen: boolean;
  fullScreenZIndex: number;
  backgroundColor: number;
  appBarState: IAppBarState;
  sidebarState: ISidebarState;
  assemblyTreeViewState: IAssemblyTreeViewState;
}

const initialState: GDState = {
  isFullScreen: false,
  fullScreenZIndex: 0,
  backgroundColor: 0x222222,
  assemblyTreeViewState: {
    fontColor: 'white',
    borderLeft: `1px dashed ${alpha('#ffffff', 0.4)}`
  },
  appBarState: {
    backgroundColor: 0x333333,
    fontColor: 0xeeeeee
  },
  sidebarState: {
    backgroundColor: 0x333333,
    iconColor: 0xdddddd
  }
};

export const uiGeometryDesignerSlice = createSlice({
  name: 'uiGeometryDesigner',
  initialState,
  reducers: {
    toggleFullScreen: (state: GDState) => {
      state.isFullScreen = !state.isFullScreen;
      state.fullScreenZIndex = state.isFullScreen ? 1000000 : 0;
    }
  }
});

export const {toggleFullScreen} = uiGeometryDesignerSlice.actions;

export default uiGeometryDesignerSlice.reducer;
