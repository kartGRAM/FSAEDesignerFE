import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {INamedVector3} from '@gd/INamedValues';
import {ConfirmDialogProps} from '@gdComponents/dialog-components/ConfirmDialog';
import {SaveAsDialogProps} from '@gdComponents/dialog-components/SaveAsDialog';
import {CopyFromExistingPointsDialogProps} from '@gdComponents/dialog-components/CopyFromExistingPointsDialog';
import {MovePointDialogProps} from '@gdComponents/dialog-components/MovePointDialog';
import {IAssembly, Elements} from '@gd/IElements';
import {IDatumManager} from '@gd/measure/IDatumObjects';
import {IMeasureToolsManager} from '@gd/measure/IMeasureTools';
import {Quaternion, Vector3} from 'three';
import {RootState} from '@react-three/fiber';
import {GetState} from 'zustand';
import {ITest} from '@gd/analysis/ITest';
import {Item as TestFlowNodeItem} from '@gd/analysis/FlowNode';
import {KinematicSolver} from '@gd/kinematics/Solver';
// import {PointOffsetToolDialogProps} from '@gdComponents/dialog-components/PointOffsetToolDialog';

export type SidePanelTab =
  | 'elements'
  | 'parameters'
  | 'measure'
  | 'controllers'
  | 'analysis'
  | 'style'
  | 'visualization'
  | 'settings';

export interface SidePanelState {
  selectedTab: SidePanelTab;
}

export type CopyOrCut = 'cut' | 'copy';

export interface ClipboardObject {
  mode: CopyOrCut;
  dataType: 'IElement';
  data: any;
}

export interface GlobalSelected {
  toClipboard: (mode: CopyOrCut) => ClipboardObject;
  onPaste: (object: ClipboardObject) => void;
}

export interface GDState {
  uiDisabled: boolean;
  uiDisabledAll: boolean;
  isFullScreen: boolean;
  fullScreenZIndex: number;
  selectedElementAbsPath: string;
  sidePanelState: SidePanelState;
  gdSceneState: GDSceneState;
  gdDialogState: GDDialogState;
  assembly: IAssembly | undefined;
  collectedAssembly: IAssembly | undefined;
  kinematicSolver: KinematicSolver | undefined;
  datumManager: IDatumManager | undefined;
  measureToolsManager: IMeasureToolsManager | undefined;
  tests: ITest[];
  treeViewDragExpanded: string[];
  draggingNewElement: Elements | null;
  draggingElementAbsPath: string;
  draggingNewTestFlowNode: TestFlowNodeItem | null;
  globalSelected: GlobalSelected | null;
  clipbord: ClipboardObject | null;

  forceCallSelector: boolean;
}

export interface INamedVector3WithColor {
  point: INamedVector3;
  color?: number;
}

export interface GDSceneState {
  movingMode: boolean;
  selectedPoint: INamedVector3WithColor[] | null;
  selectedDatumObject: string;
  selectedMeasureTool: string;
  viewDirection: Quaternion | undefined;
  orbitControlsEnabled: boolean;
  orbitControlsEnabledManual: boolean;
  toggle: boolean;
  assembled: boolean;
  resetPositions: boolean;
  get: GetState<RootState> | null;
  measureElementPointsMode: boolean;
  measureElementPointSelected?: string;
  forceVisibledDatums: string[];
  datumElementSelectMode: boolean;
  datumPointSelectMode: boolean;
  datumPointSelected: string;
  datumLineSelectMode: boolean;
  datumLineSelected: string;
  datumPlaneSelectMode: boolean;
  datumPlaneSelected: string;
}

export interface GDDialogState {
  copyFromExistingPointsDialogProps: CopyFromExistingPointsDialogProps;
  copyFromExistingPointsOnSelected: ((v: Vector3) => void) | null;
  movePointDialogProps: MovePointDialogProps;
  movePointOnMoved: ((delta: Vector3) => void) | null;
  formulaDialogOpen: boolean;
  RecordingDialogOpen: boolean;
  openDialogOpen: boolean;
  saveAsDialogProps?: SaveAsDialogProps;
  confirmDialogProps?: ConfirmDialogProps;
}

