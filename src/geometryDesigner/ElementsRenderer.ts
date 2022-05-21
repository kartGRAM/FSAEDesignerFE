import * as THREE from 'three';
import track from '@app/utils/ResourceTracker';
import {Vector3, Matrix3} from 'three';
import {
  IElement,
  IBar,
  ISpringDumper,
  ITire,
  IAArm,
  IBellCrank,
  IBody,
  IAssembly
} from './IElements';

// eslint-disable-next-line prettier/prettier
const isBar = (element: IElement): element is IBar => element.className === "Bar";
const isSpringDumper = (element: IElement): element is ISpringDumper =>
  element.className === 'SpringDumper';
const isTire = (element: IElement): element is ITire =>
  element.className === 'Tire';
const isAArm = (element: IElement): element is IAArm =>
  element.className === 'AArm';
const isBody = (element: IElement): element is IBody =>
  element.className === 'Body';
const isBellCrank = (element: IElement): element is IBellCrank =>
  element.className === 'BellCrank';
const isAssembly = (element: IElement): element is IAssembly =>
  element.className === 'Assembly';

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
  // show nodes
  {
    const nodes: Vector3[] = [];
    element.getNodes().forEach((nodeWI) => {
      nodes.push(position.clone().add(nodeWI.p.clone().applyMatrix3(rotation)));
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
    circle.position.add(
      position.clone().add(tire.tireCenter.clone().applyMatrix3(rotation))
    );
    scene.add(circle);

    material = track(
      new THREE.LineBasicMaterial({
        color: 0xff0000,
        linewidth: 2
      })
    );
    const points = [];
    points.push(position.clone().add(tire.rightBearing.applyMatrix3(rotation)));
    points.push(position.clone().add(tire.leftBearing.applyMatrix3(rotation)));
    points.push(
      position.clone().add(tire.tireCenter.clone().applyMatrix3(rotation))
    );

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
    points.push(position.clone().add(bar.point.clone().applyMatrix3(rotation)));
    points.push(
      position.clone().add(bar.fixedPoint.clone().applyMatrix3(rotation))
    );

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
    points.push(
      position.clone().add(spring.point.clone().applyMatrix3(rotation))
    );
    points.push(
      position.clone().add(spring.fixedPoint.clone().applyMatrix3(rotation))
    );

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
    points.push(
      position.clone().add(aArm.fixedPoints[0].clone().applyMatrix3(rotation))
    );
    const flexPoints = [...aArm.points];
    // points have at least one point;
    const point0 = flexPoints.shift()!;
    points.push(position.clone().add(point0.clone().applyMatrix3(rotation)));
    points.push(
      position.clone().add(aArm.fixedPoints[1].clone().applyMatrix3(rotation))
    );
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
    points.push(
      position
        .clone()
        .add(bellCrank.fixedPoints[0].clone().applyMatrix3(rotation))
    );
    points.push(
      position
        .clone()
        .add(bellCrank.fixedPoints[1].clone().applyMatrix3(rotation))
    );
    let geometry = track(new THREE.BufferGeometry().setFromPoints(points));
    let line = new THREE.Line(geometry, material);
    scene.add(line);
    const center = bellCrank.fixedPoints[0]
      .clone()
      .add(bellCrank.fixedPoints[1])
      .multiplyScalar(0.5);
    points = [];
    points.push(position.clone().add(center.clone().applyMatrix3(rotation)));
    // points have at least two points;
    points.push(
      position.clone().add(bellCrank.points[0].clone().applyMatrix3(rotation))
    );
    points.push(
      position.clone().add(bellCrank.points[1].clone().applyMatrix3(rotation))
    );
    points.push(position.clone().add(center.clone().applyMatrix3(rotation)));
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
      nodes.push(position.clone().add(nodeWI.p.clone().applyMatrix3(rotation)));
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
