// End-to-end API tests. Run with: npm test
//
// These tests start the real app on a free port and talk to the database in MONGO_URI,
// so make sure backend/.env points at a database you are happy to test against and that
// `npm run seed:admin` has been run. Everything the tests create (users, flights, bookings)
// has a unique name and is deleted again at the end.
//
// The admin login comes from TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD, then ADMIN_EMAIL /
// ADMIN_PASSWORD, then the local default (admin@airline.com / admin123).

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const app = require('../server');

const DAY = 24 * 60 * 60 * 1000;
const MISSING_ID = '64b7f0f0f0f0f0f0f0f0f0f0';
const stamp = Date.now();
const adminLogin = {
  email: process.env.TEST_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@airline.com',
  password: process.env.TEST_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'admin123'
};

let server;
let baseUrl;
let admin; // { token, id }
let alice; // passenger
let bob; // passenger
let flight; // main test flight, 10 seats, base price 1000
let sawPasswordKey = false; // set if any response ever contains a "password" key
const createdUserIds = [];
const createdFlightIds = [];

// Small fetch wrapper: returns { status, data } and watches every response for a password key
const api = async (method, path, { body, token } = {}) => {
  const response = await fetch(baseUrl + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  if (/"password"\s*:/.test(text)) sawPasswordKey = true;
  let data = null;
  try {
    data = JSON.parse(text);
  } catch (error) {
    data = null;
  }
  return { status: response.status, data };
};

const passengers = (count, overrides = {}) =>
  Array.from({ length: count }, (_, i) => ({
    firstName: `Test${i}`,
    lastName: 'Passenger',
    dateOfBirth: '1990-01-01',
    gender: 'Other',
    ...overrides
  }));

const registerUser = async (label) => {
  const email = `${label}.${stamp}@example.com`;
  const res = await api('POST', '/api/auth/register', {
    body: { firstName: label, lastName: 'Tester', email, password: 'secret1' }
  });
  assert.equal(res.status, 201, `could not register ${label}`);
  createdUserIds.push(res.data.user._id);
  return { token: res.data.token, id: res.data.user._id, email };
};

const flightBody = (overrides = {}) => ({
  flightNumber: `T${String(stamp).slice(-7)}${Math.random().toString(36).slice(2, 4).toUpperCase()}`,
  origin: { city: 'Testville', code: 'TVL' },
  destination: { city: 'Examplecity', code: 'EXC' },
  departureTime: new Date(Date.now() + 40 * DAY).toISOString(),
  arrivalTime: new Date(Date.now() + 40 * DAY + 2 * 60 * 60 * 1000).toISOString(),
  basePrice: 1000,
  totalSeats: 10,
  ...overrides
});

const createFlight = async (overrides) => {
  const res = await api('POST', '/api/flights', { body: flightBody(overrides), token: admin.token });
  assert.equal(res.status, 201, `could not create flight: ${JSON.stringify(res.data)}`);
  createdFlightIds.push(res.data._id);
  return res.data;
};

const seatsLeft = async (flightId) => (await api('GET', `/api/flights/${flightId}`)).data.availableSeats;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  const login = await api('POST', '/api/auth/login', { body: adminLogin });
  assert.equal(login.status, 200, 'Admin login failed. Run `npm run seed:admin` or set TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD.');
  admin = { token: login.data.token, id: login.data.user._id };

  alice = await registerUser('alice');
  bob = await registerUser('bob');
  flight = await createFlight();
});

after(async () => {
  // Deleting a user also deletes their bookings, which lets the test flights be deleted
  for (const id of createdUserIds) {
    await api('DELETE', `/api/users/${id}`, { token: admin?.token });
  }
  for (const id of createdFlightIds) {
    await api('DELETE', `/api/flights/${id}`, { token: admin?.token });
  }
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
});

