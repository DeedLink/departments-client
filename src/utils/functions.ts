import type { AnalaticsType } from "../types/analatics";

export const compressAddress = (address : string) => {
  return `${address.slice(0, 6)}`+'...'+`${address.slice(-4)}`
}

export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const nicRegex = /^(?:\d{9}[VvXx]|\d{12})$/;

export const isValidPassword = (password: string) => {
  return passwordRegex.test(password);
};

export const isValidEmail = (email: string) => {
  return emailRegex.test(email);
};

export const isValidNIC = (nic: string) => {
  return nicRegex.test(nic);
};

export const calculatePolygonArea = (coordinates: [number, number][]): number => {
  if (coordinates.length < 3) return 0;
  
  let area = 0;
  const n = coordinates.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coordinates[i][0] * coordinates[j][1];
    area -= coordinates[j][0] * coordinates[i][1];
  }
  
  return Math.abs(area) / 2 * 111320 * 111320;
};

export const calculateAnalatics = (data:any[]) =>{
  console.log(data);
  const analatics: AnalaticsType = {
    totalDeeds: data?.length ?? 0,
    signedDeeds: 0,
    rejectedDeeds: 0,
    pendingDeeds: 0,
    monthlyGrowth: 0,
    completionRate: 0,
    avgProcessingTime: 0
  }
  return analatics;
}

// Overlap detection utilities
export interface LocationPoint {
  longitude: number;
  latitude: number;
}

export interface OverlapResult {
  deed1: string;
  deed2: string;
  overlapType: 'polygon' | 'boundary' | 'both';
  overlapPercentage?: number;
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
export const isPointInPolygon = (
  point: LocationPoint,
  polygon: LocationPoint[]
): boolean => {
  if (polygon.length < 3) return false;

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;

    const intersect =
      yi > point.latitude !== yj > point.latitude &&
      point.longitude < ((xj - xi) * (point.latitude - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
};

/**
 * Check if two line segments intersect
 */
const doLineSegmentsIntersect = (
  p1: LocationPoint,
  p2: LocationPoint,
  p3: LocationPoint,
  p4: LocationPoint
): boolean => {
  const ccw = (A: LocationPoint, B: LocationPoint, C: LocationPoint): number => {
    return (C.latitude - A.latitude) * (B.longitude - A.longitude) - 
           (B.latitude - A.latitude) * (C.longitude - A.longitude);
  };

  return (
    ccw(p1, p3, p4) !== ccw(p2, p3, p4) &&
    ccw(p1, p2, p3) !== ccw(p1, p2, p4)
  );
};

/**
 * Check if two polygons overlap by checking:
 * 1. If any vertex of polygon1 is inside polygon2
 * 2. If any vertex of polygon2 is inside polygon1
 * 3. If any edges intersect
 */
export const doPolygonsOverlap = (
  polygon1: LocationPoint[],
  polygon2: LocationPoint[]
): boolean => {
  if (polygon1.length < 3 || polygon2.length < 3) return false;

  // Check if any vertex of polygon1 is inside polygon2
  for (const point of polygon1) {
    if (isPointInPolygon(point, polygon2)) {
      return true;
    }
  }

  // Check if any vertex of polygon2 is inside polygon1
  for (const point of polygon2) {
    if (isPointInPolygon(point, polygon1)) {
      return true;
    }
  }

  // Check if any edges intersect
  for (let i = 0; i < polygon1.length; i++) {
    const p1 = polygon1[i];
    const p2 = polygon1[(i + 1) % polygon1.length];

    for (let j = 0; j < polygon2.length; j++) {
      const p3 = polygon2[j];
      const p4 = polygon2[(j + 1) % polygon2.length];

      if (doLineSegmentsIntersect(p1, p2, p3, p4)) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Calculate the approximate overlap percentage between two polygons
 */
export const calculateOverlapPercentage = (
  polygon1: LocationPoint[],
  polygon2: LocationPoint[]
): number => {
  if (!doPolygonsOverlap(polygon1, polygon2)) return 0;

  // Count points from polygon1 inside polygon2
  let pointsInside1 = 0;
  for (const point of polygon1) {
    if (isPointInPolygon(point, polygon2)) {
      pointsInside1++;
    }
  }

  // Count points from polygon2 inside polygon1
  let pointsInside2 = 0;
  for (const point of polygon2) {
    if (isPointInPolygon(point, polygon1)) {
      pointsInside2++;
    }
  }

  // Calculate overlap as average of both percentages
  const overlap1 = (pointsInside1 / polygon1.length) * 100;
  const overlap2 = (pointsInside2 / polygon2.length) * 100;

  return (overlap1 + overlap2) / 2;
};

/**
 * Check if boundaries (sides) overlap by comparing side references
 */
export const doBoundariesOverlap = (
  sides1?: { North?: string; South?: string; East?: string; West?: string },
  sides2?: { North?: string; South?: string; East?: string; West?: string }
): boolean => {
  if (!sides1 || !sides2) return false;

  const sides1Values = [sides1.North, sides1.South, sides1.East, sides1.West].filter(Boolean);
  const sides2Values = [sides2.North, sides2.South, sides2.East, sides2.West].filter(Boolean);

  // Check if any boundary references match
  for (const side1 of sides1Values) {
    for (const side2 of sides2Values) {
      if (side1 === side2 && side1) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Detect all overlapping deeds
 */
export const detectOverlappingDeeds = (
  deeds: Array<{
    deedNumber: string;
    location: LocationPoint[];
    sides?: { North?: string; South?: string; East?: string; West?: string };
    surveyPlanNumber?: string;
  }>,
  plansMap: Map<string, { coordinates: LocationPoint[]; sides?: { North?: string; South?: string; East?: string; West?: string } }> | Record<string, { coordinates: LocationPoint[]; sides?: { North?: string; South?: string; East?: string; West?: string } }>
): OverlapResult[] => {
  const overlaps: OverlapResult[] = [];

  for (let i = 0; i < deeds.length; i++) {
    for (let j = i + 1; j < deeds.length; j++) {
      const deed1 = deeds[i];
      const deed2 = deeds[j];

      // Get plan data for both deeds
      const plan1 = deed1.surveyPlanNumber ? (plansMap instanceof Map ? plansMap.get(deed1.surveyPlanNumber) : plansMap[deed1.surveyPlanNumber]) : null;
      const plan2 = deed2.surveyPlanNumber ? (plansMap instanceof Map ? plansMap.get(deed2.surveyPlanNumber) : plansMap[deed2.surveyPlanNumber]) : null;

      // Use plan coordinates if available, otherwise use deed location
      const coords1 = plan1?.coordinates || deed1.location;
      const coords2 = plan2?.coordinates || deed2.location;

      // Check polygon overlap
      const polygonOverlap = doPolygonsOverlap(coords1, coords2);

      // Check boundary overlap
      const sides1 = plan1?.sides || deed1.sides;
      const sides2 = plan2?.sides || deed2.sides;
      const boundaryOverlap = doBoundariesOverlap(sides1, sides2);

      if (polygonOverlap || boundaryOverlap) {
        const overlapType: 'polygon' | 'boundary' | 'both' = 
          polygonOverlap && boundaryOverlap ? 'both' :
          polygonOverlap ? 'polygon' : 'boundary';

        const overlapPercentage = polygonOverlap 
          ? calculateOverlapPercentage(coords1, coords2)
          : undefined;

        overlaps.push({
          deed1: deed1.deedNumber,
          deed2: deed2.deedNumber,
          overlapType,
          overlapPercentage,
        });
      }
    }
  }

  return overlaps;
};