import { LamarUtils } from "../util";
import { CanvasObject } from "./canvas-object";
import { CanvasProperties } from "./types";

export default class Canvas {
  private properties: CanvasProperties;
  private objects: CanvasObject[] = [];
  private id: string;
  constructor(props: CanvasProperties) {
    this.properties = props;
    this.id = LamarUtils.generateRandomId(4);
  }

  addObject(object: CanvasObject) {
    this.objects.push(object);
    return this;
  }
  getObjects() {
    return this.objects;
  }
  getProperties() {
    return this.properties;
  }
  getId() {
    return this.id;
  }
}
