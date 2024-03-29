import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {alpha} from '@mui/material/styles';
import {BackgroundVariant} from 'reactflow';

export interface IAssemblyTreeViewState {
  fontColor: number;
  borderLeft: string;
  selectedColor: number;
}

export interface ISidebarState {
  backgroundColor: number;
  selectedBgColor: number;
  iconColor: number;
}

export interface IAppBarState {
  backgroundColor: number;
  fontColor: number;
}

export interface ISidePanelState {
  backgroundColor: number;
  minWidth: number;
  collapsed: boolean;
  fontColor: number;
  panelWidth: number;
}

export interface GDParameterConfigState {
  kinematicParamsExpanded: boolean;
  dynamicParamsExpanded: boolean;
}

export interface MeasurePanelState {
  DatumObjectsExpanded: boolean;
  MeasureToolsExpanded: boolean;
  ROVariablesExpanded: boolean;
}

export interface AnalysisPanelState {
  flowCanvasBackgroundVariant: BackgroundVariant;
  widthSpaceAligningNodes: number;
  heightSpaceAligningNodes: number;
}

export interface ChartState {
  settingPanelDefaultOpen: boolean;
  settingPanelWidth: string;
}

export interface DialogState {
  recordingDialogInitialPosition: {
    x: number | null;
    y: number | null;
  };
  pointOffsetToolDialogInitialPosition: {
    x: number | null;
    y: number | null;
  };
  movePointDialogInitialPosition: {
    x: number | null;
    y: number | null;
  };
  copyFromExistingPointDialogInitialPosition: {
    x: number | null;
    y: number | null;
  };
  measureToolDialogInitialPosition: {
    x: number | null;
    y: number | null;
  };
  datumDialogInitialPosition: {
    x: number | null;
    y: number | null;
  };
  caseResultDialogInitialPosition: {
    x: number | null;
    y: number | null;
  };
  moveDialogInitialPosition: {
    x: number | null;
    y: number | null;
  };
}

export interface GDSceneState {
  showGroundPlaneGrid: boolean;
  projectionMode: 'Perspective' | 'Orthographic';
  componentVisualizationMode: 'ShowAllNodes' | 'WireFrameOnly';
  gridSize: number;
  gridSegmentLength: number;
  showOBB: boolean;
  steadySkidpadViewerState: SteadySkidpadViewerState;
  forceViewerState: ForceViewerState;
}

export interface SteadySkidpadViewerState {
  showLapTime: boolean;
  showVelocity: boolean;
  showOmega: boolean;
  showCenterRadius: boolean;
  showInnerRadius: boolean;

  showStartLine: boolean;
  showCenterLine: boolean;
  showInnerLine: boolean;
  showOuterLine: boolean;
  showInnerCones: boolean;
  coneInterval: number; // m
  roadWidth: number; // m
}

export interface ForceViewerState {
  showColorBar: boolean;
  showParentName: boolean;
  showMagnitude: boolean;
  showLocalXYZ: boolean;
  showGlobalXYZ: boolean;

  showInertiaForce: boolean;
  showBearingForce: boolean;
  showTireFriction: boolean;
  showBarForce: boolean;
  showSpringForce: boolean;
  showAArmForce: boolean;
  showBellCrankForce: boolean;
  showBodyForce: boolean;
  showLinearBushingForce: boolean;
  showTorsionSpringForce: boolean;
}

export interface GDState {
  backgroundColor: number;
  enabledColorDark: number;
  enabledColorLight: number;
  appBarState: IAppBarState;
  sidebarState: ISidebarState;
  sidePanelState: ISidePanelState;
  assemblyTreeViewState: IAssemblyTreeViewState;
  parameterConfigState: GDParameterConfigState;
  measurePanelState: MeasurePanelState;
  analysisPanelState: AnalysisPanelState;
  chartState: ChartState;
  dialogState: DialogState;
  gdSceneState: GDSceneState;
}

export const initialSteadySkidpadViewerState: SteadySkidpadViewerState = {
  showLapTime: true,
  showVelocity: true,
  showOmega: true,
  showStartLine: true,
  showCenterRadius: true,
  showInnerRadius: true,
  showCenterLine: true,
  showInnerLine: true,
  showOuterLine: true,
  showInnerCones: true,
  coneInterval: 3,
  roadWidth: 2
};

