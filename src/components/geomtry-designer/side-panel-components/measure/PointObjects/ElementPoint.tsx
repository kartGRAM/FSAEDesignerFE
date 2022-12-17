/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import store, {RootState} from '@store/store';
import {useSelector, useDispatch} from 'react-redux';
import {IElementPoint} from '@gd/measure/IPointObjects';
import Box from '@mui/material/Box';
import {setComponentVisualizationMode} from '@store/reducers/uiGeometryDesigner';
import {
  setMeasureElementPointMode,
  setMeasureElementPointSetterCallback
} from '@store/reducers/uiTempGeometryDesigner';
import {INamedVector3} from '@gd/INamedValues';

export function ElementPoint(props: {elementPoint?: IElementPoint}) {
  const {elementPoint} = props;
  const collectedAssembly = useSelector(
    (state: RootState) => state.uitgd.collectedAssembly
  );

  const dispatch = useDispatch();
  const [visModeRestored, setVisModeRestored] = React.useState(
    store.getState().uigd.present.gdSceneState.componentVisualizationMode
  );

  const selectedPoint = collectedAssembly?.children
    .find((child) => child.nodeID === elementPoint?.element)
    ?.getMeasurablePoints()
    .find((p) => p.nodeID === elementPoint?.point);

  const onNodeSelected = (node: INamedVector3) => {
    console.log(node.nodeID);
  };
  dispatch(setMeasureElementPointSetterCallback(onNodeSelected));

  React.useEffect(() => {
    setVisModeRestored(
      store.getState().uigd.present.gdSceneState.componentVisualizationMode
    );
    dispatch(setComponentVisualizationMode('WireFrameOnly'));
    dispatch(setMeasureElementPointMode(true));
    return () => {
      dispatch(setComponentVisualizationMode(visModeRestored));
      dispatch(setMeasureElementPointMode(false));
    };
  }, []);

  return <Box component="div">aaa</Box>;
}
