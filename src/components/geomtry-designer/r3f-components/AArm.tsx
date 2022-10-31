import * as React from 'react';
import {Vector3, Plane, Matrix4, Matrix3, Group} from 'three';
import {ThreeEvent, useFrame} from '@react-three/fiber';
import {Line} from '@react-three/drei';
import {useSelector, useDispatch} from 'react-redux';
import {selectElement} from '@app/store/reducers/uiTempGeometryDesigner';
import store, {RootState} from '@store/store';
import {IAArm, transQuaternion, trans} from '@gd/IElements';
import {getMatrix3} from '@gd/NamedValues';
import {Line2} from 'three-stdlib';
import {MovePointTo} from '@gd/Driver';
import {setMovingMode} from '@store/reducers/uiTempGeometryDesigner';
import NodeSphere from './NodeSphere';
import {PivotControls} from './PivotControls/PivotControls';

const AArm = (props: {element: IAArm}) => {
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

  const moveThisComponent = useSelector((state: RootState) => {
    return (
      state.uitgd.selectedElementAbsPath === element.absPath &&
      state.uitgd.gdSceneState.assembled &&
      state.uitgd.gdSceneState.movingMode
    );
  });

  useFrame(() => {
    const selectedPath = store.getState().uitgd.selectedElementAbsPath;
    const isSelected = !!selectedPath && element.absPath.includes(selectedPath);
    let color: number | string = 0xfffdd0;
    if (isSelected) {
      color = 0xffa500;
    }
    meshRefs.current.forEach((ref) => {
      if (!ref.current) return;
      ref.current.material.color.set(color);
      ref.current.visible = element.visible.value ?? false;
    });
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

  const nodes = element.getPoints();
  let pts = nodes.map((p) => p.value.applyMatrix3(coMatrix));
  const arm: [Vector3, Vector3, Vector3] = [pts[0], pts[2], pts[1]];
  pts = arm.filter((v, i) => i > 2);
  const plane = new Plane().setFromCoplanarPoints(...arm);
  const projections = pts.map((p) => {
    const v = new Vector3();
    plane.projectPoint(p, v);
    return [p, v];
  });

  const groupRef = React.useRef<Group>(null!);
  const meshRefs = React.useRef(
    [arm, ...projections].map(() => React.createRef<Line2>())
  );

  const initialPosition = trans(nodes[2], coMatrix);
  const rotationRef = React.useRef<Matrix3>(new Matrix3());
  const targetRef = React.useRef<Vector3>(new Vector3());
  const dragRef = React.useRef<boolean>(false);
  React.useEffect(() => {
    rotationRef.current = new Matrix3();
    if (!moveThisComponent) dispatch(setMovingMode(false));
  }, [moveThisComponent]);

  return (
    <>
      <group onDoubleClick={handleOnDoubleClick} ref={groupRef}>
        <Line
          points={arm}
          color="pink"
          lineWidth={4}
          ref={meshRefs.current[0]}
          key="arm"
        />
        {projections.map((line, i) => (
          <Line
            points={line}
            color="pink"
            lineWidth={4}
            ref={meshRefs.current[i + 1]}
            key="arm"
          />
        ))}
        {nodes.map((node) => (
          <NodeSphere node={node} key={node.nodeID} />
        ))}
      </group>
      {moveThisComponent ? (
        <PivotControls
          displayValues={false}
          disableSliders
          matrix={new Matrix4()
            .setFromMatrix3(rotationRef.current)
            .setPosition(initialPosition)}
          scale={70}
          onDrag={(mL) => {
            const coMatrixT = coMatrix.clone().transpose();
            targetRef.current = new Vector3(
              mL.elements[12],
              mL.elements[13],
              mL.elements[14]
            ).applyMatrix3(coMatrixT);
            dragRef.current = true;
            rotationRef.current = new Matrix3().setFromMatrix4(mL);
          }}
        />
      ) : null}
    </>
  );
};
export default AArm;
