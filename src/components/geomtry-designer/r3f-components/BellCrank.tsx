import * as React from 'react';
import {Vector3, Plane, Matrix4, Group} from 'three';
import {ThreeEvent, useFrame} from '@react-three/fiber';
import {Line} from '@react-three/drei';
import {useSelector, useDispatch} from 'react-redux';
import {selectElement} from '@app/store/reducers/uiTempGeometryDesigner';
import store, {RootState} from '@store/store';
import {transQuaternion, trans} from '@gd/IElements';
import {IBellCrank} from '@gd/IElements/IBellCrank';
import {getMatrix3} from '@gd/NamedValues';
import {Line2} from 'three-stdlib';
import {MovePointTo} from '@gd/kinematics/Driver';
import {setMovingMode} from '@store/reducers/uiTempGeometryDesigner';
import useUpdateEffect from '@app/hooks/useUpdateEffect';
import NodeSphere from './NodeSphere';
import {PivotControls} from './PivotControls/PivotControls';
import MeasurablePoint from './MeasurablePointSphere';
import {OBB} from './OBB';

const BellCrank = (props: {element: IBellCrank}) => {
  const {element} = props;

  const coMatrix = getMatrix3(
    useSelector((state: RootState) => state.dgd.present.transCoordinateMatrix)
  );
  useSelector((state: RootState) => state.dgd.present.lastGlobalFormulaUpdate);

  const dispatch = useDispatch();

  const handleOnDoubleClick = React.useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (!meshRefs.current[0].current?.visible) return;
      if (store.getState().uitgd.uiDisabled) return;
      e.stopPropagation();
      dispatch(selectElement({absPath: element.absPath}));
    },
    [dispatch, element.absPath]
  );

  const moveThisComponent = useSelector((state: RootState) => {
    return (
      state.uitgd.selectedElementAbsPath === element.absPath &&
      state.uitgd.gdSceneState.assembled &&
      state.uitgd.gdSceneState.movingMode
    );
  });

  useFrame(() => {
    const state = store.getState();
    const selectedPath = state.uitgd.selectedElementAbsPath;
    const isSelected = !!selectedPath && element.absPath.includes(selectedPath);
    let color: number | string = 0xd3bfd9;
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
      const {solver} = store.getState().uitgd;
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
          // console.log('収束エラー');
        }
      }
    }
    if (
      moveThisComponent &&
      resetStateRef.current !== state.uitgd.gdSceneState.resetPositions
    ) {
      pivotRef.current.matrix = new Matrix4().setPosition(initialPosition);
      resetStateRef.current = !resetStateRef.current;
    }
  });

  const nodes = element.getPoints();
  const measurablePoints = element.getMeasurablePoints();
  let pts = nodes.map((p) => p.value.applyMatrix3(coMatrix));
  const bellCrankPlane: [Vector3, Vector3, Vector3] = [
    pts[2],
    pts[0].clone().add(pts[1]).multiplyScalar(0.5),
    pts[3]
  ];
  const bellCrank = [...bellCrankPlane, pts[2]];
  const fp = [pts[0], pts[1]];
  pts = pts.filter((v, i) => i > 3);
  const plane = new Plane().setFromCoplanarPoints(...bellCrankPlane);
  const projections = pts.map((p) => {
    const v = new Vector3();
    plane.projectPoint(p, v);
    return [p, v];
  });

  const groupRef = React.useRef<Group>(null!);
  const meshRefs = React.useRef(
    [bellCrank, fp, ...projections].map(() => React.createRef<Line2>())
  );

  const initialPosition = trans(element.centerOfPoints, coMatrix);
  const targetRef = React.useRef<Vector3>(new Vector3());
  const dragRef = React.useRef<boolean>(false);
  const pivotRef = React.useRef<Group>(null!);
  const resetStateRef = React.useRef<boolean>(
    store.getState().uitgd.gdSceneState.resetPositions
  );
  useUpdateEffect(() => {
    if (!moveThisComponent) dispatch(setMovingMode(false));
  }, [moveThisComponent]);

  return (
    <>
      <group onDoubleClick={handleOnDoubleClick} ref={groupRef}>
        <Line
          points={bellCrank}
          color="pink"
          lineWidth={4}
          ref={meshRefs.current[0]}
          key="bellcrank"
        />
        <Line
          points={fp}
          color="pink"
          lineWidth={4}
          ref={meshRefs.current[1]}
          key="axis"
        />
        {projections.map((line, i) => (
          <Line
            points={line}
            color="pink"
            lineWidth={4}
            ref={meshRefs.current[i + 2]}
            // eslint-disable-next-line react/no-array-index-key
            key={`attachement${i}`}
          />
        ))}
        <OBB obb={element.obb} />
        {nodes.map((node) => (
          <NodeSphere node={node} key={node.nodeID} />
        ))}
        {measurablePoints.map((p) => (
          <MeasurablePoint node={p} key={`${p.nodeID}m`} />
        ))}
      </group>
      {moveThisComponent ? (
        <PivotControls
          ref={pivotRef}
          displayValues={false}
          disableSliders
          matrix={new Matrix4().setPosition(initialPosition)}
          scale={70}
          onDrag={(mL) => {
            const coMatrixT = coMatrix.clone().transpose();
            targetRef.current = new Vector3(
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
export default BellCrank;
