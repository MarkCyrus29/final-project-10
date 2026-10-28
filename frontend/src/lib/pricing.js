// Cabin classes and their price multipliers (applied to a flight's base fare).
// Keep in sync with backend/utils/pricing.js
export const CABIN_CLASSES = [
  { name: 'Economy', multiplier: 1 },
  { name: 'Business', multiplier: 1.8 },
  { name: 'First Class', multiplier: 2.5 }
];

export const getMultiplier = (seatClass) =>
  CABIN_CLASSES.find((c) => c.name === seatClass)?.multiplier ?? 1;

// total = base fare x class multiplier x number of passengers, rounded to centavos
export const calculateTotalPrice = (basePrice, seatClass, passengerCount) =>
  Math.round(Number(basePrice || 0) * getMultiplier(seatClass) * passengerCount * 100) / 100;
