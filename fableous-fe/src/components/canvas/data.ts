export interface Shape {
  x: number;
  y: number;
}

export interface TextShape extends Shape {
  text: string;
  fontSize: number;
}

export type TextShapeMap = { [id: number]: TextShape };
