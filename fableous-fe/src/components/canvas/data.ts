export interface Shape {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface TextShape extends Shape {
  text: string;
  fontSize: number;
}

export type TextShapeMap = { [id: number]: TextShape };
