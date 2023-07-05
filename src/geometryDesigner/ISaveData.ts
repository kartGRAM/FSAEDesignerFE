import {IDataAssembly} from '@app/geometryDesigner/IElements';
import {IDataControl} from '@gd/controls/IControls';
import {IDataDatumGroup} from '@gd/measure/IDatumObjects';
import {IDataMeasureTool} from '@gd/measure/IMeasureTools';
import {IDataTest} from '@gd/analysis/ITest';
import {IDataFormula} from '@gd/IFormula';
import {getScreenShot} from '@gdComponents/GDScene';
import {RootState} from '@store/store';

export interface SavedData {
  id: number;
  filename: string;
  thumbnail?: string;
  note: string;
  lastUpdated: string;
  created?: string;
  topAssembly: IDataAssembly | undefined;
  formulae: IDataFormula[];
  controls: IDataControl[];
  datumObjects: IDataDatumGroup[];
  measureTools: IDataMeasureTool[];
  analysis: IDataTest[];
  // テスト以外に変更がくわえられた場合、このuuidが変わる。
  idWoTest?: string;
}

export function getSetTopAssemblyParams(data: any): SavedData {
  return {
    id: data.id as number,
    idWoTest: data.idWoTest as string,
    filename: data.name as string,
    note: data.note as string,
    lastUpdated: data.lastUpdated as string,
    topAssembly: convertJsonToDataAssembly(data.content as string),
    formulae: convertJsonToDataFormula(data.formulae as string),
    controls: convertJsonToControls(data.controls as string),
    datumObjects: convertJsonToDatumObjects(data.datumObjects as string),
    measureTools: convertJsonToMeasureTools(data.measureTools as string),
    analysis: convertJsonToAnalysis(data.analysis as string)
  };
}

export interface SaveDataToSend {
  id: number;
  name: string;
  overwrite: boolean;
  clientLastUpdated: string;
  note: string;
  content: string;
  formulae: string;
  controls: string;
  datumObjects: string;
  measureTools: string;
  analysis: string;
}

export function getDataToSave(
  rootState: RootState,
  filename: string,
  note: string,
  overwrite: boolean = false
): FormData {
  const state = rootState.dgd.present;

  let {topAssembly} = state;
  if (rootState.uitgd.assembly) {
    topAssembly = rootState.uitgd.assembly.getDataElement(state);
  }

  const data = new FormData();
  const values: SaveDataToSend = {
    id: state.id,
    name: filename,
    note,
    content: JSON.stringify(topAssembly),
    formulae: JSON.stringify(state.formulae),
    controls: JSON.stringify(state.controls),
    datumObjects: JSON.stringify(state.datumObjects),
    measureTools: JSON.stringify(state.measureTools),
    analysis: JSON.stringify(state.analysis),
    clientLastUpdated: state.lastUpdated,
    overwrite
  };
  Object.keys(values).forEach((key) => {
    data.append(key, (values as any)[key]);
  });
  data.append('thumbnail', getScreenShot() ?? '', 'image.png');
  return data;
}

export function getListSetTopAssemblyParams(listedData: any): SavedData[] {
  const ret = listedData.map(
    (data: any): SavedData => ({
      created: data.created as string,
      thumbnail: data.thumbnail ? (data.thumbnail as string) : undefined,
      ...getSetTopAssemblyParams(data)
    })
  );
  return ret;
}

function convertJsonToDataAssembly(content: string): IDataAssembly | undefined {
  try {
    const data = JSON.parse(content) as IDataAssembly;
    return data;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    return undefined;
  }
}

function convertJsonToDataFormula(content: string): IDataFormula[] {
  try {
    const data = JSON.parse(content) as IDataFormula[];
    return data;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    return [];
  }
}

function convertJsonToControls(content: string): IDataControl[] {
  try {
    const data = JSON.parse(content) as IDataControl[];
    return data;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    return [];
  }
}

function convertJsonToDatumObjects(content: string): IDataDatumGroup[] {
  try {
    const data = JSON.parse(content) as IDataDatumGroup[];
    return data;
  } catch (err) {
    // eslint-disable-next-line no-console
    // console.log(err);
    return [];
  }
}

function convertJsonToMeasureTools(content: string): IDataMeasureTool[] {
  try {
    const data = JSON.parse(content) as IDataMeasureTool[];
    return data;
  } catch (err) {
    // eslint-disable-next-line no-console
    // console.log(err);
    return [];
  }
}

function convertJsonToAnalysis(content: string): IDataTest[] {
  try {
    const data = JSON.parse(content) as IDataTest[];
    return data;
  } catch (err) {
    // eslint-disable-next-line no-console
    // console.log(err);
    return [];
  }
}
