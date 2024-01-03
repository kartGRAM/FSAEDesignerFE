import {Vector3} from 'three';
import {
  NamedVector3,
  NamedVector3LW,
  NamedMatrix3,
  NamedQuaternion,
  NamedString,
  NamedNumber,
  NamedBooleanOrUndefined,
  isDeltaXYZ,
  isDirectionLength
} from '@gd/NamedValues';
import {
  INamedNumberRO,
  IDataVector3,
  INamedVector3,
  INamedVector3RO,
  INamedMatrix3,
  IPointOffsetTool
} from '@gd/INamedValues';

import {v4 as uuidv4} from 'uuid';
import {GDState} from '@store/reducers/dataGeometryDesigner';
import {minus} from '@app/utils/helpers';
// import {getIntersectionLineFromTwoPlanes} from '@utils/threeUtils';
import {getRootNode} from '../INode';
import {
  isDataElement,
  Elements,
  IElement,
  isElement,
  IDataElement,
  IAssembly,
  isAssembly,
  Meta,
  assignMeta,
  isMirror
} from '../IElements';

export abstract class Element implements IElement {
  meta?: Meta;

  isElement = true as const;

  _nodeID: string;

  getName(): string {
    return this.name.value;
  }

  getNamedAbsPath(): string {
    return `${this.getName()}${
      this.parent ? `@${this.parent.getNamedAbsPath()}` : ''
    }`;
  }

  name: NamedString;

  parent: IAssembly | null = null;

  get absPath(): string {
    return `${this.nodeID}${this.parent ? `@${this.parent.absPath}` : ''}`;
  }

  get nodeID(): string {
    return this._nodeID;
  }

  getRoot(): IAssembly | null {
    const root = getRootNode(this);
    if (root) {
      if (isElement(root) && isAssembly(root)) return root;
    }
    return null;
    // let assembly: IAssembly | null = this.parent;
    // if (assembly) {
    // while (assembly.parent !== null) {
    // assembly = assembly.parent;
    // }
    // } else if (isAssembly(this)) return this;
    // return assembly;
  }

  protected getAnotherElement(
    nodeID: string | undefined | null
  ): IElement | null {
    if (nodeID) {
      const root = this.getRoot();
      const element = root
        ?.flatten(false)
        .find((child) => child.nodeID === nodeID);
      return element ?? null;
    }
    return null;
  }

  constructor(params: {name: string} | IDataElement) {
    this._nodeID = uuidv4(); // ⇨ '2c5ea4c0-4067-11e9-8bad-9b1deb4d3b7d'
    const {name} = params;
    this.name = new NamedString({
      name: 'name',
      value: name,
      parent: this
    });
    if (isDataElement(params)) {
      const element = params;
      this._nodeID = element.nodeID;
      if (params.mirrorTo) {
        assignMeta(this, {mirror: {to: params.mirrorTo}});
      }
    }
  }

  getPointsNodeIDs(): string[] {
    return this.getPoints().map((p) => p.nodeID);
  }

  abstract getPoints(): INamedVector3RO[];

  getMeasurablePoints(): INamedVector3RO[] {
    const points = this.getPoints();
    return [...points, this.centerOfGravity];
  }

  getVariables(): INamedNumberRO[] {
    const points = this.getMeasurablePoints();
    return points.map((p) => [p.x, p.y, p.z]).flat();
  }

  abstract getMirror(): IElement;

  unlinkMirror(): void {
    if (!isMirror(this)) return;
    if (this.parent && isMirror(this.parent)) {
      this.parent.unlinkMirror();
      return;
    }
    this.unlinkMirrorHelper();
  }

  private unlinkMirrorHelper(): void {
    if (this.meta?.mirror) {
      this.meta.mirror = undefined;
      if (isAssembly(this)) {
        this.children.forEach((child) => child.unlinkMirror());
      }
    }
  }

  abstract getDataElement(state: GDState): IDataElement | undefined;

  abstract arrange(parentPosition?: Vector3 | undefined): void;

  abstract get rotation(): NamedQuaternion;

  abstract set rotation(q: NamedQuaternion);

  abstract get className(): Elements;

