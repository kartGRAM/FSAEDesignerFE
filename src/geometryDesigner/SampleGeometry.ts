import {Vector3} from 'three';
import {SavedData} from '@store/reducers/dataGeometryDesigner';
import {DateTime} from 'luxon';
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

  const tire = new Tire({
    name: 'leftTire',
    tireCenter,
    toLeftBearing: -30,
    toRightBearing: -60
  });

  const upright = new Body({
    name: 'upright',
    // UpperArm & LowwerArm
    fixedPoints: [
      new Vector3(-19.12, 521.93, 310),
      new Vector3(-4.25, 545.82, 140)
    ],
    // StearingPoint & TireSupportBearingPosition
    points: [
      new Vector3(-65, 530, 175),
      tireCenter.clone().add(new Vector3(0, -30, 0)),
      tireCenter.clone().add(new Vector3(0, -60, 0))
    ]
  });

  const uprightSubAssy = new Assembly({
    name: 'uprightSubAssy',
    children: [tire, upright],
    joints: [
      {lhs: [0, 0], rhs: [1, 3]},
      {lhs: [0, 1], rhs: [1, 4]}
    ]
  });

  const upperArm = new AArm({
    name: 'upperArm',
    fixedPoints: [new Vector3(35, 260, 283.8), new Vector3(-200, 260, 283.8)],
    points: [new Vector3(-19.12, 521.93, 310)]
  });

  const lowerArm = new AArm({
    name: 'lowerArm',
    fixedPoints: [new Vector3(35, 215, 132.2), new Vector3(-200, 215, 132.2)],
    // upright & pushRodPivod
    points: [new Vector3(-4.25, 545.82, 140), new Vector3(-20, 490.3, 284.2)]
  });

  const tieRod = new Bar({
    name: 'tieRod',
    fixedPoint: new Vector3(-65, 213.3, 162.6),
    point: new Vector3(-65, 530, 175)
  });

  const armsSubAssy = new Assembly({
    name: 'armsSubAssy',
    children: [uprightSubAssy, upperArm, lowerArm, tieRod],
    joints: [
      {lhs: [0, 0], rhs: [1, 2]},
      {lhs: [0, 1], rhs: [2, 2]},
      {lhs: [0, 2], rhs: [3, 1]}
    ]
  });

  const coilover = new SpringDumper({
    name: 'coilover',
    fixedPoint: new Vector3(-20, 261.1, 352.3),
    point: new Vector3(-20, 355.6, 193.3),
    dlMin: -10,
    dlMax: 10
  });

  const bellCrank = new BellCrank({
    name: 'bellCrank',
    fixedPoints: [
      new Vector3(-30, 269.6, 142.2),
      new Vector3(-10, 269.6, 142.2)
    ],
    points: [new Vector3(-20, 355.6, 193.3), new Vector3(-20, 316.5, 98.4)]
  });

  const pushRod = new Bar({
    name: 'pullRod',
    fixedPoint: new Vector3(-20, 490.3, 284.2),
    point: new Vector3(-20, 316.5, 98.4)
  });

  const pushRodSubAssy = new Assembly({
    name: 'pullRodSubAssy',
    children: [coilover, bellCrank, pushRod],
    joints: [
      {lhs: [0, 1], rhs: [1, 2]},
      {lhs: [1, 3], rhs: [2, 1]}
    ]
  });

  const leftFrontSuspensionSubAssy = new Assembly({
    name: 'leftFrontSuspensionSubAssy',
    children: [armsSubAssy, pushRodSubAssy],
    joints: [{lhs: [0, 4], rhs: [1, 3]}]
  });
  return leftFrontSuspensionSubAssy;
};

const getFrontSuspension = (): Assembly => {
  const leftSuspension = getLeftFrontSuspension();
  const rightSuspension = leftSuspension.getMirror();

  const frontSuspensionSubAssy = new Assembly({
    name: 'frontSuspentionSubAssy',
    children: [leftSuspension, rightSuspension],
    joints: [],
    initialPosition: new Vector3(848, 0, 0)
  });
  return frontSuspensionSubAssy;
};

