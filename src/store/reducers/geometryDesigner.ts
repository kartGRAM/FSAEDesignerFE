import {createSlice} from '@reduxjs/toolkit';

export interface GDState {
  isFullScreen: boolean;
}

const initialState: GDState = {
  isFullScreen: false
};

export const geometryDesignerSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    toggleFullScreen: (state) => {
      state.isFullScreen = !state.isFullScreen;
    }
  }
});

export const {toggleFullScreen} = geometryDesignerSlice.actions;

export default geometryDesignerSlice.reducer;