describe('authentication', () => {
  it('registers a passenger and never returns the password', async () => {
    const res = await api('POST', '/api/auth/register', {
      body: { firstName: 'Sneaky', lastName: 'Admin', email: `sneaky.${stamp}@example.com`, password: 'secret1', role: 'admin' }
    });
    assert.equal(res.status, 201);
    assert.ok(res.data.token);
    assert.equal(res.data.user.role, 'passenger', 'self-registration must never create an admin');
    assert.equal('password' in res.data.user, false);
    createdUserIds.push(res.data.user._id);
  });

  it('rejects a duplicate email', async () => {
    const res = await api('POST', '/api/auth/register', {
      body: { firstName: 'Dup', lastName: 'User', email: alice.email, password: 'secret1' }
    });
    assert.equal(res.status, 400);
    assert.match(res.data.message, /already registered/i);
  });

  it('validates email, password length and phone format', async () => {
    const base = { firstName: 'Bad', lastName: 'Input', email: `bad.${stamp}@example.com`, password: 'secret1' };
    const cases = [
      { ...base, email: 'not-an-email' },
      { ...base, email: 'a@b' },
      { ...base, password: '123' },
      { ...base, firstName: '   ' },
      { ...base, phone: 'call me!!' }
    ];
    for (const body of cases) {
      const res = await api('POST', '/api/auth/register', { body });
      assert.equal(res.status, 400, `expected 400 for ${JSON.stringify(body)}`);
      assert.ok(res.data.message);
    }
  });

  it('logs in case-insensitively and rejects wrong credentials', async () => {
    const ok = await api('POST', '/api/auth/login', { body: { email: alice.email.toUpperCase(), password: 'secret1' } });
    assert.equal(ok.status, 200);
    const wrong = await api('POST', '/api/auth/login', { body: { email: alice.email, password: 'wrong-password' } });
    assert.equal(wrong.status, 401);
    const empty = await api('POST', '/api/auth/login', { body: {} });
    assert.equal(empty.status, 400);
  });

  it('protects /me', async () => {
    assert.equal((await api('GET', '/api/auth/me')).status, 401);
    assert.equal((await api('GET', '/api/auth/me', { token: 'garbage.token.value' })).status, 401);
    const me = await api('GET', '/api/auth/me', { token: alice.token });
    assert.equal(me.status, 200);
    assert.equal(me.data.email, alice.email);
  });
});

describe('access control', () => {
  // [method, path, body, who may call it]
  const routes = [
    ['GET', '/api/auth/me', undefined, 'auth'],
    ['GET', '/api/users', undefined, 'admin'],
    ['GET', `/api/users/${MISSING_ID}`, undefined, 'owner-or-admin'],
    ['PUT', `/api/users/${MISSING_ID}`, {}, 'owner-or-admin'],
    ['DELETE', `/api/users/${MISSING_ID}`, undefined, 'admin'],
    ['POST', '/api/flights', {}, 'admin'],
    ['PUT', `/api/flights/${MISSING_ID}`, {}, 'admin'],
    ['DELETE', `/api/flights/${MISSING_ID}`, undefined, 'admin'],
    ['POST', '/api/bookings', {}, 'passenger'],
    ['GET', '/api/bookings', undefined, 'auth'],
    ['GET', `/api/bookings/${MISSING_ID}`, undefined, 'auth'],
    ['PUT', `/api/bookings/${MISSING_ID}`, { status: 'Completed' }, 'admin'],
    ['DELETE', `/api/bookings/${MISSING_ID}`, undefined, 'passenger']
  ];
  const blocked = (status) => status === 401 || status === 403;

  for (const [method, path, body, who] of routes) {
    it(`${method} ${path.replace(MISSING_ID, ':id')} is limited to ${who}`, async () => {
      const anonymous = await api(method, path, { body });
      const asPassenger = await api(method, path, { body, token: alice.token });
      const asAdmin = await api(method, path, { body, token: admin.token });

      assert.equal(anonymous.status, 401, 'no token must be 401');
      if (who === 'auth') {
        assert.equal(blocked(asPassenger.status), false);
        assert.equal(blocked(asAdmin.status), false);
      } else if (who === 'admin' || who === 'owner-or-admin') {
        assert.equal(asPassenger.status, 403, 'a passenger must be refused');
        assert.equal(blocked(asAdmin.status), false);
      } else if (who === 'passenger') {
        assert.equal(asAdmin.status, 403, 'an admin must be refused');
        assert.equal(blocked(asPassenger.status), false);
      }
    });
  }

  it('keeps flight search and details public', async () => {
    assert.equal((await api('GET', '/api/flights')).status, 200);
    assert.equal((await api('GET', `/api/flights/${flight._id}`)).status, 200);
  });
});

