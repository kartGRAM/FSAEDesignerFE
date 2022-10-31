import * as React from 'react';
import * as THREE from 'three';
import {ThreeEvent, useFrame} from '@react-three/fiber';
import {useSelector, useDispatch} from 'react-redux';
import {selectElement} from '@app/store/reducers/uiTempGeometryDesigner';
import store, {RootState} from '@store/store';
import {IBody, trans, isBodyOfFrame, transQuaternion} from '@gd/IElements';
import {getMatrix3} from '@gd/NamedValues';
import {ConvexGeometry} from 'three/examples/jsm/geometries/ConvexGeometry';
import {MovePointTo} from '@gd/Driver';
import {setMovingMode} from '@store/reducers/uiTempGeometryDesigner';
import NodeSphere from './NodeSphere';
import {PivotControls} from './PivotControls/PivotControls';

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
  const isFrame = isBodyOfFrame(element);

  const moveThisComponent = useSelector((state: RootState) => {
    return (
      (!isFrame ||
        state.uigd.present.gdSceneState.assemblyMode !== 'FixedFrame') &&
      state.uitgd.selectedElementAbsPath === element.absPath &&
      state.uitgd.gdSceneState.assembled &&
      state.uitgd.gdSceneState.movingMode
    );
  });

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
    groupRef.current.position.copy(
      element.position.value.applyMatrix3(coMatrix)
    );
    groupRef.current.quaternion.copy(
      transQuaternion(element.rotation.value, coMatrix)
    );
    if (dragRef.current) {
      dragRef.current = false;
      const solver = store.getState().uitgd.kinematicSolver;
      if (solver && !solver.running) {
        const delta = targetRef.current
          .clone()
          .sub(trans(element.points[0]))
          .lengthSq();

        if (delta < 1e-10) {
          return;
        }

        const func = new MovePointTo(
          element.centerOfPoints,
          targetRef.current,
          solver
        );
        try {
          solver.solveObjectiveFunction(func, {logOutput: false});
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log('収束エラー');
        }
      }
    }
  });
  React.useEffect(() => {
    rotationRef.current = new THREE.Matrix3();
    if (!moveThisComponent) dispatch(setMovingMode(false));
  }, [moveThisComponent]);

  const nodes = element.getPoints();
  const pts = nodes.map((p) => p.value.applyMatrix3(coMatrix));
  const geometry = new ConvexGeometry(pts);

  const groupRef = React.useRef<THREE.Group>(null!);
  const materialRef = React.useRef<THREE.MeshBasicMaterial>(null!);
  const meshRef = React.useRef<THREE.Mesh>(null!);
  const initialPosition = trans(element.centerOfPoints, coMatrix);
  const rotationRef = React.useRef<THREE.Matrix3>(new THREE.Matrix3());
  const targetRef = React.useRef<THREE.Vector3>(new THREE.Vector3());
  const dragRef = React.useRef<boolean>(false);

  return (
    <>
      <group onDoubleClick={handleOnDoubleClick} ref={groupRef}>
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
      {moveThisComponent ? (
        <PivotControls
          displayValues={false}
          disableSliders
          matrix={new THREE.Matrix4()
            .setFromMatrix3(rotationRef.current)
            .setPosition(initialPosition)}
          scale={70}
          onDrag={(mL) => {
            const coMatrixT = coMatrix.clone().transpose();
            targetRef.current = new THREE.Vector3(
              mL.elements[12],
              mL.elements[13],
              mL.elements[14]
            ).applyMatrix3(coMatrixT);
            dragRef.current = true;
            rotationRef.current = new THREE.Matrix3().setFromMatrix4(mL);
          }}
        />
      ) : null}
    </>
  );
};
export default Body;
