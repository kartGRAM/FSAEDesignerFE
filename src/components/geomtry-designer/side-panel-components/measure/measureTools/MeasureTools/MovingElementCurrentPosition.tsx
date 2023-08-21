import React from 'react';
import store, {RootState} from '@store/store';
import {useSelector, useDispatch} from 'react-redux';
import {
  IMovingElementCurrentPosition,
  IMeasureTool
} from '@gd/measure/measureTools/IMeasureTools';
import {MovingElementCurrentPosition as Tool} from '@gd/measure/measureTools/MeasureTools';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import {
  setMovingElementSelectMode,
  setMovingElementSelected,
  setForceHighlightElements
} from '@store/reducers/uiTempGeometryDesigner';
import MenuItem from '@mui/material/MenuItem';
import Target from '@gdComponents/svgs/Target';
import useUpdateEffect from '@hooks/useUpdateEffect';
import {IMovingElement, isMovingElement} from '@gd/IElements';

export function MovingElementCurrentPosition(props: {
  tool?: IMovingElementCurrentPosition;
  setApplyReady: React.Dispatch<React.SetStateAction<IMeasureTool | undefined>>;
}) {
  const {setApplyReady} = props;
  // eslint-disable-next-line react/destructuring-assignment
  const tool = props.tool?.clone();

  const dispatch = useDispatch();
  const ids = [React.useId()];

  const selectedElement = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.movingElementSelected
  );

  const selectMode = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.movingElementSelectMode
  );

  const collectedAssembly = useSelector(
    (state: RootState) => state.uitgd.collectedAssembly
  );

  const movingElementsAll: IMovingElement[] | undefined =
    collectedAssembly?.children.filter((e) => isMovingElement(e)) as
      | any[]
      | undefined;

  const selectedMovingElement = movingElementsAll?.find(
    (e) => e.nodeID === selectedElement
  );

  const defaultElement = tool?.element ?? undefined;

  const [element, setElement] = React.useState(defaultElement);

  const handleGetElement = (i: number) => {
    if (i === 0) {
      dispatch(setMovingElementSelectMode(true));
    }
  };

  const onResetSetterMode = React.useCallback(() => {
    dispatch(setMovingElementSelected(''));
    dispatch(setMovingElementSelectMode(false));
  }, [dispatch]);

  const shortCutKeys = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onResetSetterMode();
      }
    },
    [onResetSetterMode]
  );

  React.useEffect(() => {
    dispatch(setMovingElementSelectMode(false));
    dispatch(setForceHighlightElements([element?.nodeID ?? '']));
    window.addEventListener('keydown', shortCutKeys, true);
    return () => {
      dispatch(setMovingElementSelectMode(false));
      dispatch(setForceHighlightElements([]));
      window.removeEventListener('keydown', shortCutKeys, true);
    };
  }, [dispatch, element?.nodeID, shortCutKeys]);

  useUpdateEffect(() => {
    if (selectedMovingElement) {
      setElement(selectedMovingElement);
    }
    onResetSetterMode();
  }, [selectedMovingElement]);

  useUpdateEffect(() => {
    if (element && movingElementsAll) {
      const obj: IMovingElementCurrentPosition = new Tool(
        {
          name: `tool`,
          element
        },
        movingElementsAll
      );
      setApplyReady(obj);
    } else {
      setApplyReady(undefined);
    }
    dispatch(setForceHighlightElements([element?.nodeID ?? '']));
  }, [element]);

  const handleChanged = (nodeID: string, i: number) => {
    if (i === 0) {
      setElement(
        movingElementsAll?.find((element) => element.nodeID === nodeID)
      );
    }
  };

  const {uitgd} = store.getState();
  const menuZIndex =
    uitgd.fullScreenZIndex + uitgd.menuZIndex + uitgd.dialogZIndex;

  return (
    <Box component="div">
      {['Select a moving component'].map((str, i) => (
        <FormControl
          key={str}
          sx={{
            m: 1,
            mt: 3,
            minWidth: 250,
            display: 'flex',
            flexDirection: 'row'
          }}
        >
          <InputLabel htmlFor={ids[i]}>{str}</InputLabel>
          <Select
            disabled={selectMode}
            value={element?.nodeID ?? ''}
            id={ids[i]}
            label={str}
            onChange={(e) => handleChanged(e.target.value, i)}
            sx={{flexGrow: '1'}}
            MenuProps={{
              sx: {zIndex: menuZIndex}
            }}
          >
            <MenuItem aria-label="None" value="">
              <em>None</em>
            </MenuItem>
            {(movingElementsAll ?? []).map((e) => (
              <MenuItem value={e.nodeID} key={e.nodeID}>
                {e.name.value}
              </MenuItem>
            ))}
          </Select>
          <Target
            sx={{mt: 1}}
            title={str}
            onClick={() => handleGetElement(i)}
            disabled={true && selectMode}
          />
        </FormControl>
      ))}
    </Box>
  );
}
