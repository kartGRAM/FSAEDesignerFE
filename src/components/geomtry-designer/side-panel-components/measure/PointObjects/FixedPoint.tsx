import React from 'react';
import {IFixedPoint} from '@gd/measure/IPointObjects';
import {FixedPoint as FixedPointObject} from '@gd/measure/PointObjects';
import {useDispatch} from 'react-redux';
import {IDatumObject} from '@gd/measure/IDatumObjects';
import Box from '@mui/material/Box';
import Vector from '@gdComponents/Vector';
import {NamedVector3} from '@gd/NamedValues';
import {setSelectedPoint} from '@store/reducers/uiTempGeometryDesigner';
import useUpdateEffect from '@hooks/useUpdateEffect';

export function FixedPoint(props: {
  point?: IFixedPoint;
  setApplyReady: React.Dispatch<React.SetStateAction<IDatumObject | undefined>>;
}) {
  const {point, setApplyReady} = props;

  const dispatch = useDispatch();

  const [position, setPosition] = React.useState(
    new NamedVector3({value: point?.position.getStringValue()})
  );

  useUpdateEffect(() => {
    const obj: IFixedPoint = new FixedPointObject({
      name: `datum point`,
      position: position.getStringValue()
    });
    setApplyReady(obj);
  }, [position]);

  React.useEffect(() => {
    dispatch(setSelectedPoint(null));
    return () => {
      dispatch(setSelectedPoint(null));
    };
  }, []);

  return (
    <Box component="div">
      <Vector
        vector={position}
        unit="mm"
        onUpdate={() => {
          setPosition(
            new NamedVector3({
              name: 'position',
              value: position.getStringValue()
            })
          );
        }}
      />
    </Box>
  );
}
