import * as React from 'react';
import * as THREE from 'three';
import {ThreeEvent, useFrame} from '@react-three/fiber';
import {useSelector, useDispatch} from 'react-redux';
import {selectElement} from '@app/store/reducers/uiTempGeometryDesigner';
import store, {RootState} from '@store/store';
import {IBody, trans, isBodyOfFrame, transQuaternion} from '@gd/IElements';
import {getMatrix3} from '@gd/NamedValues';
import {ConvexGeometry} from 'three/examples/jsm/geometries/ConvexGeometry';
import {MovePointTo} from '@gd/kinematics/Driver';
import {setMovingMode} from '@store/reducers/uiTempGeometryDesigner';
import useUpdateEffect from '@app/hooks/useUpdateEffect';
import NodeSphere from './NodeSphere';
import {PivotControls} from './PivotControls/PivotControls';
import MeasurablePoint from './MeasurablePointSphere';

const Body = (props: {element: IBody}) => {
  const {element} = props;
  const coMatrix = getMatrix3(
    useSelector((state: RootState) => state.dgd.present.transCoordinateMatrix)
  );

  const dispatch = useDispatch();

  const handleOnDoubleClick = React.useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (!meshRef.current.visible) return;
      const state = store.getState().uitgd;
      if (!state.gdSceneState.datumElementSelectMode && state.uiDisabled)
        return;
      e.stopPropagation();
      dispatch(
        selectElement({
          absPath: element.absPath,
          cancelTabChange: state.gdSceneState.datumElementSelectMode
        })
      );
    },
    [element.absPath, store]
  );
  const isFrame = isBodyOfFrame(element);

  const moveThisComponent = useSelector((state: RootState) => {
    return (
      (!isFrame || state.dgd.present.options.assemblyMode !== 'FixedFrame') &&
      state.uitgd.selectedElementAbsPath === element.absPath &&
      state.uitgd.gdSceneState.assembled &&
      state.uitgd.gdSceneState.movingMode
    );
  });

  const nodes = element.getPoints();
  const measurablePoints = element.getMeasurablePoints();
  const getInitialPosition = React.useCallback(() => {
    const state = store.getState();
    const point =
      nodes.find(
        (p) =>
          p.nodeID ===
          state.uitgd.gdSceneState.selectedPoint?.at(0)?.point.nodeID
      ) ?? element.centerOfPoints;
    return point;
  }, [nodes]);
  const pts = nodes.map((p) => p.value.applyMatrix3(coMatrix));

  useFrame(() => {
    const state = store.getState();
    const selectedPath = state.uitgd.selectedElementAbsPath;
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
        const point = getInitialPosition();
        const delta = targetRef.current.clone().sub(trans(point)).lengthSq();

        if (delta < 1e-10) {
          return;
        }

        const func = new MovePointTo(point, targetRef.current, solver);
        try {
          solver.solveObjectiveFunction(func, {logOutput: false});
        } catch (e) {
          // eslint-disable-next-line no-console
          // console.log('収束エラー');
        }
      }
    }
    if (
      moveThisComponent &&
      resetStateRef.current !== state.uitgd.gdSceneState.resetPositions
    ) {
      pivotRef.current.matrix = new THREE.Matrix4().setPosition(
        trans(getInitialPosition(), coMatrix)
      );
      resetStateRef.current = !resetStateRef.current;
    }
  });
  useUpdateEffect(() => {
    if (!moveThisComponent) dispatch(setMovingMode(false));
    else {
      pivotRef.current.matrix = new THREE.Matrix4().setPosition(
        trans(getInitialPosition(), coMatrix)
      );
    }
  }, [moveThisComponent]);

  const geometry = new ConvexGeometry(pts);

  const groupRef = React.useRef<THREE.Group>(null!);
  const materialRef = React.useRef<THREE.MeshBasicMaterial>(null!);
  const meshRef = React.useRef<THREE.Mesh>(null!);
  const targetRef = React.useRef<THREE.Vector3>(new THREE.Vector3());
  const dragRef = React.useRef<boolean>(false);
  const pivotRef = React.useRef<THREE.Group>(null!);
  const resetStateRef = React.useRef<boolean>(
    store.getState().uitgd.gdSceneState.resetPositions
  );

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
        {measurablePoints.map((p) => (
          <MeasurablePoint node={p} key={p.nodeID} />
        ))}
      </group>
      {moveThisComponent ? (
        <PivotControls
          ref={pivotRef}
          displayValues={false}
          disableSliders
          scale={70}
          onDrag={(mL) => {
            const coMatrixT = coMatrix.clone().transpose();
            targetRef.current = new THREE.Vector3(
              mL.elements[12],
              mL.elements[13],
              mL.elements[14]
            ).applyMatrix3(coMatrixT);
            dragRef.current = true;
          }}
        />
      ) : null}
    </>
  );
};
export default Body;
