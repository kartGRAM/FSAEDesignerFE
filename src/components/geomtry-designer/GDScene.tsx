/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {useRef, useEffect} from 'react';
import * as THREE from 'three';
import {useFrame, Canvas, useThree} from '@react-three/fiber';
import {useSelector, Provider} from 'react-redux';
import store, {RootState} from '@store/store';
import {
  OrbitControls,
  PerspectiveCamera,
  OrthographicCamera
} from '@react-three/drei';
import CollectedAssembly from '@gdComponents/r3f-components/CollectedAssembly';
import {numberToRgb} from '@app/utils/helpers';

import Toolbar from '@mui/material/Toolbar';
import {alpha} from '@mui/material/styles';
import Fit from '@gdComponents/r3f-components/toolbar-components/Fit';
import ProjectionMode from '@gdComponents/r3f-components/toolbar-components/ProjectionMode';

let canvas: React.RefObject<HTMLCanvasElement>;

export function getScreenShot(): Blob | null {
  if (canvas.current) {
    const url: string = canvas.current.toDataURL('image/png');
    const bin: string = window.atob(url.split(',')[1]);
    const buffer: any = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      buffer[i] = bin.charCodeAt(i);
    }
    return new Blob([buffer.buffer], {type: 'image/png'});
  }
  return null;
}

export default function GDScene() {
  canvas = useRef<HTMLCanvasElement>(null);

  const bgColor = useSelector(
    (state: RootState) => state.uigd.present.backgroundColor
  );

  useEffect(() => {
    const window = document.getElementById('gdAppBar');
    const sidePanel = document.getElementById('gdSidePanel');
    const resizeObserver = new ResizeObserver(() => {
      const appBar = document.getElementById('gdAppBar')!;
      const sideBar = document.getElementById('gdSideBar')!;
      const sidePanel = document.getElementById('gdSidePanel')!;
      const width =
        appBar.clientWidth - sideBar.clientWidth - sidePanel.clientWidth - 14;
      const container = document.getElementById('gdCanvasContainer')!;
      container.style.width = `${width}px`;
    });
    resizeObserver.observe(window!);
    resizeObserver.observe(sidePanel!);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div
      id="gdCanvasContainer"
      className="h-100 d-flex justify-content-center
    align-items-start"
    >
      <Toolbar
        sx={{
          minHeight: '24px!important',
          justifyContent: 'center',
          zIndex: 1,
          background: alpha('#FFFFFF', 0.0)
        }}
      >
        <ProjectionMode />
        <Fit />
      </Toolbar>

      <Canvas
        linear
        flat
        orthographic
        ref={canvas}
        gl={{
          preserveDrawingBuffer: true
        }}
        camera={{fov: 45, near: 1, far: 10000, position: [1500, 1500, 1500]}}
        style={{background: numberToRgb(bgColor), position: 'absolute'}}
      >
        {
          // <pointLight position={[10, 10, 10]} />
        }
        <axesHelper args={[50]} />
        <Provider store={store}>
          <CollectedAssembly />

          <Dolly />
        </Provider>
        <OrbitControls enableDamping={false} />
      </Canvas>
    </div>
  );
}

function Dolly() {
  const projectionMode = useSelector(
    (state: RootState) => state.uigd.present.gdSceneState.projectionMode
  );
  const {set} = useThree();
  React.useEffect(() => {
    const [camera, anotherCamera] =
      projectionMode === 'Perspective'
        ? [perspectiveCam.current, orthoCam.current]
        : [orthoCam.current, perspectiveCam.current];
    const lookAtVector = new THREE.Vector3(0, 0, -1).applyQuaternion(
      anotherCamera.quaternion
    );
    camera.lookAt(lookAtVector);
    camera.position.copy(anotherCamera.position);
    set({camera});
  }, [projectionMode]);
  const perspectiveCam = useRef<THREE.PerspectiveCamera>(null!);
  const orthoCam = useRef<THREE.OrthographicCamera>(null!);
  /* useFrame((state) => {
    const camera =
      projectionMode === 'Perspective'
        ? new THREE.PerspectiveCamera(45, 1, 1, 10000)
        : new THREE.OrthographicCamera(0, 1000, 0, 1000, 1, 10000);
    state.camera.projectionMatrix.copy(camera.projectionMatrix);
    state.camera.updateProjectionMatrix();
  }); */

  const container = document.getElementById('gdCanvasContainer')!;
  return (
    <>
      <PerspectiveCamera
        name="3d"
        ref={perspectiveCam}
        near={1}
        far={100000}
        position={[1500, 1500, 1500]}
        fov={45}
      />
      <OrthographicCamera
        name="2d"
        ref={orthoCam}
        position={[1500, 1500, 1500]}
        zoom={0.5}
        near={1}
        far={100000}
        left={-container.clientWidth / 2}
        right={container.clientWidth / 2}
        top={container.clientHeight / 2}
        bottom={-container.clientHeight / 2}
      />
    </>
  );
}
