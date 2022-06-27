import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  IDataAssembly,
  IElement,
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
    name: 'coordinameMatrix',
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
    updateAssembly: (
      state: GDState,
      action: PayloadAction<{
        element: IElement;
      }>
    ) => {
      const assembly = action.payload.element.getRoot();
      if (assembly) state.topAssembly = assembly.getDataElement();
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
          element.visible.value = action.payload.visibility;
        }
        state.topAssembly = assembly.getDataElement();
      }
    }
  }
});

export const {
  setCoordinateMatrix,
  setTopAssembly,
  setVisibility,
  updateAssembly
} = dataGeometryDesignerSlice.actions;

export default dataGeometryDesignerSlice.reducer;
