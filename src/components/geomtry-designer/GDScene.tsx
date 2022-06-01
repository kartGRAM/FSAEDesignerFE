import React, {useEffect, useRef} from 'react';
import {useSelector} from 'react-redux';

import {RootState} from '@store/store';
import {DisposeAll} from '@app/utils/ResourceTracker';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';

interface HandleCameraAspectParams {
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
}
export default function GDScene() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const isFullScreen = useSelector(
    (state: RootState) => state.ugd.isFullScreen
  );

  const bgColor: number = useSelector(
    (state: RootState) => state.ugd.backgroundColor
  );

  const init = (): ResizeObserver => {
    // レンダラを作成
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas.current!
    });
    renderer.setClearColor(bgColor, 1);
    // シーンを作成
    const scene = new THREE.Scene();
    // カメラを作成
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100000);
    // コントロールを作成
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.listenToKeyEvents(renderer.domElement);
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
    scene.add(axes);

    // render(sample, scene);
    tick();
    // 毎フレーム時に実行されるループイベント
    function tick() {
      renderer.render(scene, camera);
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
    let width = canvas.current!.clientWidth;
    let height = canvas.current!.clientHeight;
    if (isFullScreen) {
      width = window.innerWidth;
      height = window.innerHeight;
    }

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
      DisposeAll();
      resizeObserver.disconnect();
    };
  }, []);
  return <canvas ref={canvas} className="gd-canvas" />;
}
