import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  IDataAssembly,
  syncVisible,
  getElementByPath
} from '@app/geometryDesigner/IElements';
import {IDataMatrix3} from '@gd/NamedValues';
import {getAssembly} from '@app/geometryDesigner/Elements';

export interface IAssemblyTreeViewState {
  fontColor: string;
  borderLeft: string;
}

export interface GDState {
  transCoordinateMatrix: IDataMatrix3;
  topAssembly?: IDataAssembly;
}

const initialState: GDState = {
  topAssembly: undefined,
  // eslint-disable-next-line prettier/prettier
  transCoordinateMatrix: {
    absPath: 'transCoordinateMatrix@global',
    elements: [0, 0, 1, 1, 0, 0, 0, 1, 0]
  }
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
      action: PayloadAction<IDataAssembly | undefined>
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
        const assembly = getAssembly(state.topAssembly);
        const element = getElementByPath(assembly, action.payload.absPath);
        if (assembly && element) {
          element.visible = action.payload.visibility;
          syncVisible(state.topAssembly, assembly);
        }
      }
    }
  }
});

export const {setCoordinateMatrix, setTopAssembly, setVisibility} =
  dataGeometryDesignerSlice.actions;

export default dataGeometryDesignerSlice.reducer;
