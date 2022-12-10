import {IMeasureTool} from '@gd/measure/IMeasureTools';

export class MeasureToolsManager {
  children: IMeasureTool[];

  constructor(tools: IMeasureTool[]) {
    this.children = tools;
  }

  getMeasureTool(nodeID: string): IMeasureTool | undefined {
    for (const child of this.children) {
      if (child.nodeID === nodeID) return child;
    }
    return undefined;
  }

  update(): void {
    this.children.forEach((child) => child.update());
  }
}
