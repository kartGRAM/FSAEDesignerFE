import {BufferGeometry, Material} from 'three';

type DisposableObject = BufferGeometry | Material;
const isDisposableObject = (item: any): item is DisposableObject =>
  'dispose' in item;

type hasDispose = {
  dispose(): void;
};

class ResourceTracker {
  private resources: Set<DisposableObject>;

  constructor() {
    this.resources = new Set<DisposableObject>();
  }

  track<T extends hasDispose>(resource: T): T {
    if (isDisposableObject(resource)) this.resources.add(resource);
    return resource;
  }

  untrack(resource: DisposableObject) {
    this.resources.delete(resource);
  }

  dispose() {
    this.resources.forEach((resource: DisposableObject) => resource.dispose());
    this.resources.clear();
  }
}
const resTracker = new ResourceTracker();
const track = resTracker.track.bind(resTracker);
export const DisposeAll = resTracker.dispose.bind(resTracker);
export const untrack = resTracker.untrack.bind(resTracker);

export default track;
