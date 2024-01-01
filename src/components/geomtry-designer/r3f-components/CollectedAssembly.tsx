import * as React from 'react';
import * as THREE from 'three';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {isAArm} from '@gd/IElements/IAArm';
import {isBody} from '@gd/IElements/IBody';
import {isBellCrank} from '@gd/IElements/IBellCrank';
import {isBar} from '@gd/IElements/IBar';
import {isTire} from '@gd/IElements/ITire';
import {isSpringDumper} from '@gd/IElements/ISpringDumper';
import {isLinearBushing} from '@gd/IElements/ILinearBushing';
import Body from './Body';
import AArm from './AArm';
import Bar from './Bar';
import SpringDumper from './SpringDumper';
import BellCrank from './BellCrank';
import LinearBushing from './LinearBushing';
import Tire from './Tire';

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
        if (isTire(child)) return <Tire element={child} key={child.nodeID} />;
        if (isLinearBushing(child))
          return <LinearBushing element={child} key={child.nodeID} />;
        return null;
      })}
    </group>
  );
};
export default CollectedAssembly;
