import { isObjectIdOrHexString } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

function readInput(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw badRequest('Expected a JSON object');
  return input as Record<string, unknown>;
}

function requiredText(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) throw badRequest(`${field} is required`);
  return value.trim();
}

function requiredId(value: unknown, field: string) {
  if (typeof value !== 'string' || !isObjectIdOrHexString(value)) throw badRequest(`${field} must be a valid ID`);
  return value;
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1, _id: -1 }).lean();
}

export async function createActivity(input: unknown) {
  const fields = readInput(input);
  const user = requiredId(fields.userId, 'userId');
  const team = requiredId(fields.teamId, 'teamId');
  const type = requiredText(fields.type, 'type');
  const minutes = fields.minutes;
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) {
    throw badRequest('minutes must be a finite number of at least 1');
  }
  const [existingUser, existingTeam] = await Promise.all([User.exists({ _id: user }), Team.exists({ _id: team })]);
  if (!existingUser || !existingTeam) throw badRequest('The user and team must exist');
  return Activity.create({ user, team, type, minutes, points: minutes, occurredAt: new Date() });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const fields = readInput(input);
  const name = requiredText(fields.name, 'name');
  const mascot = requiredText(fields.mascot, 'mascot');
  const submittedMembers = fields.members ?? [];
  if (!Array.isArray(submittedMembers)) throw badRequest('members must be an array');
  const members = [...new Set(submittedMembers.map((member) => requiredId(member, 'member')))];
  if (await User.countDocuments({ _id: { $in: members } }) !== members.length) {
    throw badRequest('All members must be existing users');
  }
  return Team.create({ name, mascot, members });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().lean(),
    Activity.aggregate<{ _id: unknown; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map((entry) => [String(entry._id), entry.totalPoints]));
  return teams.map((team) => ({
    teamId: team._id.toString(), teamName: team.name, totalPoints: pointsByTeam.get(team._id.toString()) ?? 0,
  })).sort((first, second) => second.totalPoints - first.totalPoints || first.teamName.localeCompare(second.teamName) || first.teamId.localeCompare(second.teamId))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1, _id: -1 }).limit(20).lean(),
    Workout.find().sort({ title: 1 }).lean(),
  ]);
  const focusByType: Record<string, string> = { run: 'endurance', cycle: 'endurance', swim: 'endurance', walk: 'endurance', strength: 'strength', yoga: 'mobility', stretch: 'mobility' };
  const recentFocus = activities[0] ? focusByType[activities[0].type.toLowerCase()] ?? activities[0].type.toLowerCase() : undefined;
  const goal = user.fitnessGoal.toLowerCase();
  const score = (focus: string) => (focus.toLowerCase() === goal ? 2 : 0) + (focus.toLowerCase() === recentFocus ? 1 : 0);
  return workouts.sort((first, second) => score(second.focus) - score(first.focus)).map((workout) => ({
    ...workout,
    reason: workout.focus.toLowerCase() === goal
      ? `Supports your ${goal} goal${recentFocus === goal ? ' and recent activity' : ''}.`
      : workout.focus.toLowerCase() === recentFocus
        ? `Builds on your recent ${activities[0].type} activity.`
        : `Adds ${workout.focus} variety alongside your ${goal} goal.`,
  }));
}

export { User };
