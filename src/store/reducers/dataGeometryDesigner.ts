import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  IDataAssembly,
  IElement,
  getElementByPath
} from '@app/geometryDesigner/IElements';
import {IDataMatrix3} from '@gd/NamedValues';
import {getAssembly} from '@app/geometryDesigner/Elements';
import {IDataFormula, validateAll, replaceVariable} from '@gd/Formula';

export interface IAssemblyTreeViewState {
  fontColor: string;
  borderLeft: string;
}

export interface GDState {
  transCoordinateMatrix: IDataMatrix3;
  topAssembly?: IDataAssembly;
  formulae: IDataFormula[];
}

const initialState: GDState = {
  topAssembly: undefined,
  // eslint-disable-next-line prettier/prettier
  transCoordinateMatrix: {
    name: 'coordinameMatrix',
    elements: [0, 0, 1, 1, 0, 0, 0, 1, 0]
  },
  formulae: []
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
    },
    setNewFormula: (
      state: GDState,
      action: PayloadAction<{
        name: string;
        formula: string;
        absPath: string;
      }>
    ) => {
      const {name, formula, absPath} = action.payload;
      const tmp = [...state.formulae, {name, formula, absPath}];
      if (validateAll(tmp) === 'OK') {
        state.formulae = tmp;
      }
    },
    updateFormula: (
      state: GDState,
      action: PayloadAction<{
        name: string;
        formula: string;
      }>
    ) => {
      const {name, formula} = action.payload;
      const tmp = [...state.formulae];
      tmp.forEach((value) => {
        if (value.name === name) {
          value.formula = formula;
        }
      });
      if (validateAll(tmp) === 'OK') {
        state.formulae = tmp;
      }
    },
    removeFormula: (
      state: GDState,
      action: PayloadAction<{
        name: string;
        replacement: string;
      }>
    ) => {
      const {name, replacement} = action.payload;
      const tmp = state.formulae.filter((value) => value.name !== name);
      tmp.forEach((value) => {
        value.formula = replaceVariable(value.formula, name, replacement);
      });
      if (validateAll(tmp) === 'OK') {
        state.formulae = tmp;
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