export const initialForceViewerState: ForceViewerState = {
  showColorBar: true,
  showInertiaForce: true,
  showBearingForce: true,
  showTireFriction: true,
  showBarForce: true,
  showSpringForce: true,
  showAArmForce: true,
  showBellCrankForce: true,
  showBodyForce: false,
  showLinearBushingForce: true,
  showTorsionSpringForce: true,
  showParentName: true,
  showMagnitude: true,
  showLocalXYZ: true,
  showGlobalXYZ: true
};

const initialState: GDState = {
  backgroundColor: 0x222222,
  enabledColorDark: 0x017384,
  enabledColorLight: 0x019fb6,
  assemblyTreeViewState: {
    fontColor: 0xdddddd,
    selectedColor: 0x019fb6,
    borderLeft: `1px dashed ${alpha('#ffffff', 0.4)}`
  },
  appBarState: {
    backgroundColor: 0x333333,
    fontColor: 0xeeeeee
  },
  sidebarState: {
    selectedBgColor: 0x555555,
    backgroundColor: 0x333333,
    iconColor: 0xdddddd
  },
  sidePanelState: {
    backgroundColor: 0x2e2e2e,
    minWidth: 300,
    collapsed: false,
    fontColor: 0xcccccc,
    panelWidth: 450
  },
  parameterConfigState: {
    kinematicParamsExpanded: true,
    dynamicParamsExpanded: true
  },
  measurePanelState: {
    DatumObjectsExpanded: true,
    MeasureToolsExpanded: true,
    ROVariablesExpanded: true
  },
  analysisPanelState: {
    flowCanvasBackgroundVariant: BackgroundVariant.Dots,
    widthSpaceAligningNodes: 50,
    heightSpaceAligningNodes: 50
  },
  dialogState: {
    recordingDialogInitialPosition: {
      x: null,
      y: null
    },
    pointOffsetToolDialogInitialPosition: {
      x: null,
      y: null
    },
    movePointDialogInitialPosition: {
      x: null,
      y: null
    },
    copyFromExistingPointDialogInitialPosition: {
      x: null,
      y: null
    },
    measureToolDialogInitialPosition: {
      x: null,
      y: null
    },
    datumDialogInitialPosition: {
      x: null,
      y: null
    },
    caseResultDialogInitialPosition: {
      x: null,
      y: null
    },
    moveDialogInitialPosition: {
      x: null,
      y: null
    }
  },
  gdSceneState: {
    showGroundPlaneGrid: false,
    componentVisualizationMode: 'ShowAllNodes',
    projectionMode: 'Perspective',
    gridSize: 5000,
    gridSegmentLength: 290,
    showOBB: false,
    steadySkidpadViewerState: initialSteadySkidpadViewerState,
    forceViewerState: initialForceViewerState
  },
  chartState: {
    settingPanelWidth: '30%',
    settingPanelDefaultOpen: false
  }
};

