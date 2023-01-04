import * as THREE from 'three';
import {Vector3} from 'three';

export function getIntersectionLineFromTwoPlanes(
  lhs: THREE.Plane,
  rhs: THREE.Plane
) {
  const threePlanes = [lhs, rhs];
  const h = threePlanes.map((p) => p.constant);
  const n = threePlanes.map((p) => p.normal.clone());
  const dot = n[0].dot(n[1]);
  const coef1 = (-h[0] + h[1] * dot) / (1 - dot * dot);
  const coef2 = (h[0] * dot - h[1]) / (1 - dot * dot);
  const cross = n[0].clone().cross(n[1]).normalize().multiplyScalar(400);
  const start = n[0]
    .clone()
    .multiplyScalar(coef1)
    .add(n[1].clone().multiplyScalar(coef2));
  return new THREE.Line3(start, start.clone().add(cross));
}

export function getPlaneFromAxisAndPoint(
  point: THREE.Vector3,
  axis: THREE.Line3
) {
  const normal = point
    .clone()
    .sub(axis.start)
    .cross(axis.delta(new THREE.Vector3()))
    .normalize();
  const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, point);
  return plane;
}

export function getIntersectionOfPlaneAndLine(
  plane: THREE.Plane,
  line: THREE.Line3
) {
  const direction = line.delta(new THREE.Vector3());

  const denominator = plane.normal.dot(direction);

  if (denominator === 0) {
    return new THREE.Vector3(
      Number.MAX_VALUE,
      Number.MAX_VALUE,
      Number.MAX_VALUE
    );
  }

  const t = -(line.start.dot(plane.normal) + plane.constant) / denominator;

  return direction.clone().multiplyScalar(t).add(line.start);
}

export function getClosestPointsOfPlaneAndLine(
  plane: THREE.Plane,
  line: THREE.Line3
): {plane: Vector3; line: Vector3} {
  const {normal} = plane;
  const delta = line.delta(new Vector3()).normalize();
  const checkParallel = normal.dot(delta) <= Number.EPSILON * 2 ** 8;
  if (checkParallel) {
    const pLine = line.closestPointToPoint(new Vector3(), false, new Vector3());
    const pPlane = plane.projectPoint(pLine, new Vector3());
    return {plane: pPlane, line: pLine};
  }
  const point = getIntersectionOfPlaneAndLine(plane, line);
  return {plane: point, line: point.clone()};
}

export function getClosestPointsOfTwoLines(lh: THREE.Line3, rh: THREE.Line3) {
  const threeLines = [lh, rh];
  const m = threeLines.map((line) => line.delta(new Vector3()).normalize());
  const x = threeLines.map((line) => line.start.clone());
  const mm = m[0].dot(m[1]);
  // 並行の場合
  if (1 - mm * mm <= Number.EPSILON * 2 ** 8) {
    const lhs = lh.closestPointToPoint(new Vector3(), false, new Vector3());
    const rhs = rh.closestPointToPoint(lhs, false, new Vector3());
    return {lhs, rhs};
  }

  const lhs = [
    m[0].clone().sub(m[1].clone().multiplyScalar(mm)),
    m[1].clone().sub(m[0].clone().multiplyScalar(mm))
  ];
  const rhs = [x[1].clone().sub(x[0]), x[0].clone().sub(x[1])];
  const k = lhs.map((_, i) =>
    x[i].add(m[i].multiplyScalar(lhs[i].dot(rhs[i]) / (1 - mm * mm)))
  );
  return {lhs: k[0], rhs: k[1]};
}
