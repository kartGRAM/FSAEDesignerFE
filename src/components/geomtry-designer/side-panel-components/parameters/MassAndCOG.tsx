import * as React from 'react';
import Scalar from '@gdComponents/Scalar';
import Vector from '@gdComponents/Vector';
import {IElement, isMirrorElement, getRootAssembly} from '@gd/IElements';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import {useDispatch} from 'react-redux';
import {updateAssembly} from '@store/reducers/dataGeometryDesigner';
import {isAssembly} from '@gd/IElements/IAssembly';
import {setSelectedPoint} from '@store/reducers/uiTempGeometryDesigner';
import {Box} from '@mui/material';

export const MassAndCOG = React.memo((props: {element: IElement}) => {
  const {element} = props;
  const dispatch = useDispatch();
  const handleAutoChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
      const value = element.autoCalculateCenterOfGravity;
      value.value = checked;
      if (value.parent) dispatch(updateAssembly(getRootAssembly(value)));
    },
    [dispatch, element.autoCalculateCenterOfGravity]
  );

  return (
    <Box
      component="div"
      onFocus={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget))
          dispatch(
            setSelectedPoint({point: element.centerOfGravity, noFocus: true})
          );
      }}
    >
      <Scalar
        value={element.mass}
        unit="kg"
        min={0}
        disabled={isAssembly(element) || isMirrorElement(element)}
      />
      <FormControlLabel
        sx={{pl: 2}}
        control={
          <Checkbox
            disabled={isAssembly(element) || isMirrorElement(element)}
            checked={element.autoCalculateCenterOfGravity.value}
            onChange={handleAutoChange}
          />
        }
        label="Automatically calculate the center of gravity."
      />
      <Vector
        vector={element.centerOfGravity}
        disabled={
          element.autoCalculateCenterOfGravity.value ||
          isAssembly(element) ||
          isMirrorElement(element)
        }
      />
    </Box>
  );
});
