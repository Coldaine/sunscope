export interface ArcPoint3D {
  x: number;
  y: number;
  z: number;
  azimuth: number;
  altitude: number;
  phase: string;
  date: Date;
  blocked?: boolean;
}
