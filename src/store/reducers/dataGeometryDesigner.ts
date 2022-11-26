import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  IDataAssembly,
  IAssembly,
  isElement,
  isAssembly
  // IElement
  // getElementByPath
} from '@app/geometryDesigner/IElements';
import {IBidirectionalNode, getRootNode} from '@gd/INode';
import {IControl} from '@gd/IControls';
import {IDataMatrix3} from '@gd/INamedValues';
import {IDataFormula, validateAll /* , replaceVariable */} from '@gd/IFormula';
import {DateTime} from 'luxon';

export interface GDState {
  id: number;
  filename: string;
  note: string;
  lastUpdated: string;
  transCoordinateMatrix: IDataMatrix3;
  topAssembly?: IDataAssembly;
  formulae: IDataFormula[];
  controls: IControl[];
  changed: boolean;
}

const initialState: GDState = {
  id: Number.MAX_SAFE_INTEGER,
  filename: 'untitled',
  note: '',
  lastUpdated: DateTime.local().toString(),
  topAssembly: undefined,
  transCoordinateMatrix: {
    isNamedData: true,
    className: 'NamedMatrix3',
    absPath: 'global',
    nodeID: '',
    name: 'coordinameMatrix',
    elements: [0, 0, 1, 1, 0, 0, 0, 1, 0]
  },
  formulae: [],
  controls: [],
  changed: false
};

export interface SavedData {
  id: number;
  filename: string;
  thumbnail?: string;
  note: string;
  lastUpdated: string;
  created?: string;
  topAssembly: IDataAssembly | undefined;
  formulae: IDataFormula[];
  controls: IControl[];
}

export function getSetTopAssemblyParams(data: any): SavedData {
  return {
    id: data.id as number,
    filename: data.name as string,
    note: data.note as string,
    lastUpdated: data.lastUpdated as string,
    topAssembly: convertJsonToDataAssembly(data.content as string),
    formulae: convertJsonToDataFormula(data.formulae as string),
    controls: convertJsonToControls(data.controls as string)
  };
}

function convertJsonToDataAssembly(content: string): IDataAssembly | undefined {
  try {
    const data = JSON.parse(content) as IDataAssembly;
    return data;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    return undefined;
  }
}

function convertJsonToDataFormula(content: string): IDataFormula[] {
  try {
    const data = JSON.parse(content) as IDataFormula[];
    return data;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    return [];
  }
}

function convertJsonToControls(content: string): IControl[] {
  try {
    const data = JSON.parse(content) as IControl[];
    return data;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    return [];
  }
}

export function getListSetTopAssemblyParams(listedData: any): SavedData[] {
  const ret = listedData.map(
    (data: any): SavedData => ({
      id: data.id as number,
      filename: data.name as string,
      note: data.note as string,
      lastUpdated: data.lastUpdated as string,
      created: data.created as string,
      thumbnail: data.thumbnail ? (data.thumbnail as string) : undefined,
      topAssembly: convertJsonToDataAssembly(data.content as string),
      formulae: convertJsonToDataFormula(data.formulae as string),
      controls: convertJsonToControls(data.controls as string)
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
    newAssembly: (
      state: GDState,
      action: PayloadAction<IAssembly | undefined>
    ) => {
      clearHistory();
      state.id = initialState.id;
      state.filename = initialState.filename;
      state.note = '';
      state.lastUpdated = DateTime.local().toString();
      state.formulae = initialState.formulae;
      state.controls = initialState.controls;
      state.topAssembly = action.payload?.getDataElement(state);
      state.changed = false;
    },
    setTopAssembly: (state: GDState, action: PayloadAction<SavedData>) => {
      clearHistory();
      state.id = action.payload.id;
      state.filename = action.payload.filename;
      state.note = action.payload.note;
      state.topAssembly = action.payload.topAssembly;
      state.lastUpdated = action.payload.lastUpdated;
      state.formulae = action.payload.formulae;
      state.controls = action.payload.controls;
      state.changed = false;
    },
    updateAssembly: (
      state: GDState,
      action: PayloadAction<IBidirectionalNode>
    ) => {
      const node = action.payload;
      const root = getRootNode(node);
      if (root && isElement(root) && isAssembly(root)) {
        try {
          const newState = root.getDataElement(state);
          state.topAssembly = newState;
        } catch (e: any) {
          if (state.topAssembly) state.topAssembly = {...state.topAssembly};
          // eslint-disable-next-line no-console
          console.log(e);
        }
      }
      state.changed = true;
    },
    setFormulae: (
      state: GDState,
      action: PayloadAction<
        {
          name: string;
          formula: string;
          absPath: string;
        }[]
      >
    ) => {
      if (validateAll(action.payload) === 'OK') {
        state.formulae = action.payload;
        if (state.topAssembly) state.topAssembly = {...state.topAssembly};
      }
      state.changed = true;
    },
    setControl: (state: GDState, action: PayloadAction<IControl>) => {
      const control = action.payload;
      const {controls} = state;
      const idx = controls.findIndex(
        (c) =>
          c.nodeID === control.nodeID ||
          (c.type === control.type && c.inputButton === control.inputButton)
      );
      if (idx !== -1) {
        controls[idx] = control;
        return;
      }
      state.controls = [control, ...state.controls];
    },
    removeControl: (state: GDState, action: PayloadAction<string>) => {
      const nodeID = action.payload;
      state.controls = state.controls.filter((c) => c.nodeID !== nodeID);
    }
  }
});

export const {
  setCoordinateMatrix,
  newAssembly,
  setTopAssembly,
  updateAssembly,
  setFormulae,
  setControl,
  removeControl
} = dataGeometryDesignerSlice.actions;

export default dataGeometryDesignerSlice.reducer;

async function clearHistory() {
  const reduxUndo = await import('redux-undo');
  const store = await import('@store/store');
  store.default.dispatch(reduxUndo.ActionCreators.clearHistory());
}
