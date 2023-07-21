import store from '@store/workerStore';
import {getDgd} from '@store/getDgd';
import {replaceState} from '@store/reducers/dataGeometryDesigner';
import {DatumManager} from '@gd/measure/DatumManager';
import {MeasureToolsManager} from '@gd/measure/MeasureToolsManager';
import {getAssembly} from '@gd/Elements';
import {getControl} from '@gd/controls/Controls';
import {Control} from '@gd/controls/IControls';
import {KinematicSolver} from '@gd/kinematics/Solver';
import {Test} from '@gd/analysis/Test';
import {ISnapshot} from '@gd/kinematics/ISnapshot';
import {FromParent, log} from './solverWorkerMessage';

// eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as any;

const throwError = (e: any) => {
  setTimeout(() => {
    throw e.stack;
  });
};

ctx.onmessage = async (e: MessageEvent<FromParent>) => {
  try {
    const message = e.data;
    await store.dispatch(replaceState(message.state));

    const state = getDgd();

    const dataTest = state.analysis.find(
      (test) => test.nodeID === message.testID
    );
    if (!dataTest) throw new Error('test is not found');

    if (!state.topAssembly) throw new Error('No topAssembly');
    const collectedAssembly = getAssembly(state.topAssembly).collectElements();
    const datumManager = new DatumManager(
      state.datumObjects,
      collectedAssembly
    );
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
    const solver = new KinematicSolver(collectedAssembly, controls, false);
    if (message.initialSnapshot) {
      solver.restoreState(message.initialSnapshot);
    } else {
      solver.solve({
        constraintsOptions: {onAssemble: true},
        postProcess: true,
        logOutput: true
      });
    }

    log(`worker start...target task is ${message.testID}.`);
    log(`action from ${message.nodeFrom ?? 'start'}.`);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const test = new Test(dataTest);
    const getSnapshot = (solver: KinematicSolver): Required<ISnapshot> => {
      solver.postProcess();
      datumManager.update();
      measureToolsManager.update();
      return {
        ...solver.getSnapshot(),
        measureTools: measureToolsManager.getValuesAll(),
        globals: {...getDgd().formulae}
      };
    };

    const results = await test.DFSNodes(
      test.nodes[message.nodeFrom],
      solver,
      getSnapshot,
      {
        isCaseResults: true,
        caseResults: {}
      },

      undefined
    );

    ctx.postMessage(results);
  } catch (e) {
    throwError(e);
  }
};
