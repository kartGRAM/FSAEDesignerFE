import {GDState} from '@store/reducers/dataGeometryDesigner';
import {DatumManager} from '@gd/measure/datum/DatumManager';
import {MeasureToolsManager} from '@gd/measure/measureTools/MeasureToolsManager';
import {ROVariablesManager} from '@gd/measure/readonlyVariables/ROVariablesManager';
import {getAssembly} from '@gd/Elements';
import {getControl} from '@gd/controls/Controls';
import {Control} from '@gd/controls/IControls';
import {ISolver} from '@gd/kinematics/ISolver';
import {IAssembly, isMovingElement} from '@gd/IElements';
import {ITest} from '@gd/analysis/ITest';
import {KinematicsSolver} from '@gd/kinematics/KinematicsSolver';
import {SkidpadSolver} from '@gd/kinematics/SkidpadSolver';

export type LocalInstances = {
  assembly: IAssembly;
  collectedAssembly: IAssembly;
  datumManager: DatumManager;
  measureToolsManager: MeasureToolsManager;
  roVariablesManager: ROVariablesManager;
  solver: ISolver;
};

export function getLocalInstances(state: GDState, test: ITest): LocalInstances {
  if (!state.topAssembly) throw new Error('No topAssembly');
  const assembly = getAssembly(state.topAssembly);
  const {assemblyMode, pinCenterOfGravityOfFrame} = state.options;
  const collectedAssembly = assembly.collectElements();
  const datumManager = new DatumManager(state.datumObjects, collectedAssembly);
  datumManager.update();
  const measureToolsManager = new MeasureToolsManager(
    datumManager,
    collectedAssembly.children.filter((e) => isMovingElement(e)) as any[],
    state.measureTools
  );
  measureToolsManager.update();
  const roVariablesManager = new ROVariablesManager({
    assembly,
    measureToolsManager,
    data: state.readonlyVariables
  });
  const childrenIDs = collectedAssembly.children.map((child) => child.nodeID);
  const controls = state.controls.reduce((prev, current) => {
    const config = current.configuration ?? 'FixedFrame';
    if (assemblyMode !== config) return prev;
    const control = getControl(current);
    current.targetElements
      .filter((element) => childrenIDs?.includes(element))
      .forEach((element) => {
        if (!prev[element]) prev[element] = [];
        prev[element].push(control);
      });
    return prev;
  }, {} as {[index: string]: Control[]});

  if (test.steadyStateDynamicsMode && !test.steadySkidpadParams)
    throw new Error('Skidpadの設定を行っていない');

  const solver: ISolver = !test.steadyStateDynamicsMode
    ? new KinematicsSolver(
        collectedAssembly,
        assemblyMode,
        pinCenterOfGravityOfFrame,
        pinCenterOfGravityOfFrame,
        controls,
        0.001,
        false
      )
    : new SkidpadSolver(
        collectedAssembly,
        test.steadySkidpadParams!,
        controls,
        0.001,
        1
      );
  return {
    assembly,
    collectedAssembly,
    datumManager,
    measureToolsManager,
    roVariablesManager,
    solver
  };
}
