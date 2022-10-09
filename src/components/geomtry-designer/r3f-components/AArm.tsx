import * as React from 'react';
import * as THREE from 'three';
import {Vector3, Plane} from 'three';
import {ThreeEvent, useFrame} from '@react-three/fiber';
import {Line} from '@react-three/drei';
import {useSelector, useDispatch} from 'react-redux';
import {
  selectElement,
  setOrbitControlsEnabled
} from '@app/store/reducers/uiTempGeometryDesigner';
import store, {RootState} from '@store/store';
import {IAArm, trans} from '@gd/IElements';
import {getMatrix3} from '@gd/NamedValues';
import {Line2} from 'three-stdlib';
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

  const isMoveTarget = useSelector(
    (state: RootState) => state.uitgd.selectedElementAbsPath === element.absPath
  );

  const isAssembled = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.assembled
  );

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
  });

  const nodes = element.getPoints();
  let pts = nodes.map((p) => trans(p, coMatrix));
  const arm: [Vector3, Vector3, Vector3] = [pts[0], pts[2], pts[1]];
  pts = pts.filter((v, i) => i > 2);
  const plane = new Plane().setFromCoplanarPoints(...arm);
  const projections = pts.map((p) => {
    const v = new Vector3();
    plane.projectPoint(p, v);
    return [p, v];
  });

  const meshRefs = React.useRef(
    [arm, ...projections].map(() => React.createRef<Line2>())
  );
  const box = new THREE.Box3().setFromPoints(pts);
  const handlePosition = box.max.clone().add(box.min).multiplyScalar(0.5);

  const object3D = (
    <group onDoubleClick={handleOnDoubleClick}>
      <Line
        points={arm}
        color="pink"
        lineWidth={2}
        ref={meshRefs.current[0]}
        key="arm"
      />
      {projections.map((line, i) => (
        <Line
          points={line}
          color="pink"
          lineWidth={2}
          ref={meshRefs.current[i + 1]}
          key="arm"
        />
      ))}
      {nodes.map((node) => (
        <NodeSphere node={node} key={node.nodeID} />
      ))}
    </group>
  );

  return isMoveTarget && isAssembled ? (
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
export default AArm;