const initialState: GDState = {
  isFullScreen: true,
  fullScreenZIndex: 10000000,
  uiDisabled: false,
  uiDisabledAll: false,
  selectedElementAbsPath: '',
  sidePanelState: {selectedTab: 'elements'},
  gdSceneState: {
    movingMode: false,
    orbitControlsEnabled: true,
    orbitControlsEnabledManual: true,
    selectedPoint: null,
    selectedDatumObject: '',
    selectedMeasureTool: '',
    viewDirection: undefined,
    resetPositions: false,
    toggle: true, // その打ち消す
    assembled: false,
    get: null,
    measureElementPointsMode: false,
    measureElementPointSelected: undefined,
    forceVisibledDatums: [],
    datumElementSelectMode: false,
    datumPointSelectMode: false,
    datumPointSelected: '',
    datumLineSelectMode: false,
    datumLineSelected: '',
    datumPlaneSelectMode: false,
    datumPlaneSelected: ''
  },
  gdDialogState: {
    copyFromExistingPointsDialogProps: {open: false, onSelected: null},
    copyFromExistingPointsOnSelected: null,
    movePointDialogProps: {open: false, target: null, onMoved: null},
    movePointOnMoved: null, // そのうちけす
    formulaDialogOpen: false,
    RecordingDialogOpen: false,
    openDialogOpen: false,
    saveAsDialogProps: undefined,
    confirmDialogProps: undefined
  },
  datumManager: undefined,
  measureToolsManager: undefined,
  tests: [],
  assembly: undefined,
  collectedAssembly: undefined,
  kinematicSolver: undefined,
  treeViewDragExpanded: [],
  draggingNewElement: null,
  draggingElementAbsPath: '',
  draggingNewTestFlowNode: null,
  globalSelected: null,
  clipbord: null,
  forceCallSelector: true
};

