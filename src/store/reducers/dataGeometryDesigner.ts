import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  IAssembly,
  isElement,
  isAssembly
  // IElement
  // getElementByPath
} from '@app/geometryDesigner/IElements';
import {IBidirectionalNode, getRootNode} from '@gd/INode';
import {IControl} from '@gd/controls/IControls';
import {IDataDatumGroup} from '@gd/measure/IDatumObjects';
import {IDataMeasureTool} from '@gd/measure/IMeasureTools';
import {IDataTest} from '@gd/analysis/ITest';
import {IDataMatrix3} from '@gd/INamedValues';
import {validateAll /* , replaceVariable */} from '@gd/IFormula';
import {DateTime} from 'luxon';
import {SavedData} from '@gd/ISaveData';

export interface GDState extends SavedData {
  transCoordinateMatrix: IDataMatrix3;
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
  datumObjects: [],
  measureTools: [],
  analysis: [],
  changed: false
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
      state.datumObjects = initialState.datumObjects;
      state.measureTools = initialState.measureTools;
      state.analysis = initialState.analysis;
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
      state.datumObjects = action.payload.datumObjects;
      state.measureTools = action.payload.measureTools;
      state.analysis = action.payload.analysis;
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
        state.changed = true;
      }
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
        state.changed = true;
        return;
      }
      state.controls = [control, ...state.controls];
      state.changed = true;
    },
    removeControl: (state: GDState, action: PayloadAction<string>) => {
      const nodeID = action.payload;
      state.controls = state.controls.filter((c) => c.nodeID !== nodeID);
      state.changed = true;
    },
    setDatumObjects: (
      state: GDState,
      action: PayloadAction<IDataDatumGroup[]>
    ) => {
      state.datumObjects = action.payload;
      state.changed = true;
    },
    setMeasureTools: (
      state: GDState,
      action: PayloadAction<IDataMeasureTool[]>
    ) => {
      state.measureTools = action.payload;
      state.changed = true;
    },
    setTests: (state: GDState, action: PayloadAction<IDataTest[]>) => {
      state.analysis = action.payload;
      state.changed = true;
    },
    setChanged: (state: GDState) => {
      state.changed = true;
    }
  }
});

export const {
  setCoordinateMatrix,
  newAssembly,
  setTopAssembly,
  setDatumObjects,
  setMeasureTools,
  updateAssembly,
  setFormulae,
  setControl,
  removeControl,
  setChanged
} = dataGeometryDesignerSlice.actions;

export default dataGeometryDesignerSlice.reducer;

async function clearHistory() {
  const reduxUndo = await import('redux-undo');
  const store = await import('@store/store');
  store.default.dispatch(reduxUndo.ActionCreators.clearHistory());
}
