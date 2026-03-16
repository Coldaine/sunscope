export enum ObstructionType {
  Sky = 'Sky',
  Tree = 'Tree',
  Building = 'Building',
  Roof = 'Roof',
  Fence = 'Fence',
  Unknown = 'Unknown'
}

export interface SkyMaskCell {
  classification: ObstructionType;
  confidence: number;
  lastUpdated: Date | null;
}

export type SkyMask = SkyMaskCell[][];

export function createEmptySkyMask(): SkyMask {
  const mask: SkyMask = [];
  for (let az = 0; az < 180; az++) {
    const col: SkyMaskCell[] = [];
    for (let el = 0; el < 45; el++) {
      col.push({
        classification: ObstructionType.Unknown,
        confidence: 0,
        lastUpdated: null
      });
    }
    mask.push(col);
  }
  return mask;
}

export function getSkyMaskCell(mask: SkyMask, azimuthDeg: number, elevationDeg: number): SkyMaskCell {
  // Normalize azimuth to 0-359
  let normalizedAzimuth = ((azimuthDeg % 360) + 360) % 360;
  
  // Clamp elevation to 0-90
  let clampedElevation = Math.max(0, Math.min(90, elevationDeg));
  
  const azBucket = Math.floor(normalizedAzimuth / 2) % 180;
  const elBucket = Math.floor(clampedElevation / 2);
  
  // Handle boundary case exactly at 90
  const finalElBucket = Math.min(44, elBucket);

  return mask[azBucket][finalElBucket];
}

export function setSkyMaskCell(
  mask: SkyMask,
  azimuthDeg: number,
  elevationDeg: number,
  classification: ObstructionType,
  confidence: number
): SkyMask {
  // Normalize azimuth to 0-359
  let normalizedAzimuth = ((azimuthDeg % 360) + 360) % 360;
  
  // Clamp elevation to 0-90
  let clampedElevation = Math.max(0, Math.min(90, elevationDeg));
  
  const azBucket = Math.floor(normalizedAzimuth / 2) % 180;
  const elBucket = Math.floor(clampedElevation / 2);
  
  // Handle boundary case exactly at 90
  const finalElBucket = Math.min(44, elBucket);

  // Deep clone mask to be immutable
  const newMask: SkyMask = mask.map(col => col.map(cell => ({ ...cell })));
  
  newMask[azBucket][finalElBucket] = {
    classification,
    confidence,
    lastUpdated: new Date() // Would normally use UTC / injected date
  };

  return newMask;
}
