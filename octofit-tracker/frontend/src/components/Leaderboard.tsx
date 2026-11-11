import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Entry = { teamId?: string; teamName: string; totalPoints: number; rank: number };
async function loadLeaderboard() {
  return (await getJson<{ leaderboard: Entry[] }>('/api/leaderboard')).leaderboard;
}

export default function Leaderboard() {
  return <CapabilityCard title="Leaderboard" emptyText="No rankings yet." load={loadLeaderboard} render={(entries) =>
    <div className="table-responsive"><table className="table align-middle"><caption>Team rankings by activity points</caption><thead><tr><th scope="col">Rank</th><th scope="col">Team</th><th scope="col">Points</th></tr></thead><tbody>{entries.map((entry) => <tr key={entry.teamId ?? entry.rank}><td>{entry.rank}</td><th scope="row">{entry.teamName}</th><td>{entry.totalPoints}</td></tr>)}</tbody></table></div>} />;
}
