import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Activity, Team, User } from '../src/models/index.js';

let mongo: MongoMemoryServer;
const app = createApp();
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
}, 60_000);
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });
beforeEach(async () => { await Promise.all([Activity.deleteMany({}), Team.deleteMany({}), User.deleteMany({})]); });

it('rejects invalid activity durations without writing records', async () => {
  const user = await User.create({ name: 'Mona', email: 'mona@example.com', fitnessGoal: 'endurance' });
  const team = await Team.create({ name: 'Octocats', mascot: 'Mona' });
  for (const minutes of [0, -1, '30', null]) {
    const response = await request(app).post('/api/activities').send({ userId: user._id.toString(), teamId: team._id.toString(), type: 'run', minutes });
    expect(response.status).toBe(400);
  }
  expect(await Activity.countDocuments()).toBe(0);
});

it('validates team membership and deduplicates existing member IDs', async () => {
  const user = await User.create({ name: 'Mona', email: 'mona@example.com', fitnessGoal: 'endurance' });
  for (const members of ['invalid', ['invalid'], [new mongoose.Types.ObjectId().toString()]]) {
    expect((await request(app).post('/api/teams').send({ name: 'Octocats', mascot: 'Mona', members })).status).toBe(400);
  }
  expect(await Team.countDocuments()).toBe(0);
  const response = await request(app).post('/api/teams').send({ name: 'Octocats', mascot: 'Mona', members: [user._id.toString(), user._id.toString()] });
  expect(response.status).toBe(201);
  expect(response.body.team.members).toEqual([user._id.toString()]);
});

it('assigns deterministic ranks to teams with zero points', async () => {
  await Team.create([{ name: 'Zebras', mascot: 'Z' }, { name: 'Ants', mascot: 'A' }]);
  const response = await request(app).get('/api/leaderboard');
  expect(response.body.leaderboard.map(({ teamName, rank, totalPoints }: { teamName: string; rank: number; totalPoints: number }) => ({ teamName, rank, totalPoints }))).toEqual([
    { teamName: 'Ants', rank: 1, totalPoints: 0 },
    { teamName: 'Zebras', rank: 2, totalPoints: 0 },
  ]);
});