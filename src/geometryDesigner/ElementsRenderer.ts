import * as THREE from 'three';
import track from '@app/utils/ResourceTracker';
import {Vector3, Matrix3} from '@gd/NamedValues';
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

export const render = (element: IElement, scene: THREE.Scene): void => {
  if (element.visible === false) {
    return;
  }
  if (isAssembly(element)) {
    const assembly = element;
    assembly.children.forEach((child) => {
      render(child, scene);
    });
    return;
  }
  const position = element.position ?? new Vector3({name: 'position'});
  const rotation = element.rotation ?? new Matrix3({name: 'rotation'});
  const coMatrix = store.getState().dgd.transCoordinateMatrix;
  const trans = (p: Vector3) => {
    const tmp = position
      .clone()
      .add(p.clone().applyMatrix3(rotation))
      .applyMatrix3(new Matrix3(coMatrix));
    tmp.name = p.name;
    return tmp;
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
      }),
      'Assembly'
    );
    const geometry = track(
      new THREE.BufferGeometry().setFromPoints(nodes),
      'Assembly'
    );
    const mesh = track(new THREE.Points(geometry, pm), 'Assembly');
    scene.add(mesh);
  }

  if (isTire(element)) {
    const tire = element;
    let material: THREE.Material = track(
      new THREE.MeshNormalMaterial({side: THREE.DoubleSide}),
      'Assembly'
    );
    const geometry = track(
      new THREE.CircleGeometry(tire.diameter / 2, 32),
      'Assembly'
    );
    const circle = track(new THREE.Mesh(geometry, material), 'Assembly');
    circle.rotateX(THREE.MathUtils.degToRad(90));
    circle.applyMatrix4(
      new THREE.Matrix4().setFromMatrix3(new Matrix3(coMatrix))
    );
    circle.position.add(trans(tire.tireCenter));
    scene.add(circle);

    material = track(
      new THREE.LineBasicMaterial({
        color: 0xff0000,
        linewidth: 2
      }),
      'Assembly'
    );
    const points = [];
    points.push(trans(tire.rightBearing));
    points.push(trans(tire.leftBearing));
    points.push(trans(tire.tireCenter));

    const lgeometry = track(
      new THREE.BufferGeometry().setFromPoints(points),
      'Assembly'
    );

    const line = track(new THREE.Line(lgeometry, material), 'Assembly');
    scene.add(line);
  }
  if (isBar(element)) {
    const bar = element;
    const material = track(
      new THREE.LineBasicMaterial({
        color: 0xff0000,
        linewidth: 2
      }),
      'Assembly'
    );
    const points = [];
    points.push(trans(bar.point));
    points.push(trans(bar.fixedPoint));

    const geometry = track(
      new THREE.BufferGeometry().setFromPoints(points),
      'Assembly'
    );

    const line = track(new THREE.Line(geometry, material), 'Assembly');
    scene.add(line);
  }
  if (isSpringDumper(element)) {
    const spring = element;
    const material = track(
      new THREE.LineBasicMaterial({
        color: 0x0000ff,
        linewidth: 2
      }),
      'Assembly'
    );
    const points = [];
    points.push(trans(spring.point));
    points.push(trans(spring.fixedPoint));

    const geometry = track(
      new THREE.BufferGeometry().setFromPoints(points),
      'Assembly'
    );

    const line = track(new THREE.Line(geometry, material), 'Assembly');
    scene.add(line);
  }
  if (isAArm(element)) {
    const aArm = element;
    const material = track(
      new THREE.LineBasicMaterial({
        color: 0xff0000,
        linewidth: 2
      }),
      'Assembly'
    );
    const points = [];
    points.push(trans(aArm.fixedPoints[0]));
    const flexPoints = [...aArm.points];
    // points have at least one point;
    const point0 = flexPoints.shift()!;
    points.push(trans(point0));
    points.push(trans(aArm.fixedPoints[1]));
    const geometry = track(
      new THREE.BufferGeometry().setFromPoints(points),
      'Assembly'
    );

    const line = track(new THREE.Line(geometry, material), 'Assembly');
    scene.add(line);
  }
  if (isBellCrank(element)) {
    const bellCrank = element;
    const material = track(
      new THREE.LineBasicMaterial({
        color: 0xff0000,
        linewidth: 2
      }),
      'Assembly'
    );
    let points: Vector3[] = [];
    points.push(trans(bellCrank.fixedPoints[0]));
    points.push(trans(bellCrank.fixedPoints[1]));
    let geometry = track(
      new THREE.BufferGeometry().setFromPoints(points),
      'Assembly'
    );
    let line = track(new THREE.Line(geometry, material), 'Assembly');
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
    geometry = track(
      new THREE.BufferGeometry().setFromPoints(points),
      'Assembly'
    );
    line = track(new THREE.Line(geometry, material), 'Assembly');
    scene.add(line);
  }
  if (isBody(element)) {
    const body = element;
    const material = track(
      new THREE.LineBasicMaterial({
        color: 0x00ffff,
        linewidth: 2
      }),
      'Assembly'
    );

    const nodes: Vector3[] = [];
    body.getNodes().forEach((nodeWI) => {
      nodes.push(trans(nodeWI.p));
    });
    nodes.forEach((node, i) => {
      nodes.slice(i + 1).forEach((otherNode) => {
        const geometry = track(
          new THREE.BufferGeometry().setFromPoints([node, otherNode]),
          'Assembly'
        );
        // material is not null
        const line = track(new THREE.Line(geometry, material!), 'Assembly');
        scene.add(line);
      });
    });
  }
};
