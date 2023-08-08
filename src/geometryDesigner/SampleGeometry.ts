import {Vector3} from 'three';
import {setFormulae} from '@store/reducers/dataGeometryDesigner';

import {SavedData} from '@gd/ISaveData';
import {DateTime} from 'luxon';
import {getDgd, store} from '@store/getDgd';

import {DeltaXYZ} from '@gd/NamedValues';
import {
  Assembly,
  Bar,
  AArm,
  BellCrank,
  Body,
  Tire,
  SpringDumper,
  Frame,
  LinearBushing
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
        lhs: tire.leftBearing.nodeID,
        rhs: upright.points[1].nodeID
      },
      {
        lhs: tire.rightBearing.nodeID,
        rhs: upright.points[2].nodeID
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

const getFrontLeftSuspension = (): Assembly => {
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
        lhs: tire.leftBearing.nodeID,
        rhs: upright.points[1].nodeID
      },
      {
        lhs: tire.rightBearing.nodeID,
        rhs: upright.points[2].nodeID
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
      {lhs: upright.fixedPoints[0].nodeID, rhs: upperArm.points[0].nodeID},
      {lhs: upright.fixedPoints[1].nodeID, rhs: lowerArm.points[0].nodeID},
      {lhs: upright.points[0].nodeID, rhs: tieRod.point.nodeID}
    ]
  });

  const coilover = new SpringDumper({
    name: 'coilover',
    fixedPoint: new Vector3(-20, 261.1, 352.3),
    point: new Vector3(-20, 355.6, 193.3),
    dlMin: -30,
    dlMax: 30
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
      {lhs: coilover.point.nodeID, rhs: bellCrank.points[0].nodeID},
      {lhs: bellCrank.points[1].nodeID, rhs: pullRod.point.nodeID}
    ]
  });

  const leftSuspension = new Assembly({
    name: 'leftFrontSuspensionSubAssy',
    children: [armsSubAssy, pullRodSubAssy],
    joints: [{lhs: upperArm.points[1].nodeID, rhs: pullRod.fixedPoint.nodeID}]
  });
  return leftSuspension;
};

const getFrontSuspension = (): Assembly => {
  const leftSuspension = getFrontLeftSuspension();
  const rightSuspension = leftSuspension.getMirror();
  const rackAndPinion = new LinearBushing({
    name: 'rackAndPinion',
    fixedPoints: [new Vector3(-65, -150, 162.6), new Vector3(-65, 150, 162.6)],
    toPoints: [213.3, -213.3],
    dlMin: -30,
    dlMax: 30
  });
  const tieRod = leftSuspension.getElementByName('tieRod') as Bar;
  const mirTieRod = rightSuspension.getElementByName('mirror_tieRod') as Bar;

  const frontSuspensionSubAssy = new Assembly({
    name: 'frontSuspentionSubAssy',
    children: [leftSuspension, rightSuspension, rackAndPinion],
    joints: [
      {
        lhs: tieRod.fixedPoint.nodeID,
        rhs: rackAndPinion.points[0].nodeID
      },
      {
        lhs: mirTieRod.fixedPoint.nodeID,
        rhs: rackAndPinion.points[1].nodeID
      }
    ],
    initialPosition: {x: 'frontSusCenter', y: 0, z: 0}
  });
  /* const frontSuspensionSubAssy = new Assembly({
    name: 'frontSuspentionSubAssy',
    children: [leftSuspension, rightSuspension],
    joints: [],
    initialPosition: {x: 'frontSusCenter', y: 0, z: 0}
  }); */
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
      {lhs: tire.leftBearing.nodeID, rhs: upright.points[0].nodeID},
      {lhs: tire.rightBearing.nodeID, rhs: upright.points[1].nodeID}
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
      {lhs: upright.fixedPoints[0].nodeID, rhs: upperArm.points[0].nodeID},
      {lhs: upright.fixedPoints[1].nodeID, rhs: toeControlRod.point.nodeID},
      {lhs: upright.fixedPoints[2].nodeID, rhs: lowerLink1.point.nodeID},
      {lhs: upright.fixedPoints[3].nodeID, rhs: lowerLink2.point.nodeID}
    ]
  });

  const coilover = new SpringDumper({
    name: 'coilover',
    fixedPoint: new Vector3(60, 66.9, 350),
    point: new Vector3(60, 240.5, 413.9),
    dlMin: -30,
    dlMax: 30
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
      {lhs: coilover.point.nodeID, rhs: bellCrank.points[0].nodeID},
      {lhs: bellCrank.points[1].nodeID, rhs: pushRod.point.nodeID}
    ]
  });

  const leftRearSuspensionSubAssy = new Assembly({
    name: 'leftRearSuspensionSubAssy',
    children: [armsSubAssy, pushRodSubAssy],
    joints: [
      {lhs: upright.fixedPoints[4].nodeID, rhs: pushRod.fixedPoint.nodeID}
    ]
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
const getKZRR11Assy = (): Assembly => {
  const frontSuspension = getFrontSuspension();
  const rearSuspension = getRearSuspension();

  const suspensionAssy = new Frame({
    name: 'KZRR11Assy',
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
    controls: [],
    datumObjects: [],
    measureTools: [],
    analysis: [],
    readonlyVariables: [],
    options: {
      fixSpringDumperDuaringControl: false,
      assemblyMode: 'FixedFrame'
    },
    topAssembly: getKZRR11Assy().getDataElement(getDgd())
  };
};
