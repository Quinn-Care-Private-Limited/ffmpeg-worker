import { LamarUtils } from "../util";
import { CanvasObject } from "./canvas-object";
import { CanvasObjectProperties, CanvasProperties } from "./types";

export default class Canvas {
  private properties: CanvasProperties;
  private objects: CanvasObject[] = [];
  private id: string;
  constructor({ height, width }: CanvasProperties) {
    this.properties = { height, width };
    this.id = LamarUtils.generateRandomId(4);
  }

  addObject(object: CanvasObjectProperties) {
    const ob = new CanvasObject(object);
    this.objects.push(ob);
    return ob;
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
