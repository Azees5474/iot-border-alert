export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface GeofenceCheckResult {
  inside: boolean;
  distance: number;
}

export function checkGeofence(
  lat: number,
  lon: number,
  centerLat: number,
  centerLon: number,
  radius: number,
): GeofenceCheckResult {
  const distance = haversineDistance(lat, lon, centerLat, centerLon);
  const inside = distance <= radius;
  return { inside, distance: Math.round(distance) };
}

export function headingToOffset(distance: number, heading: number) {
  const R = 6371000;
  const angular = distance / R;
  const latRad = angular * Math.cos((heading * Math.PI) / 180);
  const lonRad = angular * Math.sin((heading * Math.PI) / 180);
  return {
    lat: (latRad * 180) / Math.PI,
    lon: (lonRad * 180) / Math.PI,
  };
}
