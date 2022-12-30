import * as THREE from 'three';

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
