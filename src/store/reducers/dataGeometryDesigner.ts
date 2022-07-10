import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  IDataAssembly,
  IElement,
  getElementByPath
} from '@app/geometryDesigner/IElements';
import {IDataMatrix3} from '@gd/NamedValues';
import {getAssembly} from '@app/geometryDesigner/Elements';
import {IDataFormula, validateAll, replaceVariable} from '@gd/Formula';
import {DateTime} from 'luxon';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import store from '@store/store';

export interface IAssemblyTreeViewState {
  fontColor: string;
  borderLeft: string;
}

export interface GDState {
  id: number;
  filename: string;
  note: string;
  lastUpdated: string;
  transCoordinateMatrix: IDataMatrix3;
  topAssembly?: IDataAssembly;
  formulae: IDataFormula[];
  changed: boolean;
}

const initialState: GDState = {
  id: Number.MAX_SAFE_INTEGER,
  filename: 'untitled',
  note: '',
  lastUpdated: DateTime.local().toString(),
  topAssembly: undefined,
  transCoordinateMatrix: {
    name: 'coordinameMatrix',
    elements: [0, 0, 1, 1, 0, 0, 0, 1, 0]
  },
  formulae: [],
  changed: false
};

export interface SetTopAssemblyParams {
  id: number;
  filename: string;
  thumbnail?: string;
  note: string;
  lastUpdated: string;
  created?: string;
  topAssembly: IDataAssembly;
  formulae: IDataFormula[];
}

export function getSetTopAssemblyParams(data: any): SetTopAssemblyParams {
  return {
    id: data.id as number,
    filename: data.name as string,
    note: data.note as string,
    lastUpdated: data.lastUpdated as string,
    topAssembly: JSON.parse(data.content) as IDataAssembly,
    formulae: []
  };
}

export function getListSetTopAssemblyParams(
  listedData: any
): SetTopAssemblyParams[] {
  const ret = listedData.map(
    (data: any): SetTopAssemblyParams => ({
      id: data.id as number,
      filename: data.name as string,
      note: data.note as string,
      lastUpdated: data.lastUpdated as string,
      created: data.created as string,
      thumbnail: data.thumbnail ? (data.thumbnail as string) : undefined,
      topAssembly: JSON.parse(data.content) as IDataAssembly,
      formulae: []
    })
  );
  return ret;
}

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
    newAssembly: (state: GDState) => {
      state.id = initialState.id;
      state.filename = initialState.filename;
      state.note = '';
      state.lastUpdated = DateTime.local().toString();
      state.formulae = initialState.formulae;
      state.topAssembly = undefined;
      state.changed = false;
    },
    setTopAssembly: (
      state: GDState,
      action: PayloadAction<SetTopAssemblyParams>
    ) => {
      state.id = action.payload.id;
      state.filename = action.payload.filename;
      state.note = action.payload.note;
      state.topAssembly = action.payload.topAssembly;
      state.lastUpdated = action.payload.lastUpdated;
      state.formulae = action.payload.formulae;
      state.changed = false;
    },
    updateAssembly: (
      state: GDState,
      action: PayloadAction<{
        element: IElement;
      }>
    ) => {
      const assembly = action.payload.element.getRoot();
      if (assembly) state.topAssembly = assembly.getDataElement();
      state.changed = true;
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
      state.changed = true;
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
      state.changed = true;
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
      state.changed = true;
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
      state.changed = true;
    }
  }
});

export const {
  setCoordinateMatrix,
  newAssembly,
  setTopAssembly,
  setVisibility,
  updateAssembly
} = dataGeometryDesignerSlice.actions;

export default dataGeometryDesignerSlice.reducer;
