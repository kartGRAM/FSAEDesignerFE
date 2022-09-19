/* eslint-disable no-unreachable */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
import * as THREE from 'three';
import {Vector3} from 'three';
import {useFrame, useThree} from '@react-three/fiber';
import {Box, Sphere, Text} from '@react-three/drei';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {isBody} from '@gd/IElements';
import Body from './Body';

const CollectedAssembly = () => {
  const assembly = useSelector(
    (state: RootState) => state.uitgd.collectedAssembly
  );
  const fit = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.fitToScreenNotify
  );
  const {camera} = useThree();
  React.useEffect(() => {
    if (fit === null) return;
    const box3 = new THREE.Box3().setFromObject(groupRef.current);
    const dimensions = new THREE.Vector3().subVectors(box3.max, box3.min);
    const boxGeo = new THREE.BoxBufferGeometry(
      dimensions.x,
      dimensions.y,
      dimensions.z
    );
    // move new mesh center so it's aligned with the original object
    const matrix = new THREE.Matrix4().setPosition(
      dimensions.addVectors(box3.min, box3.max).multiplyScalar(0.5)
    );
    boxGeo.applyMatrix4(matrix);
    boxRef.current.geometry.copy(boxGeo);

    if (isPerspectiveCamera(camera)) {
      const fov = ((camera.fov / 2) * Math.PI) / 180;
      const viewMatrix = camera.matrixWorldInverse;
      const corners = getCorners(box3);
      const cornersView = corners.map((point) =>
        point.clone().applyMatrix4(viewMatrix)
      );
      const {aspect} = camera;
      const vYMax = new Vector3(0, Math.sin(fov), -Math.cos(fov));
      const vYMaxN = new Vector3(0, vYMax.z, -vYMax.y);
      const vYMin = new Vector3(0, -vYMax.y, vYMax.z);
      const vYMinN = new Vector3(0, vYMin.z, -vYMin.y);
      const vXMax = new Vector3(
        Math.sin(fov) * aspect,
        0,
        -Math.cos(fov)
      ).normalize();
      const vXMaxN = new Vector3(vXMax.z, 0, -vXMax.x);
      const vXMin = new Vector3(-vXMax.x, 0, vXMax.z);
      const vXMinN = new Vector3(vXMin.z, 0, -vXMin.x);
      let upperDistance = Number.MIN_SAFE_INTEGER;
      let lowerDistance = Number.MIN_SAFE_INTEGER;
      let rightDistance = Number.MIN_SAFE_INTEGER;
      let leftDistance = Number.MIN_SAFE_INTEGER;
      let upperCorner = new Vector3();
      let lowerCorner = new Vector3();
      let rightCorner = new Vector3();
      let leftCorner = new Vector3();
      cornersView.forEach((point, i) => {
        const pointY = point.clone();
        pointY.x = 0;
        const vYMaxL = vYMax.clone().multiplyScalar(vYMax.dot(pointY));
        const upperDistV = pointY.clone().sub(vYMaxL);
        const vYMinL = vYMin.clone().multiplyScalar(vYMin.dot(pointY));
        const lowerDistV = pointY.clone().sub(vYMinL);

        const pointX = point.clone();
        pointX.y = 0;
        const vXMaxL = vXMax.clone().multiplyScalar(vXMax.dot(pointX));
        const rightDistV = pointX.clone().sub(vXMaxL);
        const vXMinL = vXMin.clone().multiplyScalar(vXMin.dot(pointX));
        const leftDistV = pointX.clone().sub(vXMinL);
        let upperDist = upperDistV.length();
        let lowerDist = lowerDistV.length();
        let rightDist = rightDistV.length();
        let leftDist = leftDistV.length();
        if (upperDistV.dot(vYMaxN) > 0) upperDist *= -1;
        if (lowerDistV.dot(vYMinN) < 0) lowerDist *= -1;
        if (rightDistV.dot(vXMaxN) > 0) rightDist *= -1;
        if (leftDistV.dot(vXMinN) < 0) leftDist *= -1;
        if (upperDist > upperDistance) {
          upperDistance = upperDist;
          upperCorner = pointY;
        }
        if (lowerDist > lowerDistance) {
          lowerDistance = lowerDist;
          lowerCorner = pointY;
        }
        if (rightDist > rightDistance) {
          rightDistance = rightDist;
          rightCorner = pointX;
        }
        if (leftDist > leftDistance) {
          leftDistance = leftDist;
          leftCorner = pointX;
        }
      });

      const deltaY = lowerCorner.clone().sub(upperCorner);
      let ab = vYMax.dot(vYMin);
      let t = (vYMax.dot(deltaY) - ab * vYMin.dot(deltaY)) / (1 - ab * ab);
      const moveToY = upperCorner.clone().add(vYMax.clone().multiplyScalar(t));

      const deltaX = leftCorner.clone().sub(rightCorner);
      ab = vXMax.dot(vXMin);
      t = (vXMax.dot(deltaX) - ab * vXMin.dot(deltaX)) / (1 - ab * ab);
      const moveToX = rightCorner.clone().add(vXMax.clone().multiplyScalar(t));

      const moveTo = new Vector3(
        moveToX.x,
        moveToY.y,
        moveToY.z > moveToX.z ? moveToY.z : moveToX.z
      );
      moveTo.applyQuaternion(camera.quaternion).add(camera.position);
      // console.log(camera.quaternion);
      camera.position.copy(moveTo);
    }
  }, [camera, fit]);

  const upperSphereRef = React.useRef<THREE.Mesh>(null!);
  const lowerSphereRef = React.useRef<THREE.Mesh>(null!);
  const rightSphereRef = React.useRef<THREE.Mesh>(null!);
  const leftSphereRef = React.useRef<THREE.Mesh>(null!);
  const groupRef = React.useRef<THREE.Group>(null!);
  const boxRef = React.useRef<THREE.Mesh>(null!);
  const box3Ref = React.useRef<THREE.Box3>(new THREE.Box3());
  const children = assembly?.children ?? [];

  useFrame((state) => {
    if (!assembly) return;
    const box3 = box3Ref.current.setFromObject(groupRef.current);
    const dimensions = new THREE.Vector3().subVectors(box3.max, box3.min);
    const boxGeo = new THREE.BoxBufferGeometry(
      dimensions.x,
      dimensions.y,
      dimensions.z
    );
    // move new mesh center so it's aligned with the original object
    const matrix = new THREE.Matrix4().setPosition(
      dimensions.addVectors(box3.min, box3.max).multiplyScalar(0.5)
    );
    boxGeo.applyMatrix4(matrix);
    boxRef.current.geometry.copy(boxGeo);

    const {camera} = state;
    if (isPerspectiveCamera(camera)) {
      const fov = ((camera.fov / 2) * Math.PI) / 180;
      const viewMatrix = camera.matrixWorldInverse;
      const corners = getCorners(box3);
      const cornersView = corners.map((point) =>
        point.clone().applyMatrix4(viewMatrix)
      );
      const {aspect} = camera;
      const vYMax = new Vector3(0, Math.sin(fov), -Math.cos(fov));
      const vYMaxN = new Vector3(0, vYMax.z, -vYMax.y);
      const vYMin = new Vector3(0, -vYMax.y, vYMax.z);
      const vYMinN = new Vector3(0, vYMin.z, -vYMin.y);
      const vXMax = new Vector3(
        Math.sin(fov) * aspect,
        0,
        -Math.cos(fov)
      ).normalize();
      const vXMaxN = new Vector3(vXMax.z, 0, -vXMax.x);
      const vXMin = new Vector3(-vXMax.x, 0, vXMax.z);
      const vXMinN = new Vector3(vXMin.z, 0, -vXMin.x);
      let upperDistance = Number.MIN_SAFE_INTEGER;
      let lowerDistance = Number.MIN_SAFE_INTEGER;
      let rightDistance = Number.MIN_SAFE_INTEGER;
      let leftDistance = Number.MIN_SAFE_INTEGER;
      let upperCornerG = new Vector3();
      let lowerCornerG = new Vector3();
      let rightCornerG = new Vector3();
      let leftCornerG = new Vector3();
      cornersView.forEach((point, i) => {
        const pointY = point.clone();
        pointY.x = 0;
        const vYMaxL = vYMax.clone().multiplyScalar(vYMax.dot(pointY));
        const upperDistV = pointY.clone().sub(vYMaxL);
        const vYMinL = vYMin.clone().multiplyScalar(vYMin.dot(pointY));
        const lowerDistV = pointY.clone().sub(vYMinL);

        const pointX = point.clone();
        pointX.y = 0;
        const vXMaxL = vXMax.clone().multiplyScalar(vXMax.dot(pointX));
        const rightDistV = pointX.clone().sub(vXMaxL);
        const vXMinL = vXMin.clone().multiplyScalar(vXMin.dot(pointX));
        const leftDistV = pointX.clone().sub(vXMinL);
        let upperDist = upperDistV.length();
        let lowerDist = lowerDistV.length();
        let rightDist = rightDistV.length();
        let leftDist = leftDistV.length();
        if (upperDistV.dot(vYMaxN) > 0) upperDist *= -1;
        if (lowerDistV.dot(vYMinN) < 0) lowerDist *= -1;
        if (rightDistV.dot(vXMaxN) > 0) rightDist *= -1;
        if (leftDistV.dot(vXMinN) < 0) leftDist *= -1;
        if (upperDist > upperDistance) {
          upperDistance = upperDist;
          upperCornerG = corners[i];
        }
        if (lowerDist > lowerDistance) {
          lowerDistance = lowerDist;
          lowerCornerG = corners[i];
        }
        if (rightDist > rightDistance) {
          rightDistance = rightDist;
          rightCornerG = corners[i];
        }
        if (leftDist > leftDistance) {
          leftDistance = leftDist;
          leftCornerG = corners[i];
        }
      });

      upperSphereRef.current.position.copy(upperCornerG);
      lowerSphereRef.current.position.copy(lowerCornerG);
      rightSphereRef.current.position.copy(rightCornerG);
      leftSphereRef.current.position.copy(leftCornerG);
    }
  });
  return (
    <>
      <group ref={groupRef}>
        {children.map((child) => {
          if (isBody(child)) return <Body element={child} key={child.nodeID} />;
          return null;
        })}
      </group>
      <Box ref={boxRef}>
        <meshBasicMaterial color="hotpink" wireframe wireframeLinewidth={3} />
      </Box>

      <Sphere ref={upperSphereRef} args={[5, 16, 16]}>
        <meshBasicMaterial color={0xff0000} />
      </Sphere>
      <Sphere ref={lowerSphereRef} args={[5, 16, 16]}>
        <meshBasicMaterial color={0xffff00} />
      </Sphere>
      <Sphere ref={rightSphereRef} args={[5, 16, 16]}>
        <meshBasicMaterial color={0xff00ff} />
      </Sphere>
      <Sphere ref={leftSphereRef} args={[5, 16, 16]}>
        <meshBasicMaterial color={0x00ffff} />
      </Sphere>
    </>
  );
};
export default CollectedAssembly;

function getCorners(box3: THREE.Box3): THREE.Vector3[] {
  const low = box3.min;
  const high = box3.max;

  return [
    new THREE.Vector3(low.x, low.y, low.z),
    new THREE.Vector3(high.x, low.y, low.z),
    new THREE.Vector3(low.x, high.y, low.z),
    new THREE.Vector3(high.x, high.y, low.z),
    new THREE.Vector3(low.x, low.y, high.z),
    new THREE.Vector3(high.x, low.y, high.z),
    new THREE.Vector3(low.x, high.y, high.z),
    new THREE.Vector3(high.x, high.y, high.z)
  ];
}

function isPerspectiveCamera(
  camera: THREE.Camera
): camera is THREE.PerspectiveCamera {
  return (
    camera instanceof THREE.PerspectiveCamera && camera.isPerspectiveCamera
  );
}
