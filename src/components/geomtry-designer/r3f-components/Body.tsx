import * as React from 'react';
import * as THREE from 'three';
import {ThreeEvent, useFrame} from '@react-three/fiber';
import {useSelector, useDispatch} from 'react-redux';
import {
  selectElement,
  setOrbitControlsEnabled
} from '@app/store/reducers/uiTempGeometryDesigner';
import store, {RootState} from '@store/store';
import {IBody, trans, isBodyOfFrame} from '@gd/IElements';
import {getMatrix3} from '@gd/NamedValues';
import {ConvexGeometry} from 'three/examples/jsm/geometries/ConvexGeometry';
import NodeSphere from './NodeSphere';
import {PivotControls} from './PivotControls/PivotControls';

const Body = (props: {element: IBody}) => {
  const {element} = props;
  const materialRef = React.useRef<THREE.MeshBasicMaterial>(null!);
  const meshRef = React.useRef<THREE.Mesh>(null!);
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

  const isMoveTarget = useSelector(
    (state: RootState) => state.uitgd.selectedElementAbsPath === element.absPath
  );

  const isAssembled = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.assembled
  );

  const assemblyMode = useSelector(
    (state: RootState) => state.uigd.present.gdSceneState.assemblyMode
  );

  const isFrame = isBodyOfFrame(element);

  useFrame(() => {
    const selectedPath = store.getState().uitgd.selectedElementAbsPath;
    const isSelected = !!selectedPath && element.absPath.includes(selectedPath);
    let color = 0x00ffff;
    if (isSelected) {
      color = 0xffa500;
    }
    materialRef.current?.color.set(color);
    if (meshRef.current) {
      meshRef.current.visible = element.visible.value ?? false;
    }
  });

  const nodes = element.getPoints();
  const pts = nodes.map((p) => trans(p, coMatrix));
  const geometry = new ConvexGeometry(pts);
  const box = new THREE.Box3().setFromPoints(pts);
  const handlePosition = box.max.clone().add(box.min).multiplyScalar(0.5);

  const object3D = (
    <group onDoubleClick={handleOnDoubleClick}>
      <mesh args={[geometry]} ref={meshRef}>
        <meshBasicMaterial
          args={[{color: 0x00ffff}]}
          wireframe
          wireframeLinewidth={3}
          ref={materialRef}
        />
      </mesh>
      {nodes.map((node) => (
        <NodeSphere node={node} key={node.nodeID} />
      ))}
    </group>
  );

  return (!isFrame || assemblyMode !== 'FixedFrame') &&
    isMoveTarget &&
    isAssembled ? (
    <PivotControls
      offset={handlePosition}
      depthTest={false}
      scale={70}
      onDragStart={() => {
        dispatch(setOrbitControlsEnabled(false));
      }}
      onDragEnd={() => {
        dispatch(setOrbitControlsEnabled(true));
      }}
    >
      {object3D}
    </PivotControls>
  ) : (
    object3D
  );
};
export default Body;
