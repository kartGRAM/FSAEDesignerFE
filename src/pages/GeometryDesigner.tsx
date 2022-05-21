/* eslint-disable jsx-a11y/anchor-is-valid */
import React, {useEffect, useRef} from 'react';
import {ContentHeader} from '@components';
import track, {DisposeAll} from '@app/utils/ResourceTracker';
import {useDispatch, useSelector} from 'react-redux';
import {toggleFullScreen} from '@app/store/reducers/geometryDesigner';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {render} from '@app/geometryDesigner/ElementsRenderer';
import {getFrontSuspension} from '@app/geometryDesigner/SampleGeometry';

interface HandleCameraAspectParams {
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
}

const GeometryDesigner = () => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const isFullScreen = useSelector((state: any) => state.gd.isFullScreen);
  const dispatch = useDispatch();

  const init = (): ResizeObserver => {
    // レンダラを作成
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas.current!
    });
    // シーンを作成
    const scene = new THREE.Scene();
    // カメラを作成
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100000);
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
    // 箱を作成
    const geometry = track(new THREE.BoxGeometry(400, 400, 400));
    const material = track(new THREE.MeshNormalMaterial());
    const box = new THREE.Mesh(geometry, material);
    // scene.add(box);

    const sample = getFrontSuspension();

    render(sample, scene);
    tick();
    // 毎フレーム時に実行されるループイベント
    function tick() {
      box.rotation.y += 0.01;
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

  // didMountで描画しないと、Cannot read property 'width' of nullというエラーが出る
  useEffect(() => {
    const resizeObserver = init();
    return () => {
      DisposeAll();
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div>
      <ContentHeader title="Geomtry Designer" />
      <section className="content">
        <div
          className={`container-fluid p-0
          ${isFullScreen ? 'fullscreen' : 'content-full-height'}
          `}
        >
          <canvas ref={canvas} className="h-100 w-100 bg-dark" />
          <button
            type="button"
            className="btn btn-tool fullscreen-btn"
            onClick={() => dispatch(toggleFullScreen())}
          >
            <i className={`fas fa-${isFullScreen ? 'compress' : 'expand'}`} />
          </button>
        </div>
      </section>
    </div>
  );
};

export default GeometryDesigner;
