/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {useRef, useEffect} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import store, {RootState} from '@store/store';
import track, {dispose, disposeAll} from '@app/utils/ResourceTracker';
import * as THREE from 'three';
import {
  setAssembly,
  setCollectedAssembly
} from '@store/reducers/uiTempGeometryDesigner';

import {getAssembly} from '@gd/Elements';
import {getVector3} from '@gd/NamedValues';
import {render} from '@app/geometryDesigner/ElementsRenderer';
import {Canvas, useThree, useFrame} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';

interface HandleCameraAspectParams {
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
}

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
  const dispatch = useDispatch();
  const assembly = useSelector(
    (state: RootState) => state.dgd.present.topAssembly
  );

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

  useEffect(() => {
    const start = performance.now();
    if (assembly) {
      const iAssembly = getAssembly(assembly);
      dispatch(setAssembly(iAssembly));
      dispatch(setCollectedAssembly(iAssembly.collectElements()));
    }
    // 実行時間を計測した処理
    const end = performance.now();
    // eslint-disable-next-line no-console
    console.log(end - start);
  }, [assembly]);

  return (
    <div id="gdCanvasContainer" className="h-100">
      <Canvas
        ref={canvas}
        gl={{
          preserveDrawingBuffer: true
        }}
      >
        <color attach="background" args={[bgColor]} />
        <pointLight position={[10, 10, 10]} />
        <mesh>
          <boxGeometry />
          <meshNormalMaterial />
        </mesh>
      </Canvas>
    </div>
  );
}

/* export default function GDScene() {
  canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<THREE.Scene | null>(null);

  const bgColor: number = useSelector(
    (state: RootState) => state.uigd.present.backgroundColor
  );

  const selectedPoint = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.selectedPoint
  );

  const assembly = useSelector(
    (state: RootState) => state.dgd.present.topAssembly
  );

  const dispatch = useDispatch();

  const init = (): ResizeObserver => {
    // レンダラを作成
    const renderer = new THREE.WebGLRenderer({
      preserveDrawingBuffer: true,
      canvas: canvas.current!
    });
    renderer.setClearColor(bgColor, 1);
    // シーンを作成
    scene.current = new THREE.Scene();
    // カメラを作成
    const camera = new THREE.PerspectiveCamera(45, 1, 100, 100000);
    // コントロールを作成
    const controls = new OrbitControls(camera, renderer.domElement);
    onResize({camera, renderer});
    const resizeObserver = new ResizeObserver(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (entries: ResizeObserverEntry[], observer: ResizeObserver) => {
        onResize({camera, renderer});
      }
    );
    resizeObserver.observe(canvas.current!);

    camera.position.set(0, 0, +3000);
    const axes = new THREE.AxesHelper(25);
    axes.setColors(
      new THREE.Color(0x00ff00),
      new THREE.Color(0x0000ff),
      new THREE.Color(0xff0000)
    );
    scene.current.add(axes);

    // render(sample, scene);
    tick();
    // 毎フレーム時に実行されるループイベント
    function tick() {
      if (scene.current) renderer.render(scene.current, camera);
      // レンダリング
      requestAnimationFrame(tick);
      // updateControls
      controls.update();
    }
    return resizeObserver;
  };

  const onResize = ({camera, renderer}: HandleCameraAspectParams) => {
    if (!canvas.current) return;
    // サイズを取得
    const width = canvas.current!.clientWidth;
    const height = canvas.current!.clientHeight;

    // レンダラーのサイズを調整する
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);

    // カメラのアスペクト比を正す
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  useEffect(() => {
    const resizeObserver = init();
    return () => {
      if (scene.current) disposeAll(scene.current);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const start = performance.now();
    if (scene.current) dispose('Assembly', scene.current);
    if (assembly && scene.current) {
      const iAssembly = getAssembly(assembly);
      dispatch(setAssembly(iAssembly));
      dispatch(setCollectedAssembly(iAssembly.collectElements()));

      render(iAssembly, scene.current);
    }
    // 実行時間を計測した処理
    const end = performance.now();
    // eslint-disable-next-line no-console
    console.log(end - start);
  }, [assembly]);

  useEffect(() => {
    const resourceType = 'Helpers' as const;
    if (scene.current) {
      dispose(resourceType, scene.current);
      if (selectedPoint && selectedPoint.length) {
        const points = [...selectedPoint];
        // 色でグルーピング
        const colors: (number | undefined)[] = points.reduce(
          (prev, current) => {
            if (!prev.length) {
              prev.push(current.color);
            } else if (prev[prev.length - 1] !== current.color) {
              prev.push(current.color);
            }
            return prev;
          },
          [] as (number | undefined)[]
        );
        // 色ごとに描写
        colors.forEach((color) => {
          const node = points
            .filter((point) => point.color === color)
            .map((point) => getVector3(point));
          const pm = track(
            new THREE.PointsMaterial({
              size: 15,
              color: color ?? 0xff0000
            }),
            resourceType
          );
          const geometry = track(
            new THREE.BufferGeometry().setFromPoints(node),
            resourceType
          );
          const mesh = track(new THREE.Points(geometry, pm), resourceType);
          if (scene.current) scene.current.add(mesh);
        });
      }
    }
  }, [selectedPoint]);
  return <canvas ref={canvas} className="gd-canvas" id="threeCanvas" />;
} */
