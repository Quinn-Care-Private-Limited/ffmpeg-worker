import { CanvasObjectProperties, CanvasObjectAnimation } from "./types";

export class CanvasObject {
  private properties: CanvasObjectProperties;
  private animations: CanvasObjectAnimation[] = [];
  constructor(props: CanvasObjectProperties) {
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
