import {BufferGeometry, Material, Object3D, Scene} from 'three';

type DisposableObject = BufferGeometry | Material;
const isDisposableObject = (item: any): item is DisposableObject =>
  'dispose' in item;

const resourceType = ['Assembly', 'Helpers'] as const;
export type ResourceType = typeof resourceType[number];

type DictDisposableObjects = {
  [index: string]: Set<DisposableObject>;
};

type DictThreeObjects = {
  [index: string]: Set<Object3D>;
};

class ResourceTracker {
  private resources: DictDisposableObjects;

  private threeObjects: DictThreeObjects;

  constructor() {
    this.resources = {};
    this.threeObjects = {};
    resourceType.forEach((index) => {
      this.resources[index] = new Set<DisposableObject>();
    });
    resourceType.forEach((index) => {
      this.threeObjects[index] = new Set<Object3D>();
    });
  }

  track<T>(resource: T, index: ResourceType): T {
    if (resource instanceof Object3D) {
      this.threeObjects[index].add(resource);
      return resource;
    }
    if (isDisposableObject(resource)) {
      this.resources[index].add(resource);
      return resource;
    }
    throw new Error('Disposable object or Object3D Only');
  }

  untrack(resource: DisposableObject | Object3D, index: ResourceType) {
    if (isDisposableObject(resource)) this.resources[index].delete(resource);
    else this.threeObjects[index].delete(resource);
  }

  dispose(index: ResourceType, scene: Scene) {
    this.threeObjects[index].forEach((resource) => scene.remove(resource));

    if (getRandomInt(50) === 0) {
      this.resources[index].forEach((resource: DisposableObject) =>
        resource.dispose()
      );
      this.resources[index].clear();
    }
  }

  disposeAll(scene: Scene) {
    Object.keys(this.resources).forEach((index) =>
      this.dispose(index as ResourceType, scene)
    );
  }
}
const resTracker = new ResourceTracker();
const track = resTracker.track.bind(resTracker);
export const dispose = resTracker.dispose.bind(resTracker);
export const disposeAll = resTracker.disposeAll.bind(resTracker);
export const untrack = resTracker.untrack.bind(resTracker);

export default track;

function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}
