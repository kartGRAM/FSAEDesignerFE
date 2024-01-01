import {Vector3} from 'three';
import {
  Elements,
  IElement,
  IDataElement,
  IAssembly,
  IDataAssembly,
  isDataAssembly,
  isDataFrame,
  isDataBar,
  isDataSpringDumper,
  isDataAArm,
  isDataBellCrank,
  isDataBody,
  isDataLinearBushing,
  isDataTire
} from './IElements';
import {AArm} from './Elements/AArm';
import {Assembly} from './Elements/Assembly';
import {Bar} from './Elements/Bar';
import {BellCrank} from './Elements/BellCrank';
import {Body} from './Elements/Body';
import {Frame} from './Elements/Frame';
import {LinearBushing} from './Elements/LinearBushing';
import {SpringDumper} from './Elements/SpringDumper';
import {Tire} from './Elements/Tire';

export {
  AArm,
  Assembly,
  Bar,
  BellCrank,
  Body,
  Frame,
  LinearBushing,
  SpringDumper,
  Tire
};

export function getAssembly(assembly: IDataAssembly): IAssembly {
  return getElement(assembly) as IAssembly;
}

export function getNewElement(name: Elements): IElement {
  if (name === 'Assembly') {
    return new Assembly({name: 'newAssembly', children: [], joints: []});
  }
  if (name === 'Frame') {
    return new Frame({name: 'newFrame', children: []});
  }
  if (name === 'Bar') {
    return new Bar({
      name: 'newBar',
      fixedPoint: new Vector3(0, 0, 0),
      point: new Vector3(0, 200, 0)
    });
  }
  if (name === 'SpringDumper') {
    return new SpringDumper({
      name: 'newSpringDumper',
      fixedPoint: new Vector3(0, 0, 0),
      point: new Vector3(0, 200, 0),
      dlMin: 0,
      dlMax: 50
    });
  }
  if (name === 'AArm') {
    return new AArm({
      name: 'newAArm',
      fixedPoints: [new Vector3(0, 0, 0), new Vector3(200, 0, 0)],
      points: [new Vector3(0, 200, 0)]
    });
  }
  if (name === 'BellCrank') {
    return new BellCrank({
      name: 'newBellCrank',
      fixedPoints: [new Vector3(-50, 0, 0), new Vector3(50, 0, 0)],
      points: [new Vector3(0, 100, 0), new Vector3(0, 0, 100)]
    });
  }
  if (name === 'Body') {
    return new Body({
      name: 'newBody',
      fixedPoints: [],
      points: []
    });
  }
  if (name === 'Tire') {
    return new Tire({
      name: 'newTire',
      tireCenter: new Vector3(0, 0, 220),
      toLeftBearing: -30,
      toRightBearing: -60
    });
  }
  if (name === 'LinearBushing') {
    return new LinearBushing({
      name: 'newLinearBushing',
      fixedPoints: [new Vector3(0, 0, 0), new Vector3(0, 200, 0)],
      toPoints: [150],
      dlMin: -50,
      dlMax: 50
    });
  }
  throw Error('Not Supported Exception');
}

export function getElement(element: IDataElement): IElement {
  if (isDataAssembly(element)) {
    if (isDataFrame(element)) {
      return new Frame(element);
    }
    return new Assembly(element);
  }
  if (isDataSpringDumper(element)) {
    return new SpringDumper(element);
  }
  if (isDataBar(element)) {
    return new Bar(element);
  }
  if (isDataAArm(element)) {
    return new AArm(element);
  }
  if (isDataBellCrank(element)) {
    return new BellCrank(element);
  }
  if (isDataBody(element)) {
    return new Body(element);
  }
  if (isDataTire(element)) {
    return new Tire(element);
  }
  if (isDataLinearBushing(element)) {
    return new LinearBushing(element);
  }
  throw Error('Not Supported Exception');
}

export function getDummyElement(): IAssembly {
  return new Assembly({
    name: 'temp',
    children: [],
    joints: []
  });
}
