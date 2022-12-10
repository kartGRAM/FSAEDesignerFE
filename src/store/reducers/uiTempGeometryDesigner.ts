import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {INamedVector3} from '@gd/INamedValues';
import {ConfirmDialogProps} from '@gdComponents/dialog-components/ConfirmDialog';
import {SaveAsDialogProps} from '@gdComponents/dialog-components/SaveAsDialog';
import {CopyFromExistingPointsDialogProps} from '@gdComponents/dialog-components/CopyFromExistingPointsDialog';
import {MovePointDialogProps} from '@gdComponents/dialog-components/MovePointDialog';
import {IAssembly, Elements} from '@gd/IElements';
import {Quaternion, Vector3} from 'three';
import {RootState} from '@react-three/fiber';
import {GetState} from 'zustand';
import {KinematicSolver} from '@gd/kinematics/Solver';
import {DatumManager} from '@gd/measure/DatumObjects';
// import {PointOffsetToolDialogProps} from '@gdComponents/dialog-components/PointOffsetToolDialog';

export type SidePanelTab =
  | 'elements'
  | 'parameters'
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
  isFullScreen: boolean;
  fullScreenZIndex: number;
  selectedElementAbsPath: string;
  sidePanelState: SidePanelState;
  gdSceneState: GDSceneState;
  gdDialogState: GDDialogState;
  assembly: IAssembly | undefined;
  collectedAssembly: IAssembly | undefined;
  kinematicSolver: KinematicSolver | undefined;
  datumManager: DatumManager | undefined;

  treeViewDragExpanded: string[];
  draggingNewElement: Elements | null;
  draggingElementAbsPath: string;
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
  viewDirection: Quaternion | undefined;
  orbitControlsEnabled: boolean;
  orbitControlsEnabledManual: boolean;
  toggle: boolean;
  assembled: boolean;
  resetPositions: boolean;
  get: GetState<RootState> | null;
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
  selectedElementAbsPath: '',
  sidePanelState: {selectedTab: 'elements'},
  gdSceneState: {
    movingMode: false,
    orbitControlsEnabled: true,
    orbitControlsEnabledManual: true,
    selectedPoint: null,
    viewDirection: undefined,
    resetPositions: false,
    toggle: true, // その打ち消す
    assembled: false,
    get: null
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
  assembly: undefined,
  collectedAssembly: undefined,
  kinematicSolver: undefined,
  treeViewDragExpanded: [],
  draggingNewElement: null,
  draggingElementAbsPath: '',
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
          }
        | undefined
      >
    ) => {
      state.gdSceneState.assembled = false;
      if (!action.payload) {
        state.assembly = undefined;
        state.collectedAssembly = undefined;
        state.kinematicSolver = undefined;
        state.gdSceneState.movingMode = false;
        state.selectedElementAbsPath = '';
        return;
      }
      state.assembly = action.payload.assembly;
      state.collectedAssembly = action.payload.collectedAssembly;
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
    selectElement: (
      state: GDState,
      action: PayloadAction<{
        absPath: string;
      }>
    ) => {
      state.selectedElementAbsPath = action.payload.absPath;
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
  setKinematicSolver,
  setUIDisabled,
  toggleFullScreen,
  selectElement,
  selectSidePanelTab,
  setSelectedPoint,
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
  resetDragState,
  setVisibility,
  setAssembled,
  resetPositions,
  setOrbitControlsEnabled,
  setOrbitControlsEnabledManual,
  setViewDirection,
  setGDSceneGetThree,
  setMovingMode
  // setPointOffsetToolDialogProps
} = uitGeometryDesignerSlice.actions;

export default uitGeometryDesignerSlice.reducer;
