import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {Matrix3} from 'three';
import {IAssembly} from '@app/geometryDesigner/IElements';
import {alpha} from '@mui/material/styles';

export interface IAssemblyTreeViewState {
  fontColor: string;
  borderLeft: string;
}

export interface GDState {
  isFullScreen: boolean;
  fullScreenZIndex: number;
  transCoordinateMatrix: Matrix3;
  backgroundColor: number;
  bgSideBar: number;
  topAssembly?: IAssembly;
  assemblyTreeViewState: IAssemblyTreeViewState;
}

const initialState: GDState = {
  isFullScreen: false,
  fullScreenZIndex: 0,
  backgroundColor: 0x222222,
  topAssembly: undefined,
  assemblyTreeViewState: {
    fontColor: 'white',
    borderLeft: `1px dashed ${alpha('#ffffff', 0.4)}`
  },
  bgSideBar: 0x666666,
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
      state.fullScreenZIndex = state.isFullScreen ? 1000000 : 0;
    },
    setCoordinateMatrix: (state: GDState, action: PayloadAction<Matrix3>) => {
      state.transCoordinateMatrix = action.payload;
    },
    setTopAssembly: (
      state: GDState,
      action: PayloadAction<IAssembly | undefined>
    ) => {
      state.topAssembly = action.payload;
    }
  }
});

export const {toggleFullScreen, setCoordinateMatrix, setTopAssembly} =
  geometryDesignerSlice.actions;

export default geometryDesignerSlice.reducer;
