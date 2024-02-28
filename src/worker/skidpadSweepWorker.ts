import store from '@store/workerStore';
import {getDgd} from '@store/getDgd';
import {replaceState} from '@store/reducers/dataGeometryDesigner';
import {ISolver} from '@gd/kinematics/ISolver';
import {Test} from '@gd/analysis/Test';
import {ISnapshot} from '@gd/analysis/ISnapshot';
import {isSkidpadSolver} from '@gd/kinematics/SkidpadSolver';
import {ParameterSetter} from '@gd/analysis/ParameterSetter';
import {
  FromParentSweepWorker,
  log,
  throwError,
  SweepResults
} from './solverWorkerMessage';
import {getLocalInstances} from './getLocalInstances';

// eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as any;

ctx.onmessage = async (e: MessageEvent<FromParentSweepWorker>) => {
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
    if (!isSkidpadSolver(solver)) return;

    const setters = message.setters.map((s) => new ParameterSetter(s));

    if (message.initialSnapshot) {
      solver.restoreState(message.initialSnapshot);
    }
    setters.forEach((s) => s.set(solver));

    log(`worker start...`);

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
        globals: [...state.formulae]
      };
    };

    const results: SweepResults = {
      isSweepResults: true,
      step: message.step,
      results: solver.solveMaxV({maxCount: 100, getSnapshot})
    };

    ctx.postMessage(results);
  } catch (e) {
    throwError(e);
  }
};
