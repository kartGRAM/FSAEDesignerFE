import * as React from 'react';
import {ThreeEvent} from '@react-three/fiber';
import {useSelector, useDispatch} from 'react-redux';
import {selectElement} from '@app/store/reducers/uiTempGeometryDesigner';
import {RootState} from '@store/store';
import {IBody, trans} from '@gd/IElements';
import {getMatrix3} from '@gd/NamedValues';
import {ConvexGeometry} from 'three/examples/jsm/geometries/ConvexGeometry';
import NodeSphere from './NodeSphere';

const Body = (props: {element: IBody}) => {
  const {element} = props;
  const coMatrix = getMatrix3(
    useSelector((state: RootState) => state.dgd.present.transCoordinateMatrix)
  );

  const dispatch = useDispatch();

  const handleOnDoubleClick = React.useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      dispatch(selectElement({absPath: element.absPath}));
    },
    [element.absPath]
  );

  if (element.visible.value === false) {
    return null;
  }

  const nodes = element.getPoints();
  const pts = nodes.map((p) => trans(p, coMatrix));
  const geometry = new ConvexGeometry(pts);

  return (
    <group onDoubleClick={handleOnDoubleClick}>
      <mesh args={[geometry]}>
        <meshBasicMaterial args={[{color: 0x00ffff}]} wireframe />
      </mesh>
      {nodes.map((node) => (
        <NodeSphere node={node} key={node.nodeID} />
      ))}
    </group>
  );
};
export default Body;