export const uitGeometryDesignerSlice = createSlice({
  name: 'uitGeometryDesigner',
  initialState,
  reducers: {
    setAssemblyAndCollectedAssembly: (
      state: GDState,
      action: PayloadAction<
        | {
            assembly: IAssembly;
            collectedAssembly: IAssembly;
            datumManager: IDatumManager;
            measureToolsManager: IMeasureToolsManager;
          }
        | undefined
      >
    ) => {
      state.gdSceneState.assembled = false;
      if (!action.payload) {
        state.assembly = undefined;
        state.collectedAssembly = undefined;
        state.datumManager = undefined;
        state.measureToolsManager = undefined;
        state.kinematicSolver = undefined;
        state.gdSceneState.movingMode = false;
        state.selectedElementAbsPath = '';
        return;
      }
      state.assembly = action.payload.assembly;
      state.collectedAssembly = action.payload.collectedAssembly;
      state.datumManager = action.payload.datumManager;
      state.measureToolsManager = action.payload.measureToolsManager;
    },
    setDatumManager: (
      state: GDState,
      action: PayloadAction<{
        datumManager: IDatumManager;
        measureToolsManager: IMeasureToolsManager;
      }>
    ) => {
      state.datumManager = action.payload.datumManager;
      state.measureToolsManager = action.payload.measureToolsManager;
    },
    setMeasureToolsManager: (
      state: GDState,
      action: PayloadAction<{
        measureToolsManager: IMeasureToolsManager;
      }>
    ) => {
      state.measureToolsManager = action.payload.measureToolsManager;
    },
    setTest: (state: GDState, action: PayloadAction<ITest>) => {
      const test = action.payload;
      state.tests = [
        ...state.tests.filter((t) => t.nodeID !== test.nodeID),
        test
      ];
    },
    removeTest: (state: GDState, action: PayloadAction<ITest>) => {
      const test = action.payload;
      state.tests = [...state.tests.filter((t) => t.nodeID !== test.nodeID)];
    },
    setKinematicSolver: (
      state: GDState,
      action: PayloadAction<KinematicSolver | undefined>
    ) => {
      state.kinematicSolver = action.payload;
    },
    setDraggingNewElement: (
      state: GDState,
      action: PayloadAction<Elements | null>
    ) => {
      state.draggingNewElement = action.payload;
    },
    setDraggingElementAbsPath: (
      state: GDState,
      action: PayloadAction<string>
    ) => {
      state.draggingElementAbsPath = action.payload;
    },
    setDraggingNewTestFlowNode: (
      state: GDState,
      action: PayloadAction<TestFlowNodeItem | null>
    ) => {
      state.draggingNewTestFlowNode = action.payload;
    },
    treeViewDragExpanded: (state: GDState, action: PayloadAction<string[]>) => {
      state.treeViewDragExpanded = action.payload;
    },
    resetDragState: (state: GDState) => {
      state.treeViewDragExpanded = [];
      state.draggingNewElement = null;
      state.draggingElementAbsPath = '';
    },
    toggleFullScreen: (state: GDState) => {
      state.isFullScreen = !state.isFullScreen;
      state.fullScreenZIndex = state.isFullScreen ? 1000000 : 0;
    },
    setUIDisabled: (state: GDState, action: PayloadAction<boolean>) => {
      state.uiDisabled = action.payload;
    },
    setAllUIDisabled: (state: GDState, action: PayloadAction<boolean>) => {
      state.uiDisabledAll = action.payload;
    },
    selectElement: (
      state: GDState,
      action: PayloadAction<{
        absPath: string;
        cancelTabChange?: boolean;
      }>
    ) => {
      state.selectedElementAbsPath = action.payload.absPath;
      if (!action.payload.cancelTabChange)
        state.sidePanelState.selectedTab = 'parameters';
    },
    setGlobalSelected: (
      state: GDState,
      action: PayloadAction<GlobalSelected | null>
    ) => {
      state.globalSelected = action.payload;
    },
    setClipboard: (
      state: GDState,
      action: PayloadAction<ClipboardObject | null>
    ) => {
      state.clipbord = action.payload;
    },
    selectSidePanelTab: (
      state: GDState,
      action: PayloadAction<{
        tab: SidePanelTab;
      }>
    ) => {
      state.sidePanelState.selectedTab = action.payload.tab;
    },
    setSelectedPoint: (
      state: GDState,
      action: PayloadAction<
        INamedVector3WithColor[] | INamedVector3WithColor | null
      >
    ) => {
      const point = action.payload;
      if (!point) {
        state.gdSceneState.selectedPoint = null;
      } else if (Array.isArray(point))
        state.gdSceneState.selectedPoint = [...point];
      else state.gdSceneState.selectedPoint = [point];
    },
    setSelectedDatumObject: (state: GDState, action: PayloadAction<string>) => {
      state.gdSceneState.selectedDatumObject = action.payload;
    },
    setSelectedMeasureTool: (state: GDState, action: PayloadAction<string>) => {
      state.gdSceneState.selectedMeasureTool = action.payload;
    },
    setFormulaDialogOpen: (
      state: GDState,
      action: PayloadAction<{
        open: boolean;
      }>
    ) => {
      state.gdDialogState.formulaDialogOpen = action.payload.open;
    },
    setRecordingDialogOpen: (
      state: GDState,
      action: PayloadAction<{
        open: boolean;
      }>
    ) => {
      state.gdDialogState.RecordingDialogOpen = action.payload.open;
    },
    setOpenDialogOpen: (
      state: GDState,
      action: PayloadAction<{
        open: boolean;
      }>
    ) => {
      state.gdDialogState.openDialogOpen = action.payload.open;
    },
    setSaveAsDialogProps: (
      state: GDState,
      action: PayloadAction<SaveAsDialogProps | undefined>
    ) => {
      state.gdDialogState.saveAsDialogProps = action.payload;
    },
    setConfirmDialogProps: (
      state: GDState,
      action: PayloadAction<ConfirmDialogProps | undefined>
    ) => {
      state.gdDialogState.confirmDialogProps = action.payload;
    },
    setCopyFromExistingPointsDialogProps: (
      state: GDState,
      action: PayloadAction<CopyFromExistingPointsDialogProps>
    ) => {
      state.gdDialogState.copyFromExistingPointsDialogProps = action.payload;
    },
    setCfepOnSelected: (
      state: GDState,
      action: PayloadAction<((v: Vector3) => void) | null>
    ) => {
      state.gdDialogState.copyFromExistingPointsOnSelected = action.payload;
    },
    setMovePointDialogProps: (
      state: GDState,
      action: PayloadAction<MovePointDialogProps>
    ) => {
      state.gdDialogState.movePointDialogProps = action.payload;
    },
    setMovePointOnMoved: (
      state: GDState,
      action: PayloadAction<((delta: Vector3) => void) | null>
    ) => {
      state.gdDialogState.movePointOnMoved = action.payload;
    },
    setViewDirection: (state: GDState, action: PayloadAction<Quaternion>) => {
      state.gdSceneState.viewDirection = action.payload;
      state.gdSceneState.toggle = !state.gdSceneState.toggle;
    },
    setGDSceneGetThree: (
      state: GDState,
      action: PayloadAction<GetState<RootState>>
    ) => {
      state.gdSceneState.get = action.payload;
    },
    setAssembled: (state: GDState, action: PayloadAction<boolean>) => {
      state.gdSceneState.assembled = action.payload;
      state.gdSceneState.movingMode = false;
    },
    setMovingMode: (state: GDState, action: PayloadAction<boolean>) => {
      state.gdSceneState.movingMode = action.payload;
    },
    resetPositions: (state: GDState) => {
      state.gdSceneState.resetPositions = !state.gdSceneState.resetPositions;
    },
    setOrbitControlsEnabled: (
      state: GDState,
      action: PayloadAction<boolean>
    ) => {
      state.gdSceneState.orbitControlsEnabled = action.payload;
    },
    setOrbitControlsEnabledManual: (
      state: GDState,
      action: PayloadAction<boolean>
    ) => {
      state.gdSceneState.orbitControlsEnabledManual = action.payload;
    },
    setMeasureElementPointMode: (
      state: GDState,
      action: PayloadAction<boolean>
    ) => {
      state.gdSceneState.measureElementPointsMode = action.payload;
    },
    setMeasureElementPointSelected: (
      state: GDState,
      action: PayloadAction<string | undefined>
    ) => {
      state.gdSceneState.measureElementPointSelected = action.payload;
    },
    setDatumElementSelectMode: (
      state: GDState,
      action: PayloadAction<boolean>
    ) => {
      if (
        action.payload === false ||
        action.payload !== state.gdSceneState.datumElementSelectMode
      ) {
        state.selectedElementAbsPath = '';
      }
      state.gdSceneState.datumElementSelectMode = action.payload;
    },
    setDatumPointSelectMode: (
      state: GDState,
      action: PayloadAction<boolean>
    ) => {
      if (
        action.payload === false ||
        action.payload !== state.gdSceneState.datumPointSelectMode
      ) {
        state.gdSceneState.datumPointSelected = '';
      }
      state.gdSceneState.datumPointSelectMode = action.payload;
    },
    setDatumLineSelectMode: (
      state: GDState,
      action: PayloadAction<boolean>
    ) => {
      if (
        action.payload === false ||
        action.payload !== state.gdSceneState.datumLineSelectMode
      ) {
        state.gdSceneState.datumLineSelected = '';
      }
      state.gdSceneState.datumLineSelectMode = action.payload;
    },
    setDatumPlaneSelectMode: (
      state: GDState,
      action: PayloadAction<boolean>
    ) => {
      if (
        action.payload === false ||
        action.payload !== state.gdSceneState.datumPlaneSelectMode
      ) {
        state.gdSceneState.datumPlaneSelected = '';
      }
      state.gdSceneState.datumPlaneSelectMode = action.payload;
    },
    setForceVisibledDatums: (
      state: GDState,
      action: PayloadAction<string[]>
    ) => {
      state.gdSceneState.forceVisibledDatums = [...action.payload];
    },
    setDatumPointSelected: (state: GDState, action: PayloadAction<string>) => {
      state.gdSceneState.datumPointSelected = action.payload;
    },
    setDatumLineSelected: (state: GDState, action: PayloadAction<string>) => {
      state.gdSceneState.datumLineSelected = action.payload;
    },
    setDatumPlaneSelected: (state: GDState, action: PayloadAction<string>) => {
      state.gdSceneState.datumPlaneSelected = action.payload;
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setVisibility: (state: GDState) => {
      state.forceCallSelector = !state.forceCallSelector;
    }
    /* setPointOffsetToolDialogProps: (
      state: GDState,
      action: PayloadAction<PointOffsetToolDialogProps>
    ) => {
      state.gdDialogState.pointOffsetToolDialogProps = action.payload;
    } */
  }
});

export const {
  setAssemblyAndCollectedAssembly,
  setDatumManager,
  setMeasureToolsManager,
  setTest,
  removeTest,
  setKinematicSolver,
  setUIDisabled,
  setAllUIDisabled,
  toggleFullScreen,
  selectElement,
  selectSidePanelTab,
  setSelectedPoint,
  setSelectedDatumObject,
  setSelectedMeasureTool,
  setFormulaDialogOpen,
  setRecordingDialogOpen,
  setOpenDialogOpen,
  setSaveAsDialogProps,
  setConfirmDialogProps,
  setCopyFromExistingPointsDialogProps,
  setCfepOnSelected,
  setMovePointDialogProps,
  setMovePointOnMoved,
  treeViewDragExpanded,
  setDraggingNewElement,
  setDraggingElementAbsPath,

  setDraggingNewTestFlowNode,
  resetDragState,
  setVisibility,
  setAssembled,
  resetPositions,
  setOrbitControlsEnabled,
  setOrbitControlsEnabledManual,
  setViewDirection,
  setGDSceneGetThree,
  setMeasureElementPointMode,
  setMeasureElementPointSelected,
  setForceVisibledDatums,
  setDatumElementSelectMode,
  setDatumPointSelectMode,
  setDatumPointSelected,
  setDatumLineSelectMode,
  setDatumLineSelected,
  setDatumPlaneSelectMode,
  setDatumPlaneSelected,
  setMovingMode
  // setPointOffsetToolDialogProps
} = uitGeometryDesignerSlice.actions;

export default uitGeometryDesignerSlice.reducer;
