import { CanvasObjectAnimation, CanvasObjectType } from "./types";

export class CanvasObject {
  private properties: CanvasObjectType;
  private animations: CanvasObjectAnimation[] = [];
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
}
