import * as React from 'react';
import * as THREE from 'three';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {
  isBody,
  isAArm,
  isBar,
  isBellCrank,
  isSpringDumper,
  isLinearBushing
} from '@gd/IElements';
import Body from './Body';
import AArm from './AArm';
import Bar from './Bar';
import SpringDumper from './SpringDumper';
import BellCrank from './BellCrank';
import LinearBushing from './LinearBushing';

const CollectedAssembly = () => {
  const assembly = useSelector(
    (state: RootState) => state.uitgd.collectedAssembly
  );

  const groupRef = React.useRef<THREE.Group>(null!);
  const children = assembly?.children ?? [];

  return (
    <group ref={groupRef} name="collectedAssembly">
      {children.map((child) => {
        if (isBody(child)) return <Body element={child} key={child.nodeID} />;
        if (isAArm(child)) return <AArm element={child} key={child.nodeID} />;
        if (isSpringDumper(child))
          return <SpringDumper element={child} key={child.nodeID} />;
        if (isBar(child)) return <Bar element={child} key={child.nodeID} />;
        if (isBellCrank(child))
          return <BellCrank element={child} key={child.nodeID} />;
        if (isLinearBushing(child))
          return <LinearBushing element={child} key={child.nodeID} />;
        return null;
      })}
    </group>
  );
};
export default CollectedAssembly;
