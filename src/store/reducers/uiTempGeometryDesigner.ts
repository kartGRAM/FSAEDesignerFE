import {createSlice} from '@reduxjs/toolkit';

export interface GDState {
  isFullScreen: boolean;
  fullScreenZIndex: number;
}

const initialState: GDState = {
  isFullScreen: false,
  fullScreenZIndex: 0
};

export const uitGeometryDesignerSlice = createSlice({
  name: 'uitGeometryDesigner',
  initialState,
  reducers: {
    toggleFullScreen: (state: GDState) => {
      state.isFullScreen = !state.isFullScreen;
      state.fullScreenZIndex = state.isFullScreen ? 1000000 : 0;
    }
  }
});

export const {toggleFullScreen} = uitGeometryDesignerSlice.actions;

export default uitGeometryDesignerSlice.reducer;
