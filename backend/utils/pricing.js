// Cabin class price multipliers (applied to a flight's base fare).
// Keep in sync with frontend/src/lib/pricing.js
const CLASS_MULTIPLIERS = {
  Economy: 1,
  Business: 1.8,
  'First Class': 2.5
};

// total = base fare x class multiplier x number of passengers, rounded to centavos
const calculateTotalPrice = (basePrice, seatClass, passengerCount) => {
  const multiplier = CLASS_MULTIPLIERS[seatClass] || 1;
  return Math.round(basePrice * multiplier * passengerCount * 100) / 100;
};

module.exports = { CLASS_MULTIPLIERS, calculateTotalPrice };
