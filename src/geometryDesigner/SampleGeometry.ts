import {Vector3} from 'three';
import {
  Assembly,
  Bar,
  AArm,
  BellCrank,
  Body,
  Tire,
  SpringDumper
} from './Elements';

export const getLeftFrontSuspension = (): Assembly => {
  const tireCenter = new Vector3(0, 607.5, 220);

  const tire = new Tire('leftTire', tireCenter, -30, -60);

  const upright = new Body(
    'upright',
    // UpperArm & LowwerArm
    [new Vector3(-19.12, 521.93, 310), new Vector3(-4.25, 545.82, 140)],
    // StearingPoint & TireSupportBearingPosition
    [
      new Vector3(-65, 530, 175),
      tireCenter.sub(new Vector3(0, -30, 0)),
      tireCenter.add(new Vector3(0, -60, 0))
    ]
  );

  const uprightSubAssy = new Assembly(
    'uprightSubAssy',
    [tire, upright],
    [
      {lhs: [0, 0], rhs: [1, 3]},
      {lhs: [0, 1], rhs: [1, 4]}
    ]
  );

  const upperArm = new AArm(
    'upperArm',
    [new Vector3(35, 260, 283.8), new Vector3(-200, 260, 283.8)],
    [new Vector3(-19.12, 521.93, 310)]
  );

  const lowerArm = new AArm(
    'lowerArm',
    [new Vector3(35, 215, 132.2), new Vector3(-200, 215, 132.2)],
    // upright & pushRodPivod
    [new Vector3(-4.25, 545.82, 140), new Vector3(-20, 490.3, 284.2)]
  );

  const tieRod = new Bar(
    'tieRod',
    new Vector3(-65, 213.3, 162.6),
    new Vector3(-65, 530, 175)
  );

  const armsSubAssy = new Assembly(
    'armsSubAssy',
    [uprightSubAssy, upperArm, lowerArm, tieRod],
    [
      {lhs: [0, 0], rhs: [1, 2]},
      {lhs: [0, 1], rhs: [2, 2]},
      {lhs: [0, 2], rhs: [3, 1]}
    ]
  );

  const coilover = new SpringDumper(
    'coilover',
    new Vector3(-20, 261.1, 352.3),
    new Vector3(-20, 355.6, 193.3),
    -10,
    10
  );

  const bellCrank = new BellCrank(
    'bellCrank',
    [new Vector3(-20, 269.6, 142.2), new Vector3(0, 269.6, 142.2)],
    [new Vector3(-20, 355.6, 193.3), new Vector3(-20, 316.5, 98.4)]
  );

  const pushRod = new Bar(
    'pushRod',
    new Vector3(-20, 490.3, 284.2),
    new Vector3(-20, 316.5, 98.4)
  );

  const pushRodSubAssy = new Assembly(
    'pushRodSubAssy',
    [coilover, bellCrank, pushRod],
    [
      {lhs: [0, 1], rhs: [1, 2]},
      {lhs: [1, 3], rhs: [2, 2]}
    ]
  );

  const leftFrontSuspensionSubAssy = new Assembly(
    'leftFrontSuspensionSubAssy',
    [armsSubAssy, pushRodSubAssy],
    [{lhs: [0, 4], rhs: [1, 3]}]
  );
  return leftFrontSuspensionSubAssy;
};
