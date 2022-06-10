import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {IDataMatrix3, IAssembly} from '@app/geometryDesigner/IElements';

export interface IAssemblyTreeViewState {
  fontColor: string;
  borderLeft: string;
}

export interface GDState {
  transCoordinateMatrix: IDataMatrix3;
  topAssembly?: IAssembly;
}

const initialState: GDState = {
  topAssembly: undefined,
  // eslint-disable-next-line prettier/prettier
  transCoordinateMatrix: [
    0, 0, 1,
    1, 0, 0,
    0, 1, 0
  ]
};

export const dataGeometryDesignerSlice = createSlice({
  name: 'dataGeometryDesigner',
  initialState,
  reducers: {
    setCoordinateMatrix: (
      state: GDState,
      action: PayloadAction<IDataMatrix3>
    ) => {
      state.transCoordinateMatrix = action.payload;
    },
    setTopAssembly: (
      state: GDState,
      action: PayloadAction<IAssembly | undefined>
    ) => {
      state.topAssembly = action.payload;
    },
    setVisibility: (
      state: GDState,
      action: PayloadAction<{
        absPath: string;
        visibility: boolean;
      }>
    ) => {
      if (state.topAssembly) {
        const element = state.topAssembly.getElementByPath(
          action.payload.absPath
        );
        if (element) {
          element.visible = action.payload.visibility;
        }
      }
    }
  }
});

export const {setCoordinateMatrix, setTopAssembly, setVisibility} =
  dataGeometryDesignerSlice.actions;

export default dataGeometryDesignerSlice.reducer;