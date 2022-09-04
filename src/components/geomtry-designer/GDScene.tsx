import React, {useRef, useEffect} from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {useSelector, Provider} from 'react-redux';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import store, {RootState} from '@store/store';
import {Canvas} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import SelectedPoints from '@gdComponents/r3f-components/SelectedPoints';

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const assembly = useSelector(
    (state: RootState) => state.uitgd.collectedAssembly
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

  return (
    <div id="gdCanvasContainer" className="h-100">
      <Canvas
        ref={canvas}
        gl={{
          preserveDrawingBuffer: true
        }}
      >
        <color attach="background" args={[bgColor]} />
        {
          // <pointLight position={[10, 10, 10]} />
        }
        <axesHelper args={[10]} />
        <Provider store={store}>
          {/* <mesh>
            <boxGeometry />
            <meshNormalMaterial />
      </mesh> */}
          <SelectedPoints />
        </Provider>
        <OrbitControls enableDamping={false} />
      </Canvas>
    </div>
  );
}

/* export default function GDScene() {


  const selectedPoint = useSelector(
    (state: RootState) => state.uitgd.gdSceneState.selectedPoint
  );

  const assembly = useSelector(
    (state: RootState) => state.dgd.present.topAssembly
  );

  const dispatch = useDispatch();



  useEffect(() => {
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
