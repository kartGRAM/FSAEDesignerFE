import {createSlice} from '@reduxjs/toolkit';
import {Matrix3} from 'three';

export interface GDState {
  isFullScreen: boolean;
  transCoordinateMatrix: Matrix3;
}

const initialState: GDState = {
  isFullScreen: false,
  // eslint-disable-next-line prettier/prettier
  transCoordinateMatrix: new Matrix3().set(
    0, 1, 0,
    0, 0, 1,
    1, 0, 0
  )
};

export const geometryDesignerSlice = createSlice({
  name: 'geometryDesigner',
  initialState,
  reducers: {
    toggleFullScreen: (state: GDState) => {
      state.isFullScreen = !state.isFullScreen;
    },
    setCoordinateMatrix: (state: GDState, {payload}) => {
      state.transCoordinateMatrix =
        payload || state.transCoordinateMatrix.clone();
    }
  }
});

export const {toggleFullScreen, setCoordinateMatrix} =
  geometryDesignerSlice.actions;

export default geometryDesignerSlice.reducer;
