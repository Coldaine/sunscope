declare module 'suncalc' {
  export interface SunPosition {
    altitude: number;
    azimuth: number;
  }
  
  export interface SunTimes {
    sunrise: Date;
    sunriseEnd: Date;
    sunset: Date;
    sunsetStart: Date;
    solarNoon: Date;
    nadir: Date;
    dawn: Date;
    dusk: Date;
    nauticalDawn: Date;
    nauticalDusk: Date;
    nightEnd: Date;
    night: Date;
    goldenHourEnd: Date;
    goldenHour: Date;
  }
  
  export function getPosition(date: Date, lat: number, lng: number): SunPosition;
  export function getTimes(date: Date, lat: number, lng: number): SunTimes;
}
