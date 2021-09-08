export interface Shape {
  normX: number;
  normY: number;
}

export interface TextShape extends Shape {
  text: string;
  normFontSize: number;
}

export type TextShapeMap = { [id: number]: TextShape };
