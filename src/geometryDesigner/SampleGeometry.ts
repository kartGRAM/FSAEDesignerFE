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

const getLeftFrontSuspension = (): Assembly => {
  const tireCenter = new Vector3(0, 607.5, 220);

  const tire = new Tire('leftTire', tireCenter, -30, -60);

  const upright = new Body(
    'upright',
    // UpperArm & LowwerArm
    [new Vector3(-19.12, 521.93, 310), new Vector3(-4.25, 545.82, 140)],
    // StearingPoint & TireSupportBearingPosition
    [
      new Vector3(-65, 530, 175),
      tireCenter.clone().add(new Vector3(0, -30, 0)),
      tireCenter.clone().add(new Vector3(0, -60, 0))
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
    [new Vector3(-30, 269.6, 142.2), new Vector3(-10, 269.6, 142.2)],
    [new Vector3(-20, 355.6, 193.3), new Vector3(-20, 316.5, 98.4)]
  );

  const pushRod = new Bar(
    'pullRod',
    new Vector3(-20, 490.3, 284.2),
    new Vector3(-20, 316.5, 98.4)
  );

  const pushRodSubAssy = new Assembly(
    'pullRodSubAssy',
    [coilover, bellCrank, pushRod],
    [
      {lhs: [0, 1], rhs: [1, 2]},
      {lhs: [1, 3], rhs: [2, 1]}
    ]
  );

  const leftFrontSuspensionSubAssy = new Assembly(
    'leftFrontSuspensionSubAssy',
    [armsSubAssy, pushRodSubAssy],
    [{lhs: [0, 4], rhs: [1, 3]}]
  );
  return leftFrontSuspensionSubAssy;
};

const getFrontSuspension = (): Assembly => {
  const leftSuspension = getLeftFrontSuspension();
  const rightSuspension = leftSuspension.getMirror();

  const frontSuspensionSubAssy = new Assembly(
    'frontSuspentionSubAssy',
    [leftSuspension, rightSuspension],
    [],
    new Vector3(848, 0, 0)
  );
  return frontSuspensionSubAssy;
};

const getLeftRearSuspension = (): Assembly => {
  const tireCenter = new Vector3(0, 607.5, 220);

  const tire = new Tire('leftTire', tireCenter, -30, -60);

  const upright = new Body(
    'upright',
    // MultiLinkSuspension
    // UpperArm & ToeControlRod & 2 LowerPoints
    [
      new Vector3(-15.34, 527, 310),
      new Vector3(100, 538.4, 213.5),
      new Vector3(19.34, 547, 140),
      new Vector3(-36.37, 547, 140),
      new Vector3(60, 547, 140)
    ],
    // & TireSupportBearingPosition
    [
      tireCenter.clone().add(new Vector3(0, -30, 0)),
      tireCenter.clone().add(new Vector3(0, -60, 0))
    ]
  );

  const uprightSubAssy = new Assembly(
    'uprightSubAssy',
    [tire, upright],
    [
      {lhs: [0, 0], rhs: [1, 4]},
      {lhs: [0, 1], rhs: [1, 5]}
    ]
  );

  const upperArm = new AArm(
    'upperArm',
    [new Vector3(460, 240, 260.1), new Vector3(20, 240, 260.1)],
    [new Vector3(-15.34, 527, 310)]
  );

  const lowerLink1 = new Bar(
    'lowerLink1',
    new Vector3(420, 215, 128.5),
    new Vector3(19.39, 547, 140)
  );

  const lowerLink2 = new Bar(
    'lowerLink2',
    new Vector3(20, 215, 128.5),
    new Vector3(-36.37, 547, 140)
  );
  const toeControlRod = new Bar(
    'toeControlRod',
    new Vector3(100, 225.5, 182),
    new Vector3(100, 538.4, 213.5)
  );

  const armsSubAssy = new Assembly(
    'armsSubAssy',
    [uprightSubAssy, upperArm, toeControlRod, lowerLink1, lowerLink2],
    [
      {lhs: [0, 0], rhs: [1, 2]},
      {lhs: [0, 1], rhs: [2, 1]},
      {lhs: [0, 2], rhs: [3, 1]},
      {lhs: [0, 3], rhs: [4, 1]}
    ]
  );

  const coilover = new SpringDumper(
    'coilover',
    new Vector3(60, 66.9, 350),
    new Vector3(60, 240.5, 413.9),
    -10,
    10
  );

  const bellCrank = new BellCrank(
    'bellCrank',
    [new Vector3(50, 275, 320), new Vector3(70, 275, 320)],
    [new Vector3(60, 240.5, 413.9), new Vector3(60, 329.7, 371.4)]
  );

  const pushRod = new Bar(
    'pushRod',
    new Vector3(60, 547, 140),
    new Vector3(60, 329.7, 371.4)
  );

  const pushRodSubAssy = new Assembly(
    'pushRodSubAssy',
    [coilover, bellCrank, pushRod],
    [
      {lhs: [0, 1], rhs: [1, 2]},
      {lhs: [1, 3], rhs: [2, 1]}
    ]
  );

  const leftRearSuspensionSubAssy = new Assembly(
    'leftFrontSuspensionSubAssy',
    [armsSubAssy, pushRodSubAssy],
    [{lhs: [0, 4], rhs: [1, 3]}]
  );
  return leftRearSuspensionSubAssy;
};

const getRearSuspension = (): Assembly => {
  const leftSuspension = getLeftRearSuspension();
  const rightSuspension = leftSuspension.getMirror();

  const rearSuspensionSubAssy = new Assembly(
    'rearSuspentionSubAssy',
    [leftSuspension, rightSuspension],
    [],
    new Vector3(-752, 0, 0)
  );
  return rearSuspensionSubAssy;
};

export const getSuspension = (): Assembly => {
  const frontSuspension = getFrontSuspension();
  const rearSuspension = getRearSuspension();

  const suspensionAssy = new Assembly(
    'suspensionAssy',
    [frontSuspension, rearSuspension],
    []
  );
  return suspensionAssy;
};
