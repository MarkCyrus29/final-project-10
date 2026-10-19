const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Flight = require('./models/Flight');

// Build a date N days from today at a given UTC hour
const daysFromNow = (days, hour) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
};

// Arrival = departure + N hours
const plusHours = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000);

const city = (name, code) => ({ city: name, code });

// 8 sample flights on different routes and dates
const sampleFlights = [
  { flightNumber: 'PR101', origin: city('Manila', 'MNL'), destination: city('Cebu', 'CEB'), dep: daysFromNow(3, 2), hours: 1.5, basePrice: 2500, totalSeats: 150 },
  { flightNumber: 'PR102', origin: city('Cebu', 'CEB'), destination: city('Manila', 'MNL'), dep: daysFromNow(3, 9), hours: 1.5, basePrice: 2600, totalSeats: 150 },
  { flightNumber: 'PR201', origin: city('Manila', 'MNL'), destination: city('Davao', 'DVO'), dep: daysFromNow(5, 4), hours: 2, basePrice: 3200, totalSeats: 180 },
  { flightNumber: 'PR301', origin: city('Manila', 'MNL'), destination: city('Iloilo', 'ILO'), dep: daysFromNow(7, 1), hours: 1.25, basePrice: 2300, totalSeats: 120 },
  { flightNumber: 'PR501', origin: city('Manila', 'MNL'), destination: city('Singapore', 'SIN'), dep: daysFromNow(10, 3), hours: 3.75, basePrice: 8500, totalSeats: 200 },
  { flightNumber: 'PR502', origin: city('Singapore', 'SIN'), destination: city('Manila', 'MNL'), dep: daysFromNow(14, 6), hours: 3.75, basePrice: 8700, totalSeats: 200 },
  { flightNumber: 'PR701', origin: city('Manila', 'MNL'), destination: city('Tokyo', 'NRT'), dep: daysFromNow(21, 1), hours: 4.5, basePrice: 15000, totalSeats: 250 },
  { flightNumber: 'PR801', origin: city('Cebu', 'CEB'), destination: city('Hong Kong', 'HKG'), dep: daysFromNow(30, 5), hours: 3, basePrice: 9800, totalSeats: 180 }
];

const seedFlights = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for flight seeding...');

    let created = 0;

    for (const sample of sampleFlights) {
      // Skip flights that already exist so this script is safe to run twice
      const exists = await Flight.findOne({ flightNumber: sample.flightNumber });
      if (exists) {
        console.log(`Skipped ${sample.flightNumber} (already exists)`);
        continue;
      }

      await Flight.create({
        flightNumber: sample.flightNumber,
        origin: sample.origin,
        destination: sample.destination,
        departureTime: sample.dep,
        arrivalTime: plusHours(sample.dep, sample.hours),
        basePrice: sample.basePrice,
        totalSeats: sample.totalSeats,
        availableSeats: sample.totalSeats
      });
      created++;
    }

    console.log(`Done. ${created} flight(s) added.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding flights: ${error.message}`);
    process.exit(1);
  }
};

seedFlights();
