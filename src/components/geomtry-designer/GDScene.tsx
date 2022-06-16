import React, {useEffect, useRef} from 'react';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';
import track, {dispose, disposeAll} from '@app/utils/ResourceTracker';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {IDataAssembly, getVector3} from '@app/geometryDesigner/IElements';
import {getAssembly} from '@app/geometryDesigner/Elements';
import {render} from '@app/geometryDesigner/ElementsRenderer';

interface HandleCameraAspectParams {
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
}
export default function GDScene() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<THREE.Scene | null>(null);

  const bgColor: number = useSelector(
    (state: RootState) => state.uigd.backgroundColor
  );

  const selectedPoint = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.selectedPoint
  );

  const assembly: IDataAssembly | undefined = useSelector(
    (state: RootState) => state.dgd.topAssembly
  );

  const init = (): ResizeObserver => {
    // レンダラを作成
    const renderer = new THREE.WebGLRenderer({
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
      // eslint-disable-next-line consistent-return,no-unused-vars
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
    /* if (isFullScreen) {
      width = window.innerWidth;
      height = window.innerHeight;
    } */

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
    if (scene.current) dispose('Assembly', scene.current);
    if (assembly && scene.current) render(getAssembly(assembly), scene.current);
  }, [assembly]);

  useEffect(() => {
    const resourceType = 'Helpers' as const;
    if (scene.current) {
      dispose(resourceType, scene.current);
      if (selectedPoint) {
        const node = getVector3(selectedPoint);
        const pm = track(
          new THREE.PointsMaterial({
            size: 30,
            color: 0xff0000
          }),
          resourceType
        );
        const geometry = track(
          new THREE.BufferGeometry().setFromPoints([node]),
          resourceType
        );
        const mesh = track(new THREE.Points(geometry, pm), resourceType);
        scene.current.add(mesh);
      }
    }
  }, [selectedPoint]);
  return <canvas ref={canvas} className="gd-canvas" />;
}
