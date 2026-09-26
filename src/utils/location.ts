import { PatientLocation, PatientProfile } from '../types';
import { PATIENT_LOCATIONS } from './mockData';

// A patient profile plus the locations the family has saved for them.
export type PatientWithLocations = PatientProfile & { savedLocations?: PatientLocation[] };

// Used for new accounts until the family adds a real address.
export const EMPTY_LOCATION: PatientLocation = {
  label: 'No address added yet',
  address: '',
  coordinates: { lat: 0, lng: 0 },
  nearestPSAP: '',
  dispatchPreference: 'caregiver_guided',
};

export const hasAddress = (loc?: PatientLocation | null): boolean =>
  !!loc && !!loc.address && loc.address.trim().length > 0;

// True when a location is one of the built-in demo addresses (e.g. 742 Evergreen Terrace).
export const isDemoLocation = (loc?: PatientLocation | null): boolean =>
  !!loc && PATIENT_LOCATIONS.some((d) => d.address === loc.address);

// Older custom accounts were given the demo address by mistake. Strip it so real users never see fake data.
export const sanitizeCustomPatient = (p: PatientWithLocations): PatientWithLocations => {
  const location = !p.location || isDemoLocation(p.location) ? EMPTY_LOCATION : p.location;
  const savedLocations = (p.savedLocations || []).filter((l) => !isDemoLocation(l));
  return { ...p, location, savedLocations };
};
