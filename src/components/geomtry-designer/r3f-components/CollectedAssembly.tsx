import * as React from 'react';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {isBody} from '@gd/IElements';
import Body from './Body';

const CollectedAssembly = () => {
  const assembly = useSelector(
    (state: RootState) => state.uitgd.collectedAssembly
  );
  if (!assembly) return null;
  const {children} = assembly;
  return (
    <>
      {children.map((child) => {
        if (isBody(child)) return <Body element={child} key={child.nodeID} />;
        return null;
      })}
    </>
  );
};
export default CollectedAssembly;
