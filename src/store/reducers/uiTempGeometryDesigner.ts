import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export interface SidePanelState {
  selectedTab: 'elements' | 'parameters';
}

export interface GDState {
  isFullScreen: boolean;
  fullScreenZIndex: number;
  selectedElementAbsPath: string;
  sidePanelState: SidePanelState;
}

const initialState: GDState = {
  isFullScreen: false,
  fullScreenZIndex: 0,
  selectedElementAbsPath: '',
  sidePanelState: {selectedTab: 'elements'}
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
    }
  }
});

export const {toggleFullScreen, selectElement} =
  uitGeometryDesignerSlice.actions;

export default uitGeometryDesignerSlice.reducer;
