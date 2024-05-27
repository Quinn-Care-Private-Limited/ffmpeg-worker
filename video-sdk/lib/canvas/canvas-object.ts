import { CanvasObjectAnimation, CanvasObjectType } from "./types";

export class CanvasObject {
  private properties: CanvasObjectType;
  private animations: CanvasObjectAnimation[] = [];
  private destroyAt: number | undefined = undefined;
  constructor(props: CanvasObjectType) {
    this.properties = props;
    return this;
  }

  animate(params: CanvasObjectAnimation) {
    this.animations.push(params);
    return this;
  }

  getAnimations() {
    return this.animations;
  }
  getDestroyAt() {
    return this.destroyAt;
  }
  getProperties() {
    return this.properties;
  }

  destroy(timestamp: number) {
    this.destroyAt = timestamp;
    return this;
  }
}