describe('flights', () => {
  it('filters by city or code, case-insensitively', async () => {
    const byCityAndCode = await api('GET', '/api/flights?origin=testville&destination=EXC');
    assert.equal(byCityAndCode.status, 200);
    assert.ok(byCityAndCode.data.some((f) => f._id === flight._id));
    assert.ok(byCityAndCode.data.every((f) => f.origin.city === 'Testville' && f.destination.code === 'EXC'));

    const none = await api('GET', '/api/flights?origin=Atlantis');
    assert.deepEqual(none.data, []);
    const regex = await api('GET', '/api/flights?origin=.*');
    assert.deepEqual(regex.data, [], 'search text must be treated literally, not as a regular expression');
  });

  it('matches the travel date in the passenger\'s own time zone', async () => {
    // 23:45 UTC is already the next calendar day in Manila (UTC+8, tzOffset -480)
    const utcDay = new Date(Date.now() + 60 * DAY);
    utcDay.setUTCHours(23, 45, 0, 0);
    const late = await createFlight({
      departureTime: utcDay.toISOString(),
      arrivalTime: new Date(utcDay.getTime() + 2 * 60 * 60 * 1000).toISOString()
    });
    const utcDate = utcDay.toISOString().slice(0, 10);
    const manilaDate = new Date(utcDay.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const found = async (query) => (await api('GET', `/api/flights?${query}`)).data.some((f) => f._id === late._id);
    assert.equal(await found(`date=${manilaDate}&tzOffset=-480`), true, 'local date with offset');
    assert.equal(await found(`date=${utcDate}`), true, 'UTC date without offset (API default)');
    assert.equal(await found(`date=${manilaDate}`), false, 'local date without offset is a different UTC day');
    assert.equal((await api('GET', `/api/flights?date=${manilaDate}&tzOffset=abc`)).status, 200, 'bad offset is ignored');
    assert.equal((await api('GET', '/api/flights?date=banana')).status, 400);
  });

  it('hides departed and cancelled flights from the public list but not the admin list', async () => {
    const past = await createFlight({
      departureTime: new Date(Date.now() - 5 * DAY).toISOString(),
      arrivalTime: new Date(Date.now() - 5 * DAY + 60 * 60 * 1000).toISOString()
    });
    const cancelled = await createFlight({ status: 'Cancelled' });

    const publicList = (await api('GET', '/api/flights')).data;
    assert.equal(publicList.some((f) => f._id === past._id), false, 'departed flight must be hidden');
    assert.equal(publicList.some((f) => f._id === cancelled._id), false, 'cancelled flight must be hidden');

    const adminList = (await api('GET', '/api/flights?all=true')).data;
    assert.ok(adminList.some((f) => f._id === past._id));
    assert.ok(adminList.some((f) => f._id === cancelled._id));
  });

  it('validates flight data on create and update', async () => {
    const reject = async (overrides, pattern) => {
      const res = await api('POST', '/api/flights', { body: flightBody(overrides), token: admin.token });
      assert.equal(res.status, 400, JSON.stringify(overrides));
      if (pattern) assert.match(res.data.message, pattern);
    };
    await reject({ flightNumber: flight.flightNumber }, /already exists/i);
    await reject({ basePrice: 0 }, /price/i);
    await reject({ totalSeats: -4 });
    await reject({ availableSeats: 99 }, /available seats/i);
    await reject({ arrivalTime: new Date(Date.now() + 39 * DAY).toISOString() }, /arrival/i);
    await reject({ origin: 'Manila' });
    await reject({ origin: { city: 'Manila', code: '12' } });

    const bad = await api('PUT', `/api/flights/${flight._id}`, { body: { availableSeats: 999 }, token: admin.token });
    assert.equal(bad.status, 400);
  });

  it('returns clean errors for bad or unknown ids', async () => {
    assert.equal((await api('GET', '/api/flights/not-an-id')).status, 400);
    assert.equal((await api('GET', `/api/flights/${MISSING_ID}`)).status, 404);
  });

  it('moves available seats with total seats when an admin resizes a flight', async () => {
    const spare = await createFlight({ totalSeats: 10 });
    const grown = await api('PUT', `/api/flights/${spare._id}`, { body: { totalSeats: 15 }, token: admin.token });
    assert.equal(grown.data.totalSeats, 15);
    assert.equal(grown.data.availableSeats, 15);
  });
});

describe('bookings', () => {
  let aliceBooking;

  it('prices a booking from the base fare, cabin multiplier and passenger count', async () => {
    const cases = [
      ['Economy', 1, 1000],
      ['Business', 1, 1800],
      ['First Class', 1, 2500],
      ['Business', 2, 3600],
      ['First Class', 3, 7500]
    ];
    for (const [seatClass, count, expected] of cases) {
      const res = await api('POST', '/api/bookings', {
        body: { flightId: flight._id, seatClass, passengers: passengers(count) },
        token: alice.token
      });
      assert.equal(res.status, 201, JSON.stringify(res.data));
      assert.equal(res.data.totalPrice, expected, `${seatClass} x ${count}`);
      assert.match(res.data.bookingReference, /^BK-\d{4}-[A-Z0-9]{4}$/);
      assert.equal(res.data.status, 'Confirmed');
      aliceBooking = res.data;
      // free the seats again so the later tests start from a full flight
      await api('DELETE', `/api/bookings/${res.data._id}`, { token: alice.token });
    }
    assert.equal(await seatsLeft(flight._id), 10);
  });

  it('takes seats on booking and rejects more passengers than seats', async () => {
    const booked = await api('POST', '/api/bookings', { body: { flightId: flight._id, passengers: passengers(4) }, token: alice.token });
    assert.equal(booked.status, 201);
    aliceBooking = booked.data;
    assert.equal(await seatsLeft(flight._id), 6);

    const tooMany = await api('POST', '/api/bookings', { body: { flightId: flight._id, passengers: passengers(7) }, token: bob.token });
    assert.equal(tooMany.status, 400);
    assert.match(tooMany.data.message, /seats/i);
    assert.equal(await seatsLeft(flight._id), 6, 'a rejected booking must not change the seat count');
  });

  it('validates the booking request', async () => {
    const bad = async (body, token = alice.token) => {
      const res = await api('POST', '/api/bookings', { body: { flightId: flight._id, ...body }, token });
      assert.equal(res.status, 400, JSON.stringify(body));
      assert.ok(res.data.message);
    };
    await bad({ passengers: [] });
    await bad({ passengers: passengers(10) });
    await bad({ passengers: passengers(1, { firstName: '  ' }) });
    await bad({ passengers: passengers(1, { dateOfBirth: 'not-a-date' }) });
    await bad({ passengers: passengers(1, { dateOfBirth: '2999-01-01' }) });
    await bad({ passengers: passengers(1, { gender: 'Robot' }) });
    await bad({ seatClass: 'Platinum', passengers: passengers(1) });
    await bad({ flightId: 'abc', passengers: passengers(1) });

    const missing = await api('POST', '/api/bookings', { body: { flightId: MISSING_ID, passengers: passengers(1) }, token: alice.token });
    assert.equal(missing.status, 404);
  });

  it('refuses to book cancelled or departed flights', async () => {
    const cancelled = await createFlight({ status: 'Cancelled' });
    const departed = await createFlight({
      departureTime: new Date(Date.now() - DAY).toISOString(),
      arrivalTime: new Date(Date.now() - DAY + 60 * 60 * 1000).toISOString()
    });
    for (const target of [cancelled, departed]) {
      const res = await api('POST', '/api/bookings', { body: { flightId: target._id, passengers: passengers(1) }, token: alice.token });
      assert.equal(res.status, 400);
    }
  });

  it('lets only the owner or an admin see a booking', async () => {
    const own = await api('GET', '/api/bookings', { token: alice.token });
    assert.ok(own.data.some((b) => b._id === aliceBooking._id));
    const others = await api('GET', '/api/bookings', { token: bob.token });
    assert.equal(others.data.some((b) => b._id === aliceBooking._id), false);

    assert.equal((await api('GET', `/api/bookings/${aliceBooking._id}`, { token: bob.token })).status, 403);
    assert.equal((await api('GET', `/api/bookings/${aliceBooking._id}`, { token: alice.token })).status, 200);

    const asAdmin = await api('GET', `/api/bookings/${aliceBooking._id}`, { token: admin.token });
    assert.equal(asAdmin.status, 200);
    assert.equal('password' in asAdmin.data.user, false);

    const manifest = await api('GET', `/api/bookings?flight=${flight._id}`, { token: admin.token });
    assert.ok(manifest.data.some((b) => b._id === aliceBooking._id));
    assert.equal((await api('GET', '/api/bookings?flight=nope', { token: admin.token })).status, 400);
  });

  it('only lets the owner cancel, once, and gives the seats back', async () => {
    assert.equal((await api('DELETE', `/api/bookings/${aliceBooking._id}`, { token: bob.token })).status, 403);

    const cancelled = await api('DELETE', `/api/bookings/${aliceBooking._id}`, { token: alice.token });
    assert.equal(cancelled.status, 200);
    assert.equal(cancelled.data.booking.status, 'Cancelled');
    assert.equal(await seatsLeft(flight._id), 10);

    const again = await api('DELETE', `/api/bookings/${aliceBooking._id}`, { token: alice.token });
    assert.equal(again.status, 400);
    assert.equal(await seatsLeft(flight._id), 10, 'cancelling twice must not release seats twice');
  });

  it('lets an admin complete or cancel, but never reopen a cancelled booking', async () => {
    const booked = await api('POST', '/api/bookings', { body: { flightId: flight._id, passengers: passengers(2) }, token: alice.token });
    assert.equal(await seatsLeft(flight._id), 8);

    const bad = await api('PUT', `/api/bookings/${booked.data._id}`, { body: { status: 'Bogus' }, token: admin.token });
    assert.equal(bad.status, 400);
    assert.equal((await api('PUT', `/api/bookings/${booked.data._id}`, { body: { status: 'Completed' }, token: alice.token })).status, 403);

    const cancelled = await api('PUT', `/api/bookings/${booked.data._id}`, { body: { status: 'Cancelled' }, token: admin.token });
    assert.equal(cancelled.status, 200);
    assert.equal(await seatsLeft(flight._id), 10);

    const reopen = await api('PUT', `/api/bookings/${booked.data._id}`, { body: { status: 'Confirmed' }, token: admin.token });
    assert.equal(reopen.status, 400);
    assert.equal(await seatsLeft(flight._id), 10, 'seat count must not drift after a blocked reopen');

    const second = await api('POST', '/api/bookings', { body: { flightId: flight._id, passengers: passengers(1) }, token: alice.token });
    const completed = await api('PUT', `/api/bookings/${second.data._id}`, { body: { status: 'Completed' }, token: admin.token });
    assert.equal(completed.data.status, 'Completed');
    assert.equal(await seatsLeft(flight._id), 9, 'a completed booking keeps its seat');
    assert.equal((await api('DELETE', `/api/bookings/${second.data._id}`, { token: alice.token })).status, 400);
  });

  it('keeps flights that have bookings', async () => {
    const res = await api('DELETE', `/api/flights/${flight._id}`, { token: admin.token });
    assert.equal(res.status, 400);
    assert.match(res.data.message, /has bookings/i);
  });
});

describe('concurrency', () => {
  it('never oversells a flight when bookings arrive at the same moment', async () => {
    const race = await createFlight({ totalSeats: 8 });
    const attempts = await Promise.all(
      Array.from({ length: 14 }, (_, i) =>
        api('POST', '/api/bookings', {
          body: { flightId: race._id, passengers: passengers(1) },
          token: i % 2 === 0 ? alice.token : bob.token
        })
      )
    );
    const accepted = attempts.filter((r) => r.status === 201);
    const rejected = attempts.filter((r) => r.status === 400);
    assert.equal(accepted.length, 8, 'exactly as many bookings as seats');
    assert.equal(rejected.length, 6);
    assert.equal(await seatsLeft(race._id), 0);
    assert.equal(new Set(accepted.map((r) => r.data.bookingReference)).size, 8, 'references must be unique');

    // Cancel every booking twice at once: seats must come back exactly once
    const owners = new Map([[alice.id, alice.token], [bob.id, bob.token]]);
    const cancels = await Promise.all(
      accepted.flatMap((r) => {
        const token = owners.get(r.data.user);
        return [
          api('DELETE', `/api/bookings/${r.data._id}`, { token }),
          api('DELETE', `/api/bookings/${r.data._id}`, { token })
        ];
      })
    );
    assert.equal(cancels.filter((r) => r.status === 200).length, 8);
    assert.equal(cancels.filter((r) => r.status === 400).length, 8);
    assert.equal(await seatsLeft(race._id), 8, 'back to full, never above');
  });

  it('releases seats once when a passenger and an admin cancel together', async () => {
    const duel = await createFlight({ totalSeats: 6 });
    const booked = await api('POST', '/api/bookings', { body: { flightId: duel._id, passengers: passengers(2) }, token: alice.token });
    assert.equal(await seatsLeft(duel._id), 4);
    await Promise.all([
      api('DELETE', `/api/bookings/${booked.data._id}`, { token: alice.token }),
      api('PUT', `/api/bookings/${booked.data._id}`, { body: { status: 'Cancelled' }, token: admin.token })
    ]);
    assert.equal(await seatsLeft(duel._id), 6);
  });
});

describe('users', () => {
  it('updates a profile but ignores role and email', async () => {
    const res = await api('PUT', `/api/users/${bob.id}`, {
      body: { firstName: 'Robert', phone: '+63 912-345 (6789)', nationality: 'Filipino', role: 'admin', email: 'hijack@example.com' },
      token: bob.token
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.firstName, 'Robert');
    assert.equal(res.data.role, 'passenger');
    assert.equal(res.data.email, bob.email);

    const badPhone = await api('PUT', `/api/users/${bob.id}`, { body: { phone: 'abc' }, token: bob.token });
    assert.equal(badPhone.status, 400);
    const emptyName = await api('PUT', `/api/users/${bob.id}`, { body: { firstName: '   ' }, token: bob.token });
    assert.equal(emptyName.status, 400);
  });

  it('keeps passengers out of each other\'s accounts', async () => {
    assert.equal((await api('GET', `/api/users/${bob.id}`, { token: alice.token })).status, 403);
    assert.equal((await api('PUT', `/api/users/${bob.id}`, { body: { firstName: 'X' }, token: alice.token })).status, 403);
    assert.equal((await api('GET', '/api/users', { token: alice.token })).status, 403);
    const list = await api('GET', '/api/users', { token: admin.token });
    assert.equal(list.status, 200);
    assert.ok(list.data.every((u) => !('password' in u)));
  });

  it('changes a password only with the correct current password', async () => {
    const noCurrent = await api('PUT', `/api/users/${bob.id}`, { body: { newPassword: 'newsecret1' }, token: bob.token });
    assert.equal(noCurrent.status, 400);
    const wrong = await api('PUT', `/api/users/${bob.id}`, { body: { currentPassword: 'nope', newPassword: 'newsecret1' }, token: bob.token });
    assert.equal(wrong.status, 400);
    const short = await api('PUT', `/api/users/${bob.id}`, { body: { currentPassword: 'secret1', newPassword: '123' }, token: bob.token });
    assert.equal(short.status, 400);
    const byAdmin = await api('PUT', `/api/users/${bob.id}`, { body: { currentPassword: 'secret1', newPassword: 'newsecret1' }, token: admin.token });
    assert.equal(byAdmin.status, 403, 'only the owner can change their password');

    const ok = await api('PUT', `/api/users/${bob.id}`, { body: { currentPassword: 'secret1', newPassword: 'newsecret1' }, token: bob.token });
    assert.equal(ok.status, 200);
    assert.equal((await api('POST', '/api/auth/login', { body: { email: bob.email, password: 'newsecret1' } })).status, 200);
    assert.equal((await api('POST', '/api/auth/login', { body: { email: bob.email, password: 'secret1' } })).status, 401);
  });

  it('stops an admin from deleting their own account', async () => {
    const res = await api('DELETE', `/api/users/${admin.id}`, { token: admin.token });
    assert.equal(res.status, 400);
  });

  it('deleting a user removes their bookings and releases only the seats still held', async () => {
    const victim = await registerUser('victim');
    const target = await createFlight({ totalSeats: 10 });

    const confirmed = await api('POST', '/api/bookings', { body: { flightId: target._id, passengers: passengers(3) }, token: victim.token });
    const toCancel = await api('POST', '/api/bookings', { body: { flightId: target._id, passengers: passengers(2) }, token: victim.token });
    await api('DELETE', `/api/bookings/${toCancel.data._id}`, { token: victim.token });
    assert.equal(await seatsLeft(target._id), 7);

    const deleted = await api('DELETE', `/api/users/${victim.id}`, { token: admin.token });
    assert.equal(deleted.status, 200);
    createdUserIds.splice(createdUserIds.indexOf(victim.id), 1);

    assert.equal(await seatsLeft(target._id), 10, 'the 3 confirmed seats come back, the cancelled 2 are not counted twice');
    assert.equal((await api('GET', `/api/bookings/${confirmed.data._id}`, { token: admin.token })).status, 404);
    assert.equal((await api('GET', `/api/users/${victim.id}`, { token: admin.token })).status, 404);
    assert.equal((await api('GET', '/api/auth/me', { token: victim.token })).status, 401, 'a deleted user\'s token stops working');
  });
});

describe('general behaviour', () => {
  it('answers unknown routes and bad JSON with a JSON message', async () => {
    const unknown = await api('GET', '/api/nope');
    assert.equal(unknown.status, 404);
    assert.ok(unknown.data.message);

    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{bad json'
    });
    assert.equal(response.status, 400);
    assert.ok((await response.json()).message);
  });

  it('blocks other origins with 403 but allows the frontend', async () => {
    const allowed = await fetch(`${baseUrl}/api/health`, { headers: { Origin: 'http://localhost:5173' } });
    assert.equal(allowed.status, 200);
    const blockedOrigin = await fetch(`${baseUrl}/api/health`, { headers: { Origin: 'https://evil.example' } });
    assert.equal(blockedOrigin.status, 403);
  });

  it('never returned a password key in any response', () => {
    assert.equal(sawPasswordKey, false);
  });
});
