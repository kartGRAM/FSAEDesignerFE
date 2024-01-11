import * as React from 'react';
import Scalar from '@gdComponents/Scalar';
import Vector from '@gdComponents/Vector';
import {IElement} from '@gd/IElements';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import {useDispatch} from 'react-redux';
import {updateAssembly} from '@store/reducers/dataGeometryDesigner';

export const MassAndCOG = React.memo((props: {element: IElement}) => {
  const {element} = props;
  const dispatch = useDispatch();
  const handleAutoChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
      const value = element.autoCalculateCenterOfGravity;
      value.value = checked;
      if (value.parent) dispatch(updateAssembly(value));
    },
    []
  );
  return (
    <>
      <Scalar value={element.mass} unit="kg" min={0} />
      <FormControlLabel
        control={
          <Checkbox
            checked={element.autoCalculateCenterOfGravity.value}
            onChange={handleAutoChange}
          />
        }
        label="Automatic calculate center of gravity."
      />
      <Vector />
    </>
  );
});
