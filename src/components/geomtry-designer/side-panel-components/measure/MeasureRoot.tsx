/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {RootState} from '@store/store';
import {setSelectedPoint} from '@store/reducers/uiTempGeometryDesigner';

export default function MeasureRoot() {
  const dispatch = useDispatch();
  React.useEffect(() => {
    return () => {
      dispatch(setSelectedPoint(null));
    };
  }, []);

  // eslint-disable-next-line no-undef
  const component: JSX.Element | null = null;

  return component;
}
