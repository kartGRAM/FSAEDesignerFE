import React from 'react';
import MenuItem from '@mui/material/MenuItem';
import {useDispatch} from 'react-redux';
import {setTopAssembly} from '@app/store/reducers/dataGeometryDesigner';
import {getSuspension} from '@app/geometryDesigner/SampleGeometry';

import {DateTime} from 'luxon';

export default function OpenFromTemplates() {
  const dispatch = useDispatch();
  const handleOnClick = () => {
    const sample = getSuspension();
    dispatch(
      setTopAssembly({
        id: Number.MAX_SAFE_INTEGER,
        filename: 'KZ-RR11',
        note: '2013年度京都大学優勝車両',
        lastUpdated: DateTime.local().toString(),
        formulae: [],
        topAssembly: sample.getDataElement()
      })
    );
  };

  /* とりあえずテスト用に入れる
  useEffect(() => {
    handleOnClick();
  }, []); */

  return (
    <MenuItem onClick={handleOnClick}> New Assembly From Templates</MenuItem>
  );
}
