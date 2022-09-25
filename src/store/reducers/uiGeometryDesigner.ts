import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {alpha} from '@mui/material/styles';

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

export interface DialogState {
  pointOffsetToolDialogInitialPosition: {
    x: number | null;
    y: number | null;
  };
}

export interface GDSceneState {
  projectionMode: 'Perspective' | 'Orthographic';
  componentVisualizationMode: 'ShowAllNodes' | 'WireFrameOnly';
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
  dialogState: DialogState;
  gdSceneState: GDSceneState;
}

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
    minWidth: 200,
    collapsed: false,
    fontColor: 0xcccccc,
    panelWidth: 450
  },
  parameterConfigState: {
    kinematicParamsExpanded: true,
    dynamicParamsExpanded: true
  },
  dialogState: {
    pointOffsetToolDialogInitialPosition: {
      x: null,
      y: null
    }
  },
  gdSceneState: {
    componentVisualizationMode: 'ShowAllNodes',
    projectionMode: 'Perspective'
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
    setPointOffsetToolDialogInitialPosition: (
      state: GDState,
      action: PayloadAction<{x: number | null; y: number | null}>
    ) => {
      state.dialogState.pointOffsetToolDialogInitialPosition = action.payload;
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
    }
  }
});

export const {
  resizePanel,
  kinematicParamsDefaultExpandedChange,
  dynamicParamsDefaultExpandedChange,
  setPointOffsetToolDialogInitialPosition,
  setProjectionMode,
  setComponentVisualizationMode
} = uiGeometryDesignerSlice.actions;

export default uiGeometryDesignerSlice.reducer;
