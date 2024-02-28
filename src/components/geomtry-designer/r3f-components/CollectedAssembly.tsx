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
import {isTorsionSpring} from '@gd/IElements/ITorsionSpring';
import Body from './Body';
import AArm from './AArm';
import Bar from './Bar';
import SpringDumper from './SpringDumper';
import TorsionSpring from './TorsionSpring';
import BellCrank from './BellCrank';
import LinearBushing from './LinearBushing';
import Tire from './Tire';

const CollectedAssembly = () => {
  const assembly = useSelector(
    (state: RootState) => state.uitgd.collectedAssembly
  );

  const groupRef = React.useRef<THREE.Group>(null!);
  const children = assembly?.children ?? [];
  const i = React.useRef(0);
  i.current = (i.current + 1) % 100;
  return (
    <group ref={groupRef} name="collectedAssembly">
      {children.map((child) => {
        if (isBody(child))
          return <Body element={child} key={child.nodeID + i.current} />;
        if (isAArm(child))
          return <AArm element={child} key={child.nodeID + i.current} />;
        if (isSpringDumper(child))
          return (
            <SpringDumper element={child} key={child.nodeID + i.current} />
          );
        if (isBar(child))
          return <Bar element={child} key={child.nodeID + i.current} />;
        if (isBellCrank(child))
          return <BellCrank element={child} key={child.nodeID + i.current} />;
        if (isTire(child))
          return <Tire element={child} key={child.nodeID + i.current} />;
        if (isLinearBushing(child))
          return (
            <LinearBushing element={child} key={child.nodeID + i.current} />
          );
        if (isTorsionSpring(child))
          return (
            <TorsionSpring element={child} key={child.nodeID + i.current} />
          );
        return null;
      })}
    </group>
  );
};
export default CollectedAssembly;
