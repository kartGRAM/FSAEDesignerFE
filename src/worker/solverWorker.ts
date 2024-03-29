import store from '@store/workerStore';
import {getDgd} from '@store/getDgd';
import {replaceState} from '@store/reducers/dataGeometryDesigner';
import {ISolver} from '@gd/kinematics/ISolver';
import {Test} from '@gd/analysis/Test';
import {ISnapshot} from '@gd/analysis/ISnapshot';
import {FromParent, log, throwError} from './solverWorkerMessage';
import {getLocalInstances} from './getLocalInstances';

// eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as any;

ctx.onmessage = async (e: MessageEvent<FromParent>) => {
  try {
    const message = e.data;
    await store.dispatch(replaceState(message.state));

    const state = getDgd();

    const dataTest = state.analysis.find(
      (test) => test.nodeID === message.testID
    );
    if (!dataTest) throw new Error('test is not found');
    const test = new Test(dataTest);
    const {datumManager, measureToolsManager, roVariablesManager, solver} =
      getLocalInstances(state, test);

    if (message.initialSnapshot) {
      solver.restoreState(message.initialSnapshot);
    } else {
      solver.solve({
        constraintsOptions: {disableSpringElasticity: true},
        postProcess: true,
        logOutput: true
      });
    }

    log(`worker start...target task is ${message.testID}.`);
    log(`action from ${message.nodeFrom ?? 'start'}.`);

    const getSnapshot = (solver: ISolver): Required<ISnapshot> => {
      solver.postProcess();
      datumManager.update();
      measureToolsManager.update();
      roVariablesManager.update();
      const state = getDgd();
      // const assemblyData = assembly.getDataElement(state);
      // if (!assemblyData) throw new Error('assembly Dataが得られない');
      return {
        solverState: {},
        ...solver.getSnapshot(),
        /* assemblyData, */
        measureTools: measureToolsManager.getValuesAll(),
        readonlyVariables: roVariablesManager.getValuesAll(),
        globals: [...state.formulae],
        globalsUpdateID: state.lastGlobalFormulaUpdate
      };
    };

    const results = await test.solver.DFSNodes(
      test.nodes[message.nodeFrom],
      solver,
      getSnapshot,
      {
        isCaseResults: true,
        cases: {}
      },
      undefined
    );

    ctx.postMessage(results);
  } catch (e) {
    throwError(e);
  }
};
