import * as React from 'react';
import * as THREE from 'three';
import {useSelector, useDispatch} from 'react-redux';
import {selectElement} from '@app/store/reducers/uiTempGeometryDesigner';
import {RootState} from '@store/store';
import {IBody, trans} from '@gd/IElements';
import {getMatrix3} from '@gd/NamedValues';
import {ConvexGeometry} from 'three/examples/jsm/geometries/ConvexGeometry';

const Body = (props: {element: IBody}) => {
  const {element} = props;
  const coMatrix = getMatrix3(
    useSelector((state: RootState) => state.dgd.present.transCoordinateMatrix)
  );

  const dispatch = useDispatch();

  const handleOnDoubleClick = React.useCallback(() => {
    dispatch(selectElement({absPath: element.absPath}));
  }, [element.absPath]);

  if (element.visible.value === false) {
    return null;
  }

  const nodes = element.getPoints().map((p) => trans(p, coMatrix));
  const geometry = new ConvexGeometry(nodes);

  const ba = new THREE.BufferAttribute(
    new Float32Array(nodes.map((v) => [v.x, v.y, v.z]).flat()),
    3
  );
  const pGeometry = new THREE.BufferGeometry();
  pGeometry.setAttribute('position', ba);
  return (
    <group onDoubleClick={handleOnDoubleClick}>
      <mesh args={[geometry]}>
        <meshBasicMaterial args={[{color: 0x00ffff}]} wireframe />
      </mesh>
      <points args={[pGeometry]}>
        <pointsMaterial
          sizeAttenuation
          args={[
            {
              size: 10,
              color: 0x00ff00
            }
          ]}
        />
      </points>
    </group>
  );
};
export default Body;
