/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  EventManager,
  ReactThreeFiber,
  useFrame,
  useThree
} from '@react-three/fiber';
import * as React from 'react';
import type {Camera, Event} from 'three';
import {Vector3} from 'three';
import * as THREE from 'three';
import {Box} from '@react-three/drei';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {useSpring} from 'react-spring';
import {OrbitControls as OrbitControlsImpl} from './OrbitControlsImpl';

export type OrbitControlsProps = Omit<
  ReactThreeFiber.Overwrite<
    ReactThreeFiber.Object3DNode<OrbitControlsImpl, typeof OrbitControlsImpl>,
    {
      camera?: Camera;
      domElement?: HTMLElement;
      makeDefault?: boolean;
      onChange?: (e?: Event) => void;
      onEnd?: (e?: Event) => void;
      onStart?: (e?: Event) => void;
      regress?: boolean;
      target?: ReactThreeFiber.Vector3;
    }
  >,
  'ref'
>;

export const OrbitControls = React.forwardRef<
  OrbitControlsImpl,
  OrbitControlsProps
>(
  (
    {
      makeDefault,
      camera,
      regress,
      domElement,
      onChange,
      onStart,
      onEnd,
      ...restProps
    },
    ref
  ) => {
    const fit = useSelector(
      (state: RootState) => state.uitgd.gdSceneState.fitToScreenNotify
    );
    const invalidate = useThree((state) => state.invalidate);
    const defaultCamera = useThree((state) => state.camera);
    const gl = useThree((state) => state.gl);

    const events = useThree(
      (state) => state.events
    ) as EventManager<HTMLElement>;
    const set = useThree((state) => state.set);
    const get = useThree((state) => state.get);
    const performance = useThree((state) => state.performance);
    const explCamera = camera || defaultCamera;
    const explDomElement = (domElement ||
      events.connected ||
      gl.domElement) as HTMLElement;
    const controls = React.useMemo(
      () => new OrbitControlsImpl(explCamera),
      [explCamera]
    );
    const boxRef = React.useRef<THREE.Mesh>(null!);
    const moveTo = React.useRef<THREE.Vector3 | null>(null);
    const viewDirectionTo = React.useRef<THREE.Quaternion>(
      new THREE.Quaternion()
    );

    useFrame(() => {
      if (controls.enabled) controls.update();
    }, -1);

    React.useEffect(() => {
      controls.connect(explDomElement);
      // eslint-disable-next-line no-void
      return () => void controls.dispose();
    }, [explDomElement, regress, controls, invalidate]);

    React.useEffect(() => {
      const callback = (e: Event) => {
        invalidate();
        if (regress) performance.regress();
        if (onChange) onChange(e);
      };
      controls.addEventListener('change', callback);
      if (onStart) controls.addEventListener('start', onStart);
      if (onEnd) controls.addEventListener('end', onEnd);

      return () => {
        if (onStart) controls.removeEventListener('start', onStart);
        if (onEnd) controls.removeEventListener('end', onEnd);
        controls.removeEventListener('change', callback);
      };
    }, [onChange, onStart, onEnd, controls, invalidate]);

    React.useEffect(() => {
      if (makeDefault) {
        const old = get().controls;
        set({controls});
        return () => set({controls: old});
      }
      return () => {};
    }, [makeDefault, controls]);

    React.useEffect(() => {
      if (fit === null) return;
      const {camera} = get();
      fitToScreen(camera.quaternion);
    }, [camera, fit]);

    const fitToScreen = (quaternion: THREE.Quaternion) => {
      const {scene, camera} = get();
      const assembly = scene.getObjectByName('collectedAssembly');
      if (!assembly) return;
      const box3 = new THREE.Box3().setFromObject(assembly);
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
        // const viewMatrix = camera.matrixWorldInverse;
        const corners = getCorners(box3);
        const cornersView = corners.map((point) =>
          // point.clone().applyMatrix4(viewMatrix)
          point
            .clone()
            .sub(camera.position)
            .applyQuaternion(quaternion.clone().invert())
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
        const moveToY = upperCorner
          .clone()
          .add(vYMax.clone().multiplyScalar(t));

        const deltaX = leftCorner.clone().sub(rightCorner);
        ab = vXMax.dot(vXMin);
        t = (vXMax.dot(deltaX) - ab * vXMin.dot(deltaX)) / (1 - ab * ab);
        const moveToX = rightCorner
          .clone()
          .add(vXMax.clone().multiplyScalar(t));

        moveTo.current = new Vector3(
          moveToX.x,
          moveToY.y,
          moveToY.z > moveToX.z ? moveToY.z : moveToX.z
        );
        viewDirectionTo.current = quaternion.clone();
        moveTo.current.applyQuaternion(quaternion).add(camera.position);
      }
    };

    useFrame(() => {
      const {camera} = get();
      if (moveTo.current) {
        camera.position.lerp(moveTo.current, 0.2);
        camera.quaternion.slerp(viewDirectionTo.current, 0.1);
        if (camera.position.distanceTo(moveTo.current) < 0.1) {
          camera.position.copy(moveTo.current);
          camera.quaternion.copy(viewDirectionTo.current);
          moveTo.current = null;
        }
      }
    });

    return (
      <>
        <primitive ref={ref} object={controls} {...restProps} />
        <Box ref={boxRef}>
          <meshBasicMaterial color="hotpink" wireframe wireframeLinewidth={3} />
        </Box>
      </>
    );
  }
);

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
  camera: THREE.Camera | undefined
): camera is THREE.PerspectiveCamera {
  return (
    camera instanceof THREE.PerspectiveCamera && camera.isPerspectiveCamera
  );
}
