import { useState, type FormEvent } from 'react';
import { getJson, postJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { _id?: string; name: string; mascot?: string; members: string[] };
async function loadTeams() {
  return (await getJson<{ teams: Team[] }>('/api/teams')).teams;
}

export default function Teams() {
  const [revision, setRevision] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ error: false, text: '' });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setSaving(true);
    setMessage({ error: false, text: '' });
    try {
      const members = String(values.get('members') ?? '').split(',').map((member) => member.trim()).filter(Boolean);
      await postJson('/api/teams', { name: values.get('name'), mascot: values.get('mascot'), members });
      form.reset();
      setRevision((value) => value + 1);
      setMessage({ error: false, text: 'Team created.' });
    } catch (error) {
      setMessage({ error: true, text: error instanceof Error ? error.message : 'Unable to create team.' });
    } finally { setSaving(false); }
  }
  return <CapabilityCard title="Teams" emptyText="No teams yet." load={loadTeams} revision={revision} render={(teams) =>
    <ul className="list-group list-group-flush">{teams.map((team, index) => <li className="list-group-item px-0" key={team._id ?? index}><h3 className="h5">{team.name}</h3><p className="mb-1">{team.mascot} · {team.members.length} members</p>{team._id && <p className="small text-break mb-1">Team ID: {team._id}</p>}{team.members.length > 0 && <ul className="small text-break">{team.members.map((member) => <li key={member}>{member}</li>)}</ul>}</li>)}</ul>}>
    <form onSubmit={submit} className="row g-3 mb-4">
      <div className="col-sm-6"><label htmlFor="team-name" className="form-label">Team name</label><input id="team-name" name="name" className="form-control" required /></div>
      <div className="col-sm-6"><label htmlFor="team-mascot" className="form-label">Mascot</label><input id="team-mascot" name="mascot" className="form-control" required /></div>
      <div><label htmlFor="team-members" className="form-label">Member IDs (comma-separated)</label><input id="team-members" name="members" className="form-control" /></div>
      <div><button className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create team'}</button></div>
    </form>
    {message.text && <p role={message.error ? 'alert' : 'status'} className={message.error ? 'text-danger' : 'text-success'}>{message.text}</p>}
  </CapabilityCard>;
}
