import * as THREE from 'three';
import track from '@app/utils/ResourceTracker';
import {Vector3, Matrix3} from 'three';
import store from '@store/store';
import {
  IElement,
  isAssembly,
  isBar,
  isTire,
  isSpringDumper,
  isAArm,
  isBellCrank,
  isBody
} from './IElements';

// eslint-disable-next-line prettier/prettier

export const render = (element: IElement, scene: THREE.Scene): void => {
  if (isAssembly(element)) {
    const assembly = element;
    assembly.children.forEach((child) => {
      render(child, scene);
    });
    return;
  }
  const position = element.position ?? new Vector3(0, 0, 0);
  const rotation = element.rotation ?? new Matrix3();
  const coMatrix = store.getState().gd.transCoordinateMatrix;
  const trans = (p: Vector3) => {
    return position
      .clone()
      .add(p.clone().applyMatrix3(rotation))
      .applyMatrix3(coMatrix);
  };
  // show nodes
  {
    const nodes: Vector3[] = [];
    element.getNodes().forEach((nodeWI) => {
      nodes.push(trans(nodeWI.p));
    });
    const pm = track(
      new THREE.PointsMaterial({
        size: 10,
        color: 0x00ff00
      })
    );
    const geometry = track(new THREE.BufferGeometry().setFromPoints(nodes));
    const mesh = new THREE.Points(geometry, pm);
    scene.add(mesh);
  }

  let material: THREE.Material | THREE.Material[] | null = null;
  if (element.mesh) {
    if (element.mesh.geometry) {
      if (!element.mesh.material) {
        element.mesh.material = track(new THREE.MeshNormalMaterial());
      }
      scene.add(element.mesh);
      return;
    }
    if (element.mesh.material) {
      material = element.mesh.material;
    }
  }

  if (isTire(element)) {
    const tire = element;
    if (!material) {
      material = track(new THREE.MeshNormalMaterial({side: THREE.DoubleSide}));
    }

    const geometry = track(new THREE.CircleGeometry(tire.diameter / 2, 32));
    const circle = new THREE.Mesh(geometry, material);
    circle.rotateX(THREE.MathUtils.degToRad(90));
    circle.applyMatrix4(new THREE.Matrix4().setFromMatrix3(coMatrix));
    circle.position.add(trans(tire.tireCenter));
    scene.add(circle);

    material = track(
      new THREE.LineBasicMaterial({
        color: 0xff0000,
        linewidth: 2
      })
    );
    const points = [];
    points.push(trans(tire.rightBearing));
    points.push(trans(tire.leftBearing));
    points.push(trans(tire.tireCenter));

    const lgeometry = track(new THREE.BufferGeometry().setFromPoints(points));

    const line = new THREE.Line(lgeometry, material);
    scene.add(line);
  }
  if (isBar(element)) {
    const bar = element;
    if (!material) {
      material = track(
        new THREE.LineBasicMaterial({
          color: 0xff0000,
          linewidth: 2
        })
      );
    }
    const points = [];
    points.push(trans(bar.point));
    points.push(trans(bar.fixedPoint));

    const geometry = track(new THREE.BufferGeometry().setFromPoints(points));

    const line = new THREE.Line(geometry, material);
    scene.add(line);
  }
  if (isSpringDumper(element)) {
    const spring = element;
    if (!material) {
      material = track(
        new THREE.LineBasicMaterial({
          color: 0x0000ff,
          linewidth: 2
        })
      );
    }
    const points = [];
    points.push(trans(spring.point));
    points.push(trans(spring.fixedPoint));

    const geometry = track(new THREE.BufferGeometry().setFromPoints(points));

    const line = new THREE.Line(geometry, material);
    scene.add(line);
  }
  if (isAArm(element)) {
    const aArm = element;
    if (!material) {
      material = track(
        new THREE.LineBasicMaterial({
          color: 0xff0000,
          linewidth: 2
        })
      );
    }
    const points = [];
    points.push(trans(aArm.fixedPoints[0]));
    const flexPoints = [...aArm.points];
    // points have at least one point;
    const point0 = flexPoints.shift()!;
    points.push(trans(point0));
    points.push(trans(aArm.fixedPoints[1]));
    const geometry = track(new THREE.BufferGeometry().setFromPoints(points));

    const line = new THREE.Line(geometry, material);
    scene.add(line);
  }
  if (isBellCrank(element)) {
    const bellCrank = element;
    if (!material) {
      material = track(
        new THREE.LineBasicMaterial({
          color: 0xff0000,
          linewidth: 2
        })
      );
    }
    let points: Vector3[] = [];
    points.push(trans(bellCrank.fixedPoints[0]));
    points.push(trans(bellCrank.fixedPoints[1]));
    let geometry = track(new THREE.BufferGeometry().setFromPoints(points));
    let line = new THREE.Line(geometry, material);
    scene.add(line);
    const center = bellCrank.fixedPoints[0]
      .clone()
      .add(bellCrank.fixedPoints[1])
      .multiplyScalar(0.5);
    points = [];
    points.push(trans(center));
    // points have at least two points;
    points.push(trans(bellCrank.points[0]));
    points.push(trans(bellCrank.points[1]));
    points.push(trans(center));
    geometry = track(new THREE.BufferGeometry().setFromPoints(points));
    line = new THREE.Line(geometry, material);
    scene.add(line);
  }
  if (isBody(element)) {
    const body = element;
    if (!material) {
      material = track(
        new THREE.LineBasicMaterial({
          color: 0x00ffff,
          linewidth: 2
        })
      );
    }

    const nodes: Vector3[] = [];
    body.getNodes().forEach((nodeWI) => {
      nodes.push(trans(nodeWI.p));
    });
    nodes.forEach((node, i) => {
      nodes.slice(i + 1).forEach((otherNode) => {
        const geometry = track(
          new THREE.BufferGeometry().setFromPoints([node, otherNode])
        );
        // material is not null
        const line = new THREE.Line(geometry, material!);
        scene.add(line);
      });
    });
  }
};
