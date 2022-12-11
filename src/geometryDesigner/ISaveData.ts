import {IDataAssembly} from '@app/geometryDesigner/IElements';
import {IControl} from '@gd/IControls';
import {IDataDatumGroup} from '@gd/measure/IDatumObjects';
import {IDataMeasureTool} from '@gd/measure/IMeasureTools';
import {IDataFormula} from '@gd/IFormula';

export interface SavedData {
  id: number;
  filename: string;
  thumbnail?: string;
  note: string;
  lastUpdated: string;
  created?: string;
  topAssembly: IDataAssembly | undefined;
  formulae: IDataFormula[];
  controls: IControl[];
  datumObjects: IDataDatumGroup[];
  measureTools: IDataMeasureTool[];
}

export interface SavedDataToSend {
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
}

export function getSetTopAssemblyParams(data: any): SavedData {
  return {
    id: data.id as number,
    filename: data.name as string,
    note: data.note as string,
    lastUpdated: data.lastUpdated as string,
    topAssembly: convertJsonToDataAssembly(data.content as string),
    formulae: convertJsonToDataFormula(data.formulae as string),
    controls: convertJsonToControls(data.controls as string),
    datumObjects: convertJsonToDatumObjects(data.datumObjects as string),
    measureTools: convertJsonToMeasureTools(data.measureTools as string)
  };
}

export function getListSetTopAssemblyParams(listedData: any): SavedData[] {
  const ret = listedData.map(
    (data: any): SavedData => ({
      id: data.id as number,
      filename: data.name as string,
      note: data.note as string,
      lastUpdated: data.lastUpdated as string,
      created: data.created as string,
      thumbnail: data.thumbnail ? (data.thumbnail as string) : undefined,
      topAssembly: convertJsonToDataAssembly(data.content as string),
      formulae: convertJsonToDataFormula(data.formulae as string),
      controls: convertJsonToControls(data.controls as string),
      datumObjects: convertJsonToDatumObjects(data.datumObjects as string),
      measureTools: convertJsonToMeasureTools(data.measureTools as string)
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

function convertJsonToControls(content: string): IControl[] {
  try {
    const data = JSON.parse(content) as IControl[];
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
