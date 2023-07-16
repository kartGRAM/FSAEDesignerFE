import store from '@store/workerStore';
import {getDgd} from '@store/getDgd';
import {replaceState} from '@store/reducers/dataGeometryDesigner';
import {DatumManager} from '@gd/measure/DatumManager';
import {MeasureToolsManager} from '@gd/measure/MeasureToolsManager';
import {getAssembly} from '@gd/Elements';
import {getControl} from '@gd/controls/Controls';
import {Control} from '@gd/controls/IControls';
import {KinematicSolver} from '@gd/kinematics/Solver';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {Test} from '@gd/analysis/Test';
import {FromParent, log} from './solverWorkerMessage';

// eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as any;

ctx.onmessage = async (e: MessageEvent<FromParent>) => {
  const message = e.data;
  await store.dispatch(replaceState(message.state));

  const state = getDgd();

  const dataTest = state.analysis.find(
    (test) => test.nodeID === message.testID
  );
  if (!dataTest) throw new Error('test is not found');

  if (!state.topAssembly) throw new Error('No topAssembly');
  const collectedAssembly = getAssembly(state.topAssembly).collectElements();
  const datumManager = new DatumManager(state.datumObjects, collectedAssembly);
  datumManager.update();
  const measureToolsManager = new MeasureToolsManager(
    datumManager,
    state.measureTools
  );
  measureToolsManager.update();
  const childrenIDs = collectedAssembly.children.map((child) => child.nodeID);
  const controls = state.controls.reduce((prev, current) => {
    const control = getControl(current);
    current.targetElements
      .filter((element) => childrenIDs?.includes(element))
      .forEach((element) => {
        if (!prev[element]) prev[element] = [];
        prev[element].push(control);
      });
    return prev;
  }, {} as {[index: string]: Control[]});
  const solver = new KinematicSolver(collectedAssembly, controls);
  if (message.initialSnapshot) {
    solver.restoreState(message.initialSnapshot);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // const test = new Test(dataTest);

  log(`worker start...target task is ${message.testID}.`);
  log(`action from ${message.nodeFrom ?? 'start'}.`);
};
