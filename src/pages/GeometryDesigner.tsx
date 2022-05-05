/* eslint-disable jsx-a11y/anchor-is-valid */
// eslint-disable-next-line no-unused-vars
import React, {useEffect} from 'react';
import {ContentHeader} from '@components';
import * as THREE from 'three';

interface HandleCameraAspectParams {
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
}

const GeometryDesigner = () => {
  const createBox = () => {
    // レンダラを作成
    const renderer: any = new THREE.WebGLRenderer({
      canvas: document.querySelector('#nyumon-sample1') as HTMLCanvasElement
    });
    const width = window.innerWidth;
    const height = window.innerHeight;
    // シーンを作成
    const scene = new THREE.Scene();
    // カメラを作成
    const camera = new THREE.PerspectiveCamera(45, width / height);
    // resize
    window.addEventListener('resize', () => onResize({camera, renderer}));
    onResize({camera, renderer});

    camera.position.set(0, 0, +1000);
    // 箱を作成
    const geometry = new THREE.BoxGeometry(400, 400, 400);
    const material = new THREE.MeshNormalMaterial();
    const box = new THREE.Mesh(geometry, material);
    scene.add(box);
    tick();
    // 毎フレーム時に実行されるループイベント
    function tick() {
      box.rotation.y += 0.01;
      renderer.render(scene, camera);
      // レンダリング
      requestAnimationFrame(tick);
    }
  };

  const onResize = ({camera, renderer}: HandleCameraAspectParams) => {
    // サイズを取得
    const width = window.innerWidth;
    const height = window.innerHeight;

    // レンダラーのサイズを調整する
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);

    // カメラのアスペクト比を正す
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  // didMountで描画しないと、Cannot read property 'width' of nullというエラーが出る
  useEffect(() => {
    createBox();
    return () => window.removeEventListener('resize', () => onResize);
  }, []);
  return (
    <div>
      <ContentHeader title="Geomtry Designer" />
      <section className="content">
        <div className="container-fluid">
          <canvas id="nyumon-sample1" className="h-100 w-100" />
        </div>
      </section>
    </div>
  );
};

export default GeometryDesigner;