  abstract get visible(): NamedBooleanOrUndefined;

  abstract set visible(b: NamedBooleanOrUndefined);

  abstract get mass(): NamedNumber;

  abstract set mass(m: NamedNumber);

  abstract get position(): NamedVector3LW;

  abstract set position(p: NamedVector3LW);

  abstract get initialPosition(): NamedVector3;

  abstract set initialPosition(p: NamedVector3);

  abstract get centerOfGravity(): NamedVector3;

  abstract set centerOfGravity(v: NamedVector3);

  abstract get inertialTensor(): NamedMatrix3;

  abstract set inertialTensor(mat: NamedMatrix3);

  getDataElementBase(
    state: GDState,
    mirrorElement: IElement | null
  ): IDataElement {
    if (!mirrorElement) {
      return {
        isDataElement: true,
        className: this.className,
        name: this.name.getData(state),
        nodeID: this.nodeID,
        absPath: this.absPath,

        inertialTensor: this.inertialTensor.getData(state),
        centerOfGravity: this.centerOfGravity.getData(state),
        mass: this.mass.getData(state),
        position: this.position.getData(state),
        rotation: this.rotation.getData(state),
        initialPosition: this.initialPosition.getData(state),
        visible: this.visible.getData()
        // mirrorTo: this.meta?.mirror?.to
      };
    }
    this.name.value = `mirror_${mirrorElement.name.value}`;
    return {
      isDataElement: true,
      className: this.className,
      name: this.name.getData(state),
      nodeID: this.nodeID,
      absPath: this.absPath,

      inertialTensor: mirrorMat(mirrorElement.inertialTensor).getData(state),
      centerOfGravity: this.centerOfGravity
        .setValue(mirrorVec(mirrorElement.centerOfGravity))
        .getData(state),
      mass: this.mass.setValue(mirrorElement.mass).getData(state),
      position: this.position.getData(state),
      rotation: this.rotation.getData(state),
      initialPosition: this.initialPosition
        .setValue(mirrorVec(mirrorElement.initialPosition))
        .getData(state),
      visible: this.visible.getData(),
      mirrorTo: mirrorElement.nodeID
    };
  }
}

export const mirrorVec = (
  vec: INamedVector3,
  inplace: boolean = false
): INamedVector3 => {
  const v = inplace ? vec : new NamedVector3({value: vec});
  v.meta.mirrorTo = vec.nodeID;
  v.meta.isFreeNode = vec.meta.isFreeNode;

  (v.y as NamedNumber).setValue(minus(v.y.getStringValue()));
  v.pointOffsetTools?.forEach((tool) => getMirrorPOT(tool));
  return v;
};

export const mirrorMat = (
  mat: INamedMatrix3,
  inplace: boolean = false
): INamedMatrix3 => {
  const m = inplace ? mat : new NamedMatrix3({value: mat});
  m.value.elements[1] *= -1;
  m.value.elements[4] *= -1;
  m.value.elements[7] *= -1;
  return m;
};

export const getMirrorPOT = (tool: IPointOffsetTool): void => {
  if (isDeltaXYZ(tool)) {
    tool.dy.setValue(minus(tool.dy.getStringValue()));
    return;
  }
  if (isDirectionLength(tool)) {
    tool.ny.setValue(minus(tool.ny.getStringValue()));
    return;
  }
  throw Error('Not Supported Exception');
};

export const syncPointsMirror = (
  mirTo: NamedVector3[],
  mirFrom: INamedVector3[],
  state: GDState
): IDataVector3[] => {
  const listP = mirTo.reduce(
    (obj, x) =>
      Object.assign(obj, {
        [x.meta.mirrorTo ?? 'なぜかミラー設定されていない']: x
      }),
    {} as {[name: string]: INamedVector3}
  );
  return mirFrom.map((v) => {
    if (Object.keys(listP).includes(v.nodeID)) {
      const mirrorV = mirrorVec(v);
      const tmp = listP[v.nodeID].setValue(mirrorV);
      tmp.meta = {...mirrorV.meta};
      return tmp.getData(state);
    }
    return mirrorVec(v).getData(state);
  });
};