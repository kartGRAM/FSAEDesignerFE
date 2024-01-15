import {GDState} from '@store/reducers/dataGeometryDesigner';
import {DatumManager} from '@gd/measure/datum/DatumManager';
import {MeasureToolsManager} from '@gd/measure/measureTools/MeasureToolsManager';
import {ROVariablesManager} from '@gd/measure/readonlyVariables/ROVariablesManager';
import {getAssembly} from '@gd/Elements';
import {getControl} from '@gd/controls/Controls';
import {Control} from '@gd/controls/IControls';
import {KinematicSolver} from '@gd/kinematics/Solver';
import {IAssembly, isMovingElement} from '@gd/IElements';

export type LocalInstances = {
  assembly: IAssembly;
  datumManager: DatumManager;
  measureToolsManager: MeasureToolsManager;
  roVariablesManager: ROVariablesManager;
  solver: KinematicSolver;
};

export function getLocalInstances(state: GDState): LocalInstances {
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
  const solver = new KinematicSolver(
    collectedAssembly,
    assemblyMode,
    pinCenterOfGravityOfFrame,
    pinCenterOfGravityOfFrame,
    controls,
    false
  );
  return {
    assembly,
    datumManager,
    measureToolsManager,
    roVariablesManager,
    solver
  };
}
