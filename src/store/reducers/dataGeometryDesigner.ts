import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {Matrix3} from 'three';
import {IAssembly} from '@app/geometryDesigner/IElements';

export interface IAssemblyTreeViewState {
  fontColor: string;
  borderLeft: string;
}

export interface GDState {
  transCoordinateMatrix: Matrix3;
  topAssembly?: IAssembly;
}

const initialState: GDState = {
  topAssembly: undefined,
  // eslint-disable-next-line prettier/prettier
  transCoordinateMatrix: new Matrix3().set(
    0, 1, 0,
    0, 0, 1,
    1, 0, 0
  )
};

export const dataGeometryDesignerSlice = createSlice({
  name: 'dataGeometryDesigner',
  initialState,
  reducers: {
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

export const {setCoordinateMatrix, setTopAssembly} =
  dataGeometryDesignerSlice.actions;

export default dataGeometryDesignerSlice.reducer;
