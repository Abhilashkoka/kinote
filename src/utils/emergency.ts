// Real-world emergency helpers. These open the phone's dialler or maps app; nothing is simulated.

// 112 is India's single emergency number (police, fire, ambulance). It also works across the EU,
// and most phones route 112 to local emergency services elsewhere.
export const EMERGENCY_NUMBER = '112';

export const emergencyTelLink = `tel:${EMERGENCY_NUMBER}`;

// Opens Google Maps searching for hospitals near the saved address, or near the phone's location.
export const nearestHospitalsUrl = (address?: string): string => {
  const near = address && address.trim() ? `hospital near ${address.trim()}` : 'hospital near me';
  return `https://www.google.com/maps/search/${encodeURIComponent(near)}`;
};
