import {Vector3} from 'three';
import {SavedData, setFormulae} from '@store/reducers/dataGeometryDesigner';
import {DateTime} from 'luxon';
import store from '@store/store';

import {DeltaXYZ} from '@gd/NamedValues';
import {
  Assembly,
  Bar,
  AArm,
  BellCrank,
  Body,
  Tire,
  SpringDumper,
  Frame
} from './Elements';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getUprightAssy = (): Assembly => {
  const tireCenter = new Vector3(0, 607.5, 220);

  const tire = new Tire({
    name: 'leftTire',
    tireCenter: {...tireCenter, y: 'baseTread/2'},
    toLeftBearing: -30,
    toRightBearing: -60
  });

  tire.tireCenter.pointOffsetTools.push(
    new DeltaXYZ({
      value: {
        name: 'wheelOffset',
        dx: 0,
        dy: 'wheelOffset',
        dz: 0
      },
      parent: tire.tireCenter
    })
  );

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
      {
        lhs: tire.leftBearing,
        rhs: upright.points[1]
      },
      {
        lhs: tire.rightBearing,
        rhs: upright.points[2]
      }
    ]
  });

  const frontSuspensionSubAssy = new Assembly({
    name: 'frontSuspentionSubAssy',
    children: [uprightSubAssy, uprightSubAssy.getMirror()],
    joints: [],
    initialPosition: {x: 'frontSusCenter', y: 0, z: 0}
  });
  return frontSuspensionSubAssy;
};

const getLeftFrontSuspension = (): Assembly => {
  const tireCenter = new Vector3(0, 607.5, 220);

  const tire = new Tire({
    name: 'leftTire',
    tireCenter: {...tireCenter, y: 'baseTread/2'},
    toLeftBearing: -30,
    toRightBearing: -60
  });

  tire.tireCenter.pointOffsetTools.push(
    new DeltaXYZ({
      value: {
        name: 'wheelOffset',
        dx: 0,
        dy: 'wheelOffset',
        dz: 0
      },
      parent: tire.tireCenter
    })
  );

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
      {
        lhs: tire.leftBearing,
        rhs: upright.points[1]
      },
      {
        lhs: tire.rightBearing,
        rhs: upright.points[2]
      }
    ]
  });

  const upperArm = new AArm({
    name: 'upperArm',
    fixedPoints: [new Vector3(35, 260, 283.8), new Vector3(-200, 260, 283.8)],
    points: [new Vector3(-19.12, 521.93, 310), new Vector3(-20, 490.3, 284.2)]
  });

  const lowerArm = new AArm({
    name: 'lowerArm',
    fixedPoints: [new Vector3(35, 215, 132.2), new Vector3(-200, 215, 132.2)],
    // upright & pushRodPivod
    points: [new Vector3(-4.25, 545.82, 140)]
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
      {lhs: upright.fixedPoints[0], rhs: upperArm.points[0]},
      {lhs: upright.fixedPoints[1], rhs: lowerArm.points[0]},
      {lhs: upright.points[0], rhs: tieRod.point}
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

  const pullRod = new Bar({
    name: 'pullRod',
    fixedPoint: new Vector3(-20, 490.3, 284.2),
    point: new Vector3(-20, 316.5, 98.4)
  });

  const pullRodSubAssy = new Assembly({
    name: 'pullRodSubAssy',
    children: [coilover, bellCrank, pullRod],
    joints: [
      {lhs: coilover.point, rhs: bellCrank.points[0]},
      {lhs: bellCrank.points[1], rhs: pullRod.point}
    ]
  });

  const leftFrontSuspensionSubAssy = new Assembly({
    name: 'leftFrontSuspensionSubAssy',
    children: [armsSubAssy, pullRodSubAssy],
    joints: [{lhs: upperArm.points[1], rhs: pullRod.fixedPoint}]
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
    initialPosition: {x: 'frontSusCenter', y: 0, z: 0}
  });
  return frontSuspensionSubAssy;
};

const getLeftRearSuspension = (): Assembly => {
  const tireCenter = new Vector3(0, 607.5, 220);

  const tire = new Tire({
    name: 'leftTire',
    tireCenter: {...tireCenter, y: 'baseTread/2'},
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
      {lhs: tire.leftBearing, rhs: upright.points[0]},
      {lhs: tire.rightBearing, rhs: upright.points[1]}
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
      {lhs: upright.fixedPoints[0], rhs: upperArm.points[0]},
      {lhs: upright.fixedPoints[1], rhs: toeControlRod.point},
      {lhs: upright.fixedPoints[2], rhs: lowerLink1.point},
      {lhs: upright.fixedPoints[3], rhs: lowerLink2.point}
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
      {lhs: coilover.point, rhs: bellCrank.points[0]},
      {lhs: bellCrank.points[1], rhs: pushRod.point}
    ]
  });

  const leftRearSuspensionSubAssy = new Assembly({
    name: 'leftRearSuspensionSubAssy',
    children: [armsSubAssy, pushRodSubAssy],
    joints: [{lhs: upright.fixedPoints[4], rhs: pushRod.fixedPoint}]
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
    initialPosition: {
      x: 'rearSusCenter',
      y: 0,
      z: 0
    }
  });
  return rearSuspensionSubAssy;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getSuspension = (): Assembly => {
  const frontSuspension = getFrontSuspension();
  const rearSuspension = getRearSuspension();

  const suspensionAssy = new Frame({
    name: 'suspensionAssy',
    children: [frontSuspension, rearSuspension]
  });
  return suspensionAssy;
};

export const getSampleData = async (): Promise<SavedData> => {
  const formulae = [
    {name: 'baseTread', formula: '1215', absPath: 'global'},
    {name: 'wheelOffset', formula: '5', absPath: 'global'},
    {name: 'wheelBase', formula: '1600', absPath: 'global'},
    {name: 'frontWeightRatio', formula: '0.47', absPath: 'global'},
    {
      name: 'frontSusCenter',
      formula: '(1-frontWeightRatio)*wheelBase',
      absPath: 'global'
    },
    {
      name: 'rearSusCenter',
      formula: '-frontWeightRatio*wheelBase',
      absPath: 'global'
    }
  ];

  await store.dispatch(setFormulae(formulae));

  return {
    id: Number.MAX_SAFE_INTEGER,
    filename: 'KZ-RR11',
    note: '2013年度京都大学優勝車両',
    lastUpdated: DateTime.local().toString(),
    formulae,
    topAssembly: getSuspension().getDataElement(store.getState().dgd.present)
    // topAssembly: getUprightAssy().getDataElement(store.getState().dgd.present)
  };
};
