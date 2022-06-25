import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {IDataVector3} from '@gd/NamedValues';

export type SidePanelTab =
  | 'elements'
  | 'parameters'
  | 'analysis'
  | 'style'
  | 'visualization'
  | 'settings';

export interface SidePanelState {
  selectedTab: SidePanelTab;
}

export interface GDState {
  isFullScreen: boolean;
  fullScreenZIndex: number;
  selectedElementAbsPath: string;
  sidePanelState: SidePanelState;
  gdSceneState: GDSceneState;
}

export interface GDSceneState {
  selectedPoint: IDataVector3 | null;
}

const initialState: GDState = {
  isFullScreen: true,
  fullScreenZIndex: 10000000,
  selectedElementAbsPath: '',
  sidePanelState: {selectedTab: 'elements'},
  gdSceneState: {
    selectedPoint: null
  }
};

export const uitGeometryDesignerSlice = createSlice({
  name: 'uitGeometryDesigner',
  initialState,
  reducers: {
    toggleFullScreen: (state: GDState) => {
      state.isFullScreen = !state.isFullScreen;
      state.fullScreenZIndex = state.isFullScreen ? 1000000 : 0;
    },
    selectElement: (
      state: GDState,
      action: PayloadAction<{
        absPath: string;
      }>
    ) => {
      state.selectedElementAbsPath = action.payload.absPath;
      state.sidePanelState.selectedTab = 'parameters';
    },
    selectSidePanelTab: (
      state: GDState,
      action: PayloadAction<{
        tab: SidePanelTab;
      }>
    ) => {
      state.sidePanelState.selectedTab = action.payload.tab;
    },

    setSelectedPoint: (
      state: GDState,
      action: PayloadAction<{
        point: IDataVector3 | null;
      }>
    ) => {
      state.gdSceneState.selectedPoint = action.payload.point;
    }
  }
});

export const {
  toggleFullScreen,
  selectElement,
  selectSidePanelTab,
  setSelectedPoint
} = uitGeometryDesignerSlice.actions;

export default uitGeometryDesignerSlice.reducer;
