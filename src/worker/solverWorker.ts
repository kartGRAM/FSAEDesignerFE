import store from '@store/workerStore';
import {getDgd} from '@store/getDgd';
import {replaceState} from '@store/reducers/dataGeometryDesigner';
import {KinematicSolver} from '@gd/kinematics/Solver';
import {Test} from '@gd/analysis/Test';
import {ISnapshot} from '@gd/kinematics/ISnapshot';
import {FromParent, log} from './solverWorkerMessage';
import {getLocalInstances} from './getLocalInstances';

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
    const {datumManager, measureToolsManager, solver} =
      getLocalInstances(state);

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
      const state = getDgd();
      // const assemblyData = assembly.getDataElement(state);
      // if (!assemblyData) throw new Error('assembly Dataが得られない');
      return {
        ...solver.getSnapshot(),
        /* assemblyData, */
        measureTools: measureToolsManager.getValuesAll(),
        globals: {...state.formulae}
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
