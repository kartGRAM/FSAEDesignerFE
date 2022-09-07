import * as React from 'react';
import {ThreeEvent} from '@react-three/fiber';
import {Sphere} from '@react-three/drei';
import {useSelector, useDispatch} from 'react-redux';
import {selectElement} from '@app/store/reducers/uiTempGeometryDesigner';
import {RootState} from '@store/store';
import {IBody, trans} from '@gd/IElements';
import {getMatrix3} from '@gd/NamedValues';
import {ConvexGeometry} from 'three/examples/jsm/geometries/ConvexGeometry';
import {setSelectedPoint} from '@store/reducers/uiTempGeometryDesigner';

const Body = (props: {element: IBody}) => {
  const {element} = props;
  const coMatrix = getMatrix3(
    useSelector((state: RootState) => state.dgd.present.transCoordinateMatrix)
  );

  const pwcs = (
    useSelector((state: RootState) => state.uitgd.gdSceneState.selectedPoint) ??
    []
  ).map((pwc) => ({id: pwc.point.nodeID, color: pwc.color ?? 0xff0000}));

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
      {pts.map((v, i) => {
        const color = pwcs.find((point) => point.id === nodes[i].nodeID)?.color;
        return (
          <Sphere
            position={v}
            args={[5, 16, 16]}
            key={nodes[i].absPath}
            onDoubleClick={(e) => {
              handleOnDoubleClick(e);
              dispatch(setSelectedPoint({point: nodes[i]}));
            }}
          >
            <meshBasicMaterial color={color ?? 0x00ff00} />
          </Sphere>
        );
      })}
    </group>
  );
};
export default Body;

/* <points
            args={[pGeometry]}
            key={nodes[i].absPath}
            onDoubleClick={() => {
              console.log('dblClick');
            }}
          >
            <pointsMaterial
              sizeAttenuation
              args={[
                {
                  size: 10,
                  color: 0x00ff00
                }
              ]}
            />
            </points> */