export const uiGeometryDesignerSlice = createSlice({
  name: 'uiGeometryDesigner',
  initialState,
  reducers: {
    resizePanel: (state: GDState, action: PayloadAction<number>) => {
      state.sidePanelState.panelWidth = action.payload;
      state.sidePanelState.collapsed = false;
      if (action.payload < state.sidePanelState.minWidth) {
        state.sidePanelState.collapsed = true;
      }
    },
    kinematicParamsDefaultExpandedChange: (
      state: GDState,
      action: PayloadAction<boolean>
    ) => {
      state.parameterConfigState.kinematicParamsExpanded = action.payload;
    },
    dynamicParamsDefaultExpandedChange: (
      state: GDState,
      action: PayloadAction<boolean>
    ) => {
      state.parameterConfigState.dynamicParamsExpanded = action.payload;
    },
    datumObjectAccordionDefaultExpandedChange: (
      state: GDState,
      action: PayloadAction<boolean>
    ) => {
      state.measurePanelState.DatumObjectsExpanded = action.payload;
    },
    measureToolsAccordionDefaultExpandedChange: (
      state: GDState,
      action: PayloadAction<boolean>
    ) => {
      state.measurePanelState.MeasureToolsExpanded = action.payload;
    },
    roVariablesAccordionDefaultExpandedChange: (
      state: GDState,
      action: PayloadAction<boolean>
    ) => {
      state.measurePanelState.ROVariablesExpanded = action.payload;
    },
    setRecordingDialogPosition: (
      state: GDState,
      action: PayloadAction<{x: number | null; y: number | null}>
    ) => {
      state.dialogState.recordingDialogInitialPosition = action.payload;
    },
    setPointOffsetToolDialogPosition: (
      state: GDState,
      action: PayloadAction<{x: number | null; y: number | null}>
    ) => {
      state.dialogState.pointOffsetToolDialogInitialPosition = action.payload;
    },
    setMovePointDialogPosition: (
      state: GDState,
      action: PayloadAction<{x: number | null; y: number | null}>
    ) => {
      state.dialogState.movePointDialogInitialPosition = action.payload;
    },
    setCopyFromExistingPointDialogPosition: (
      state: GDState,
      action: PayloadAction<{x: number | null; y: number | null}>
    ) => {
      state.dialogState.copyFromExistingPointDialogInitialPosition =
        action.payload;
    },
    setMoveDialogPosition: (
      state: GDState,
      action: PayloadAction<{x: number | null; y: number | null}>
    ) => {
      state.dialogState.moveDialogInitialPosition = action.payload;
    },
    setCaseResultDialogPosition: (
      state: GDState,
      action: PayloadAction<{x: number | null; y: number | null}>
    ) => {
      state.dialogState.caseResultDialogInitialPosition = action.payload;
    },
    setDatumDialogPosition: (
      state: GDState,
      action: PayloadAction<{x: number | null; y: number | null}>
    ) => {
      state.dialogState.moveDialogInitialPosition = action.payload;
    },
    setMeasureToolDialogPosition: (
      state: GDState,
      action: PayloadAction<{x: number | null; y: number | null}>
    ) => {
      state.dialogState.measureToolDialogInitialPosition = action.payload;
    },
    setProjectionMode: (
      state: GDState,
      action: PayloadAction<'Perspective' | 'Orthographic'>
    ) => {
      state.gdSceneState.projectionMode = action.payload;
    },
    setComponentVisualizationMode: (
      state: GDState,
      action: PayloadAction<'ShowAllNodes' | 'WireFrameOnly'>
    ) => {
      state.gdSceneState.componentVisualizationMode = action.payload;
    },
    setFlowCanvasBackgroundVariant: (
      state: GDState,
      action: PayloadAction<BackgroundVariant>
    ) => {
      state.analysisPanelState.flowCanvasBackgroundVariant = action.payload;
    },
    setChartSettingPanelWidth: (
      state: GDState,
      action: PayloadAction<string>
    ) => {
      state.chartState.settingPanelWidth = action.payload;
    },
    setChartSettingPanelDefaultOpen: (
      state: GDState,
      action: PayloadAction<boolean>
    ) => {
      state.chartState.settingPanelDefaultOpen = action.payload;
    },
    // GDSceneState
    setGroundGridShow: (state: GDState, action: PayloadAction<boolean>) => {
      state.gdSceneState.showGroundPlaneGrid = action.payload;
    },
    setGDSceneGridSize: (state: GDState, action: PayloadAction<number>) => {
      state.gdSceneState.gridSize = action.payload;
    },
    setGDSceneGridSegmentLength: (
      state: GDState,
      action: PayloadAction<number>
    ) => {
      state.gdSceneState.gridSegmentLength = action.payload;
    },
    setGDSceneShowOBBs: (state: GDState, action: PayloadAction<boolean>) => {
      state.gdSceneState.showOBB = action.payload;
    },
    // SkidpadViewerState
    setGDSceneSkidpadViewerState: (
      state: GDState,
      action: PayloadAction<SteadySkidpadViewerState>
    ) => {
      state.gdSceneState.steadySkidpadViewerState = action.payload;
    },
    setGDSceneForceViewerState: (
      state: GDState,
      action: PayloadAction<ForceViewerState>
    ) => {
      state.gdSceneState.forceViewerState = action.payload;
    }
  }
});

export const {
  resizePanel,
  kinematicParamsDefaultExpandedChange,
  dynamicParamsDefaultExpandedChange,
  setRecordingDialogPosition,
  setPointOffsetToolDialogPosition,
  setMovePointDialogPosition,
  setCopyFromExistingPointDialogPosition,
  setDatumDialogPosition,
  setMeasureToolDialogPosition,
  setMoveDialogPosition,
  setCaseResultDialogPosition,
  setProjectionMode,
  setGroundGridShow,
  setComponentVisualizationMode,
  datumObjectAccordionDefaultExpandedChange,
  measureToolsAccordionDefaultExpandedChange,
  roVariablesAccordionDefaultExpandedChange,
  setFlowCanvasBackgroundVariant,
  setChartSettingPanelWidth,
  setChartSettingPanelDefaultOpen,
  setGDSceneGridSize,
  setGDSceneShowOBBs,
  setGDSceneGridSegmentLength,
  setGDSceneSkidpadViewerState,
  setGDSceneForceViewerState
} = uiGeometryDesignerSlice.actions;

export default uiGeometryDesignerSlice.reducer;
