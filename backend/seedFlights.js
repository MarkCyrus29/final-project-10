const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Flight = require('./models/Flight');
const Booking = require('./models/Booking');

// Seats already taken by bookings that still hold a seat (Confirmed or Completed).
// Re-seeding must keep this in mind, otherwise a flight with bookings would show all its seats free.
const countBookedSeats = async (flightId) => {
  const result = await Booking.aggregate([
    { $match: { flight: flightId, status: { $in: ['Confirmed', 'Completed'] } } },
    { $group: { _id: null, seats: { $sum: { $size: '$passengers' } } } }
  ]);
  return result.length > 0 ? result[0].seats : 0;
};

// Build a date N days from today at a given hour and minute (local time)
const daysFromNow = (days, hour = 8, minute = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date;
};

// Arrival = departure + N hours
const plusHours = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000);

const city = (name, code) => ({ city: name, code });

// Sample flights on different routes with future departure dates.
// Manila to Cebu and Manila to Singapore have several flights so a route search shows a real list.
const sampleFlights = [
  { flightNumber: 'PR101', origin: city('Manila', 'MNL'), destination: city('Cebu', 'CEB'), dep: daysFromNow(2, 8, 30), hours: 1.5, basePrice: 2500, totalSeats: 150 },
  { flightNumber: 'PR103', origin: city('Manila', 'MNL'), destination: city('Cebu', 'CEB'), dep: daysFromNow(2, 18, 45), hours: 1.5, basePrice: 2700, totalSeats: 150 },
  { flightNumber: 'PR104', origin: city('Manila', 'MNL'), destination: city('Cebu', 'CEB'), dep: daysFromNow(3, 6, 15), hours: 1.5, basePrice: 2400, totalSeats: 120 },
  { flightNumber: 'PR102', origin: city('Cebu', 'CEB'), destination: city('Manila', 'MNL'), dep: daysFromNow(2, 14, 0), hours: 1.5, basePrice: 2600, totalSeats: 150 },
  { flightNumber: 'PR201', origin: city('Manila', 'MNL'), destination: city('Davao', 'DVO'), dep: daysFromNow(4, 9, 15), hours: 2, basePrice: 3200, totalSeats: 180 },
  { flightNumber: 'PR301', origin: city('Manila', 'MNL'), destination: city('Iloilo', 'ILO'), dep: daysFromNow(6, 11, 0), hours: 1.25, basePrice: 2300, totalSeats: 120 },
  { flightNumber: 'PR501', origin: city('Manila', 'MNL'), destination: city('Singapore', 'SIN'), dep: daysFromNow(8, 7, 45), hours: 3.75, basePrice: 8500, totalSeats: 200 },
  { flightNumber: 'PR503', origin: city('Manila', 'MNL'), destination: city('Singapore', 'SIN'), dep: daysFromNow(8, 19, 30), hours: 3.75, basePrice: 8900, totalSeats: 180 },
  { flightNumber: 'PR502', origin: city('Singapore', 'SIN'), destination: city('Manila', 'MNL'), dep: daysFromNow(12, 13, 30), hours: 3.75, basePrice: 8700, totalSeats: 200 },
  { flightNumber: 'PR701', origin: city('Manila', 'MNL'), destination: city('Tokyo', 'NRT'), dep: daysFromNow(18, 6, 0), hours: 4.5, basePrice: 15000, totalSeats: 250 },
  { flightNumber: 'PR801', origin: city('Cebu', 'CEB'), destination: city('Hong Kong', 'HKG'), dep: daysFromNow(25, 10, 30), hours: 3, basePrice: 9800, totalSeats: 180 }
];

const seedFlights = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for flight seeding...');

    let created = 0;
    let updated = 0;

    for (const sample of sampleFlights) {
      const departureTime = sample.dep;
      const arrivalTime = plusHours(sample.dep, sample.hours);

      const existing = await Flight.findOne({ flightNumber: sample.flightNumber });
      if (existing) {
        existing.origin = sample.origin;
        existing.destination = sample.destination;
        existing.departureTime = departureTime;
        existing.arrivalTime = arrivalTime;
        existing.basePrice = sample.basePrice;
        existing.totalSeats = sample.totalSeats;
        existing.availableSeats = Math.max(0, sample.totalSeats - (await countBookedSeats(existing._id)));
        existing.status = 'Scheduled';
        await existing.save();
        console.log(`Updated ${sample.flightNumber} -> Dep: ${departureTime.toISOString()}`);
        updated++;
        continue;
      }

      await Flight.create({
        flightNumber: sample.flightNumber,
        origin: sample.origin,
        destination: sample.destination,
        departureTime,
        arrivalTime,
        basePrice: sample.basePrice,
        totalSeats: sample.totalSeats,
        availableSeats: sample.totalSeats,
        status: 'Scheduled'
      });
      console.log(`Created ${sample.flightNumber} -> Dep: ${departureTime.toISOString()}`);
      created++;
    }

    // Also shift any other past flights in the database to future dates
    const now = new Date();
    const otherPastFlights = await Flight.find({
      departureTime: { $lt: now },
      flightNumber: { $nin: sampleFlights.map((s) => s.flightNumber) }
    });

    for (let i = 0; i < otherPastFlights.length; i++) {
      const flight = otherPastFlights[i];
      const durationMs =
        flight.arrivalTime && flight.departureTime
          ? Math.max(3600000, new Date(flight.arrivalTime).getTime() - new Date(flight.departureTime).getTime())
          : 2 * 3600000;
      const newDep = daysFromNow(5 + (i % 15), 10, 0);
      flight.departureTime = newDep;
      flight.arrivalTime = new Date(newDep.getTime() + durationMs);
      if (flight.status === 'Completed') {
        flight.status = 'Scheduled';
      }
      // Keep the seat count in line with the real bookings instead of resetting it
      flight.availableSeats = Math.max(0, flight.totalSeats - (await countBookedSeats(flight._id)));
      await flight.save();
      console.log(`Shifted other flight ${flight.flightNumber} to future: ${newDep.toISOString()}`);
      updated++;
    }

    console.log(`Done. ${created} flight(s) added, ${updated} flight(s) updated to future dates.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding flights: ${error.message}`);
    process.exit(1);
  }
};

seedFlights();
