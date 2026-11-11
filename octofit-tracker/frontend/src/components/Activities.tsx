import { useState, type FormEvent } from 'react';
import { getJson, postJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = { _id?: string; user: string; team: string; type: string; minutes: number; points: number; occurredAt?: string };
async function loadActivities() {
  return (await getJson<{ activities: Activity[] }>('/api/activities')).activities;
}

export default function Activities() {
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
      await postJson('/api/activities', { userId: values.get('userId'), teamId: values.get('teamId'), type: values.get('type'), minutes: Number(values.get('minutes')) });
      form.reset();
      setRevision((value) => value + 1);
      setMessage({ error: false, text: 'Activity recorded.' });
    } catch (error) {
      setMessage({ error: true, text: error instanceof Error ? error.message : 'Unable to save activity.' });
    } finally { setSaving(false); }
  }
  return <CapabilityCard title="Activities" emptyText="No activities yet." load={loadActivities} revision={revision} render={(activities) =>
    <div className="table-responsive"><table className="table align-middle"><caption>Recorded activities</caption><thead><tr><th scope="col">Activity</th><th scope="col">Minutes</th><th scope="col">Points</th><th scope="col">Date</th></tr></thead><tbody>{activities.map((activity, index) => <tr key={activity._id ?? index}><td>{activity.type}</td><td>{activity.minutes}</td><td>{activity.points}</td><td>{activity.occurredAt ? new Date(activity.occurredAt).toLocaleDateString() : '-'}</td></tr>)}</tbody></table></div>}>
    <form onSubmit={submit} className="row g-3 mb-4">
      <div className="col-md-6"><label className="form-label" htmlFor="activity-user">User ID</label><input id="activity-user" name="userId" className="form-control" required pattern="[a-fA-F0-9]{24}" /></div>
      <div className="col-md-6"><label className="form-label" htmlFor="activity-team">Team ID</label><input id="activity-team" name="teamId" className="form-control" required pattern="[a-fA-F0-9]{24}" /></div>
      <div className="col-sm-6"><label className="form-label" htmlFor="activity-type">Activity type</label><select id="activity-type" name="type" className="form-select"><option value="run">Run</option><option value="cycle">Cycle</option><option value="walk">Walk</option><option value="swim">Swim</option><option value="strength">Strength</option><option value="yoga">Yoga</option></select></div>
      <div className="col-sm-6"><label className="form-label" htmlFor="activity-minutes">Minutes</label><input id="activity-minutes" name="minutes" type="number" min="1" step="1" defaultValue="30" className="form-control" required /></div>
      <div><button className="btn btn-primary" disabled={saving}>{saving ? 'Recording...' : 'Record activity'}</button></div>
    </form>
    {message.text && <p role={message.error ? 'alert' : 'status'} className={message.error ? 'text-danger' : 'text-success'}>{message.text}</p>}
  </CapabilityCard>;
}
