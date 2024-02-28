import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {IAssembly, IDataAssembly} from '@app/geometryDesigner/IElements';
import {IDataControl} from '@gd/controls/IControls';
import {IDataDatumGroup} from '@gd/measure/datum/IDatumObjects';
import {IDataMeasureTool} from '@gd/measure/measureTools/IMeasureTools';
import {IDataTest} from '@gd/analysis/ITest';
import {IDataMatrix3} from '@gd/INamedValues';
import {validateAll /* , replaceVariable */} from '@gd/IFormula';
import {DateTime} from 'luxon';
import {SavedData} from '@gd/ISaveData';
import {v4 as uuidv4} from 'uuid';
import {IDataReadonlyVariable} from '@gd/measure/readonlyVariables/IReadonlyVariable';

export interface GDState extends SavedData {
  transCoordinateMatrix: IDataMatrix3;
  changed: boolean;
  lastGlobalFormulaUpdate: string;
}

const initialState: GDState = {
  id: Number.MAX_SAFE_INTEGER,
  idWoTest: uuidv4(),
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
  readonlyVariables: [],
  analysis: [],
  options: {
    pinCenterOfGravityOfFrame: true,
    fixSpringDumperDuaringControl: false,
    assemblyMode: 'FixedFrame'
  },
  changed: false,
  lastGlobalFormulaUpdate: uuidv4()
};

export const dataGeometryDesignerSlice = createSlice({
  name: 'dataGeometryDesigner',
  initialState,
  reducers: {
    replaceState: (state: GDState, action: PayloadAction<GDState>) =>
      action.payload,
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
      state.readonlyVariables = initialState.readonlyVariables;
      state.analysis = initialState.analysis;
      state.topAssembly = action.payload?.getDataElement();
      state.idWoTest = uuidv4();
      state.changed = false;
      state.options = initialState.options;
      state.lastGlobalFormulaUpdate = uuidv4();
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
      state.readonlyVariables = action.payload.readonlyVariables;
      state.analysis = action.payload.analysis;
      state.idWoTest = uuidv4();
      state.changed = false;
      state.options = action.payload.options;
      state.lastGlobalFormulaUpdate = uuidv4();
    },
    updateAssembly: (
      state: GDState,
      action: PayloadAction<IDataAssembly | undefined>
    ) => {
      if (!action.payload && state.topAssembly)
        state.topAssembly = {...state.topAssembly};
      else state.topAssembly = action.payload;
      state.idWoTest = uuidv4();
      state.changed = true;
    },
    setFormulae: (
      state: GDState,
      action: PayloadAction<SavedData['formulae']>
    ) => {
      if (validateAll(action.payload) === 'OK') {
        state.formulae = action.payload;
        // if (state.topAssembly) state.topAssembly = {...state.topAssembly};
      }
      state.idWoTest = uuidv4();
      state.lastGlobalFormulaUpdate = uuidv4();
      state.changed = true;
    },
    swapFormulae: (
      state: GDState,
      action: PayloadAction<{
        formulae: SavedData['formulae'];
        lastUpdateID: string;
      }>
    ) => {
      if (validateAll(action.payload.formulae) !== 'OK')
        throw new Error('validation failed');
      state.formulae = action.payload.formulae;
      state.lastGlobalFormulaUpdate = action.payload.lastUpdateID;
    },
    setControl: (state: GDState, action: PayloadAction<IDataControl>) => {
      const control = action.payload;
      /* const controls = state.controls.filter(
        (control) => !!control.targetElements
      ); */
      const {controls} = state;
      const idx = controls.findIndex(
        (c) => c.nodeID === control.nodeID /* ||
          (c.type === control.type && c.inputButton === control.inputButton) */
      );
      if (idx !== -1) {
        controls[idx] = control;
        state.changed = true;
        return;
      }
      state.controls = [control, ...controls];

      state.idWoTest = uuidv4();
      state.changed = true;
    },
    removeControl: (state: GDState, action: PayloadAction<string>) => {
      const nodeID = action.payload;
      state.controls = state.controls.filter(
        (c) => c.nodeID !== nodeID && c.targetElements
      );
      state.idWoTest = uuidv4();
      state.changed = true;
    },
    setDatumObjects: (
      state: GDState,
      action: PayloadAction<IDataDatumGroup[]>
    ) => {
      state.datumObjects = action.payload;
      state.idWoTest = uuidv4();
      state.changed = true;
    },
    setMeasureTools: (
      state: GDState,
      action: PayloadAction<IDataMeasureTool[]>
    ) => {
      state.measureTools = action.payload;
      state.idWoTest = uuidv4();
      state.changed = true;
    },
    setReadonlyVariables: (
      state: GDState,
      action: PayloadAction<IDataReadonlyVariable[]>
    ) => {
      state.readonlyVariables = action.payload;
      state.idWoTest = uuidv4();
      state.changed = true;
    },
    setAssemblyMode: (
      state: GDState,
      action: PayloadAction<typeof initialState.options.assemblyMode>
    ) => {
      state.options.assemblyMode = action.payload;
      state.idWoTest = uuidv4();
      state.changed = true;
    },
    setTests: (state: GDState, action: PayloadAction<IDataTest[]>) => {
      state.analysis = action.payload;
      state.changed = true;
    },
    setDriversEye: (
      state: GDState,
      action: PayloadAction<NonNullable<SavedData['options']['driversEye']>>
    ) => {
      state.options.driversEye = action.payload;
      state.changed = true;
    },
    setChanged: (state: GDState) => {
      state.changed = true;
    },
    toggleFixSpringDumperDuaringControl: (state: GDState) => {
      state.options.fixSpringDumperDuaringControl =
        !state.options.fixSpringDumperDuaringControl;
      state.changed = true;
    },
    togglePinCenterOfGravityOfFrame: (state: GDState) => {
      state.options.pinCenterOfGravityOfFrame =
        !state.options.pinCenterOfGravityOfFrame;
      state.changed = true;
    }
  }
});

export const {
  replaceState,
  setCoordinateMatrix,
  newAssembly,
  setTopAssembly,
  setDatumObjects,
  setMeasureTools,
  setReadonlyVariables,
  updateAssembly,
  setFormulae,
  swapFormulae,
  setControl,
  setTests,
  setDriversEye,
  setAssemblyMode,
  removeControl,
  togglePinCenterOfGravityOfFrame,
  toggleFixSpringDumperDuaringControl,
  setChanged
} = dataGeometryDesignerSlice.actions;

export default dataGeometryDesignerSlice.reducer;

async function clearHistory() {
  const reduxUndo = await import('redux-undo');
  const store = await import('@store/store');
  store.default.dispatch(reduxUndo.ActionCreators.clearHistory());
}
