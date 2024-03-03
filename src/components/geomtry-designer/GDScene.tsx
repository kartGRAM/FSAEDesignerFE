import React, {useRef, useEffect} from 'react';
import * as THREE from 'three';
import {Canvas, useThree} from '@react-three/fiber';
import {useSelector, Provider, useDispatch} from 'react-redux';
import store, {RootState} from '@store/store';
import {
  PerspectiveCamera,
  OrthographicCamera,
  KeyboardControls
} from '@react-three/drei';
import CollectedAssembly from '@gdComponents/r3f-components/CollectedAssembly';
import {numberToRgb} from '@app/utils/helpers';
import GDSceneToolBar from '@gdComponents/r3f-components/toolbar-components/GDSceneToolBar';
import {setGDSceneGetThree} from '@store/reducers/uiTempGeometryDesigner';
import DatumObjectsRenderer from '@gdComponents/r3f-components/DatumObjects/DatumObjectsRenderer';
import MeasureToolsRenderer from '@gdComponents/r3f-components/MeasureTools/MeasureToolsRenderer';
import ROVariablesUpdate from '@gdComponents/r3f-components/ReadonlyVariables/ReadonlyVariablesUpdate';
import {OrbitControls} from './r3f-components/OrbitControls';
import SelectedPoints from './r3f-components/SelectedPoints';
import GroundPlane from './r3f-components/GroundPlane';
import {KeyboardControls as MyKeyboardControls} from './r3f-components/KeyboardControls';
import {SkidpadLogOutputs} from './r3f-components/SkidpadLogOutputs/SkidpadLogOutputs';

let canvas: React.RefObject<HTMLCanvasElement>;

export function getCanvas() {
  return canvas.current;
}

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

  const bgColor = useSelector((state: RootState) => state.uigd.backgroundColor);

  const controls = useSelector(
    (state: RootState) => state.dgd.present.controls
  ).filter((c) => c.type === 'keyboard');
  const map = controls.map((c) => ({
    name: `controls:${c.inputButton}`,
    keys: [c.inputButton]
  }));
  map.push(
    ...[
      {name: 'fixY', keys: ['F5']},
      {name: 'fixZ', keys: ['F6']}
    ]
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
      <GDSceneToolBar />
      <SkidpadLogOutputs />
      <KeyboardControls map={map}>
        <Canvas
          onCreated={(state) => {
            state.gl.localClippingEnabled = true;
          }}
          linear
          flat
          ref={canvas}
          gl={{
            preserveDrawingBuffer: true
          }}
          camera={{
            fov: 45,
            near: 1,
            far: 10000,
            position: [1500, 1500, 1500]
          }}
          style={{background: numberToRgb(bgColor), position: 'absolute'}}
        >
          {
            // <pointLight position={[10, 10, 10]} />
          }
          <Provider store={store}>
            <ambientLight intensity={0.4} />
            <directionalLight
              position={[3.3, 1.0, 4.4]}
              castShadow
              intensity={0.4}
            />
            <DatumObjectsRenderer />
            <MeasureToolsRenderer />
            <ROVariablesUpdate />
            <CollectedAssembly />
            <OrbitControls />
            <MyKeyboardControls />
            <SelectedPoints />
            <GroundPlane />
            <Dolly />
          </Provider>
          <axesHelper args={[50]} />
        </Canvas>
      </KeyboardControls>
    </div>
  );
}

function Dolly() {
  const projectionMode = useSelector(
    (state: RootState) => state.uigd.gdSceneState.projectionMode
  );
  const set = useThree((state) => state.set);
  const get = useThree((state) => state.get);
  const dispatch = useDispatch();
  React.useEffect(() => {
    dispatch(setGDSceneGetThree(get));
  });
  React.useEffect(() => {
    const [camera, anotherCamera] =
      projectionMode === 'Perspective'
        ? [perspectiveCam.current, orthoCam.current]
        : [orthoCam.current, perspectiveCam.current];
    camera.position.copy(anotherCamera.position);
    camera.zoom = 1.0;
    camera.quaternion.copy(anotherCamera.quaternion);
    set({camera});
  }, [projectionMode, set]);
  const perspectiveCam = useRef<THREE.PerspectiveCamera>(null!);
  const orthoCam = useRef<THREE.OrthographicCamera>(null!);

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
        zoom={1}
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
