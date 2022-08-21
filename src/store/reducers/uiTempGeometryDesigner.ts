import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {IDataVector3} from '@gd/INamedValues';
import {ConfirmDialogProps} from '@gdComponents/dialog-components/ConfirmDialog';
import {SaveAsDialogProps} from '@gdComponents/dialog-components/SaveAsDialog';
import {IAssembly, Elements} from '@gd/IElements';
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

export interface GDState {
  uiDisabled: boolean;
  isFullScreen: boolean;
  fullScreenZIndex: number;
  selectedElementAbsPath: string;
  sidePanelState: SidePanelState;
  gdSceneState: GDSceneState;
  gdDialogState: GDDialogState;
  assembly: IAssembly | undefined;

  treeViewDragExpanded: string[];
  draggingNewElement: Elements | null;
}
interface IDataVector3WithColor extends IDataVector3 {
  color?: number;
}

export interface GDSceneState {
  selectedPoint: IDataVector3WithColor[] | null;
}

export interface GDDialogState {
  formulaDialogOpen: boolean;
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
    selectedPoint: null
  },
  gdDialogState: {
    formulaDialogOpen: false,
    openDialogOpen: false,
    saveAsDialogProps: undefined,
    confirmDialogProps: undefined
  },
  assembly: undefined,
  treeViewDragExpanded: [],
  draggingNewElement: null
};

export const uitGeometryDesignerSlice = createSlice({
  name: 'uitGeometryDesigner',
  initialState,
  reducers: {
    setAssembly: (
      state: GDState,
      action: PayloadAction<IAssembly | undefined>
    ) => {
      state.assembly = action.payload;
    },
    setDraggingNewElement: (
      state: GDState,
      action: PayloadAction<Elements | null>
    ) => {
      state.draggingNewElement = action.payload;
    },
    treeViewDragExpanded: (state: GDState, action: PayloadAction<string[]>) => {
      state.treeViewDragExpanded = action.payload;
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
      action: PayloadAction<{
        point: IDataVector3WithColor[] | IDataVector3WithColor | null;
      }>
    ) => {
      const {point} = action.payload;
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
  setAssembly,
  setUIDisabled,
  toggleFullScreen,
  selectElement,
  selectSidePanelTab,
  setSelectedPoint,
  setFormulaDialogOpen,
  setOpenDialogOpen,
  setSaveAsDialogProps,
  setConfirmDialogProps,
  treeViewDragExpanded,
  setDraggingNewElement
  // setPointOffsetToolDialogProps
} = uitGeometryDesignerSlice.actions;

export default uitGeometryDesignerSlice.reducer;