const getLeftRearSuspension = (): Assembly => {
  const tireCenter = new Vector3(0, 607.5, 220);

  const tire = new Tire({
    name: 'leftTire',
    tireCenter,
    toLeftBearing: -30,
    toRightBearing: -60
  });

  const upright = new Body({
    name: 'upright',
    // MultiLinkSuspension
    // UpperArm & ToeControlRod & 2 LowerPoints
    fixedPoints: [
      new Vector3(-15.34, 527, 310),
      new Vector3(100, 538.4, 213.5),
      new Vector3(19.34, 547, 140),
      new Vector3(-36.37, 547, 140),
      new Vector3(60, 547, 140)
    ],
    // & TireSupportBearingPosition
    points: [
      tireCenter.clone().add(new Vector3(0, -30, 0)),
      tireCenter.clone().add(new Vector3(0, -60, 0))
    ]
  });

  const uprightSubAssy = new Assembly({
    name: 'uprightSubAssy',
    children: [tire, upright],
    joints: [
      {lhs: [0, 0], rhs: [1, 4]},
      {lhs: [0, 1], rhs: [1, 5]}
    ]
  });

  const upperArm = new AArm({
    name: 'upperArm',
    fixedPoints: [new Vector3(460, 240, 260.1), new Vector3(20, 240, 260.1)],
    points: [new Vector3(-15.34, 527, 310)]
  });

  const lowerLink1 = new Bar({
    name: 'lowerLink1',
    fixedPoint: new Vector3(420, 215, 128.5),
    point: new Vector3(19.39, 547, 140)
  });

  const lowerLink2 = new Bar({
    name: 'lowerLink2',
    fixedPoint: new Vector3(20, 215, 128.5),
    point: new Vector3(-36.37, 547, 140)
  });
  const toeControlRod = new Bar({
    name: 'toeControlRod',
    fixedPoint: new Vector3(100, 225.5, 182),
    point: new Vector3(100, 538.4, 213.5)
  });

  const armsSubAssy = new Assembly({
    name: 'armsSubAssy',
    children: [uprightSubAssy, upperArm, toeControlRod, lowerLink1, lowerLink2],
    joints: [
      {lhs: [0, 0], rhs: [1, 2]},
      {lhs: [0, 1], rhs: [2, 1]},
      {lhs: [0, 2], rhs: [3, 1]},
      {lhs: [0, 3], rhs: [4, 1]}
    ]
  });

  const coilover = new SpringDumper({
    name: 'coilover',
    fixedPoint: new Vector3(60, 66.9, 350),
    point: new Vector3(60, 240.5, 413.9),
    dlMin: -10,
    dlMax: 10
  });

  const bellCrank = new BellCrank({
    name: 'bellCrank',
    fixedPoints: [new Vector3(50, 275, 320), new Vector3(70, 275, 320)],
    points: [new Vector3(60, 240.5, 413.9), new Vector3(60, 329.7, 371.4)]
  });

  const pushRod = new Bar({
    name: 'pushRod',
    fixedPoint: new Vector3(60, 547, 140),
    point: new Vector3(60, 329.7, 371.4)
  });

  const pushRodSubAssy = new Assembly({
    name: 'pushRodSubAssy',
    children: [coilover, bellCrank, pushRod],
    joints: [
      {lhs: [0, 1], rhs: [1, 2]},
      {lhs: [1, 3], rhs: [2, 1]}
    ]
  });

  const leftRearSuspensionSubAssy = new Assembly({
    name: 'leftFrontSuspensionSubAssy',
    children: [armsSubAssy, pushRodSubAssy],
    joints: [{lhs: [0, 4], rhs: [1, 3]}]
  });
  return leftRearSuspensionSubAssy;
};

const getRearSuspension = (): Assembly => {
  const leftSuspension = getLeftRearSuspension();
  const rightSuspension = leftSuspension.getMirror();

  const rearSuspensionSubAssy = new Assembly({
    name: 'rearSuspentionSubAssy',
    children: [leftSuspension, rightSuspension],
    joints: [],
    initialPosition: new Vector3(-752, 0, 0)
  });
  return rearSuspensionSubAssy;
};

const getSuspension = (): Assembly => {
  const frontSuspension = getFrontSuspension();
  const rearSuspension = getRearSuspension();

  const suspensionAssy = new Assembly({
    name: 'suspensionAssy',
    children: [frontSuspension, rearSuspension],
    joints: []
  });
  return suspensionAssy;
};

export const getSampleData = (): SavedData => {
  return {
    id: Number.MAX_SAFE_INTEGER,
    filename: 'KZ-RR11',
    note: '2013年度京都大学優勝車両',
    lastUpdated: DateTime.local().toString(),
    formulae: [
      {name: 'tread', formula: '1215', absPath: 'global'},
      {name: 'wheelBase', formula: '1600', absPath: 'global'},
      {name: 'frontWeightRatio', formula: '0.47', absPath: 'global'},
      {
        name: 'frontSusCenter',
        formula: '(1-frontWeightRatio)*wheelBase',
        absPath: 'global'
      },
      {
        name: 'rearSusCenter',
        formula: 'frontWeightRatio*wheelBase',
        absPath: 'global'
      }
    ],
    topAssembly: getSuspension().getDataElement()
  };
};
