import {createSlice, PayloadAction} from '@reduxjs/toolkit';
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
export interface ISidePanelState {
  backgroundColor: number;
  fontColor: number;
  panelWidth: string;
}

export interface GDState {
  backgroundColor: number;
  enabledColorDark: number;
  enabledColorLight: number;
  appBarState: IAppBarState;
  sidebarState: ISidebarState;
  sidePanelState: ISidePanelState;
  assemblyTreeViewState: IAssemblyTreeViewState;
}

const initialState: GDState = {
  backgroundColor: 0x222222,
  enabledColorDark: 0x017384,
  enabledColorLight: 0x019fb6,
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
  },
  sidePanelState: {
    backgroundColor: 0x2e2e2e,
    fontColor: 0xcccccc,
    panelWidth: '300px'
  }
};

export const uiGeometryDesignerSlice = createSlice({
  name: 'uiGeometryDesigner',
  initialState,
  reducers: {
    resizePanel: (state: GDState, action: PayloadAction<string>) => {
      state.sidePanelState.panelWidth = action.payload;
    }
  }
});

export const {resizePanel} = uiGeometryDesignerSlice.actions;

export default uiGeometryDesignerSlice.reducer;
