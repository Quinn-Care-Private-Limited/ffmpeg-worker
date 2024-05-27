export type CanvasProperties = {
  height: number;
  width: number;
  duration: number;
};

export type CanvasRectangle = {
  fill?: string;
  borderWidth?: number;
  borderColor?: string;
  height: number;
  width: number;
  type: "rectangle";
};

export type CanvasCircle = {
  fill?: string;
  borderWidth?: number;
  radius: number;
  borderColor?: string;
  type: "circle";
};
export type CanvasText = {
  text: string;
  fontSize: number;
  fill?: string;
  fontWeight?: "bold" | "normal";
  type: "text";
};

export type CanvasObjectPosition = {
  x: number;
  y: number;
};

export type CanvasObjectType = {
  zIndex?: number;
  type: "rectangle" | "circle" | "text";
  position: CanvasObjectPosition;
  opacity?: number;
  timestamp: number;
} & (CanvasRectangle | CanvasCircle | CanvasText);
export type MoveAnimation = {
  type: "move";
  moveToX?: number;
  moveToY?: number;
};

export type FadeAnimation = {
  type: "fade";
  startOpacity?: number;
  endOpacity?: number;
};

export type SpinAnimation = {
  type: "spin";
  speed: number;
};
export type ScaleAnimation = {
  type: "scale";
  startScale?: number;
  endScale?: number;
};

export type RotateAnimation = {
  type: "rotate";
  startAngle?: number;
  endAngle?: number;
};

export type CanvasObjectAnimation = {
  type: "move" | "fade" | "spin" | "scale" | "rotate";
  startAt: number;
  endAt: number;
} & (MoveAnimation | FadeAnimation | SpinAnimation | ScaleAnimation | RotateAnimation);

export type CanvasType = {
  properties: CanvasProperties;
  objects: Array<{
    properties: CanvasObjectType;
    animations: CanvasObjectAnimation[];
  }>;
  id: string;
};
