import { useState, type FormEvent } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Workout = { _id?: string; title: string; focus?: string; minutes?: number; difficulty?: string; reason: string };
async function loadWorkouts(email: string) {
  return (await getJson<{ suggestions: Workout[] }>(`/api/workouts/suggestions/${encodeURIComponent(email)}`)).suggestions;
}

export default function Workouts() {
  const [email, setEmail] = useState('mona@example.com');
  const [revision, setRevision] = useState(0);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmail(String(new FormData(event.currentTarget).get('email')).trim());
    setRevision((value) => value + 1);
  }
  return <CapabilityCard title="Workout suggestions" emptyText="No workout suggestions available." load={loadWorkouts} resource={email} revision={revision} render={(workouts) =>
    <ul className="list-group list-group-flush">{workouts.map((workout, index) => <li className="list-group-item px-0" key={workout._id ?? index}><h3 className="h5">{workout.title}</h3><p className="text-secondary">{[workout.focus, workout.minutes ? `${workout.minutes} minutes` : '', workout.difficulty].filter(Boolean).join(' · ')}</p><p>{workout.reason}</p></li>)}</ul>}>
    <form onSubmit={submit} className="row g-3 mb-4 align-items-end"><div className="col-sm-8"><label className="form-label" htmlFor="workout-email">User email</label><input className="form-control" type="email" id="workout-email" name="email" defaultValue={email} required /></div><div className="col-sm-4"><button className="btn btn-primary">Get suggestions</button></div></form>
  </CapabilityCard>;
}
