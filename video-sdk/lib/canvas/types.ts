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

type CanvasObjectPosition = {
  x: number;
  y: number;
};

export type CanvasObjectProperties = {
  zIndex?: number;
  type: "rectangle" | "circle" | "text";
  position: CanvasObjectPosition;
  opacity?: number;
} & (CanvasRectangle | CanvasCircle | CanvasText);

type MoveAnimation = {
  type: "move";
  duration: number;
  moveToX?: number;
  moveToY?: number;
};

type FadeAnimation = {
  type: "fade";
  startOpacity?: number;
  endOpacity?: number;
};

type SpinAnimation = {
  type: "spin";
};

type ScaleAnimation = {
  type: "scale";
  startScale?: number;
  endScale?: number;
};

type RotateAnimation = {
  type: "rotate";
  startAngle?: number;
  endAngle?: number;
};

export type CanvasObjectAnimation = {
  type: "move" | "fade" | "spin" | "scale" | "rotate";
  delay: number;
  duration: number;
} & (MoveAnimation | FadeAnimation | SpinAnimation | ScaleAnimation | RotateAnimation);
