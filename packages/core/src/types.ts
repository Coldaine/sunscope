export interface SunSample {
  date: Date;
  azimuth: number; // in degrees
  altitude: number; // in degrees
  phase: string;
}

export interface SunHoursResult {
  totalHours: number;
  segments: ArcSegment[];
  maskIncomplete?: boolean; // Added based on context
}

export interface ArcSegment {
  startTime: Date;
  endTime: Date;
  blocked: boolean;
  obstruction: string | null;
}