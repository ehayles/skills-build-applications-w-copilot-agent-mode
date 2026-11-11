import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import App from '../src/App.js';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function renderRoute(route: string) {
  return render(<MemoryRouter initialEntries={[route]}><App /></MemoryRouter>);
}

it('records an activity through the shared client and refreshes the list', async () => {
  const fetchMock = vi.fn(async (_input: unknown, init?: RequestInit) => new Response(JSON.stringify(
    init?.method === 'POST' ? { activity: {} } : { activities: [] },
  ), { status: init?.method === 'POST' ? 201 : 200 }));
  vi.stubGlobal('fetch', fetchMock);
  renderRoute('/activities');
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('User ID'), '123456789012345678901234');
  await user.type(screen.getByLabelText('Team ID'), 'abcdefabcdefabcdefabcdef');
  await user.click(screen.getByRole('button', { name: 'Record activity' }));
  await screen.findByText('Activity recorded.');
  expect(fetchMock).toHaveBeenCalledWith('/api/activities', expect.objectContaining({
    method: 'POST', body: JSON.stringify({ userId: '123456789012345678901234', teamId: 'abcdefabcdefabcdefabcdef', type: 'run', minutes: 30 }),
  }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
});

it('creates a team with parsed member IDs', async () => {
  const fetchMock = vi.fn(async (_input: unknown, init?: RequestInit) => new Response(JSON.stringify(
    init?.method === 'POST' ? { team: {} } : { teams: [] },
  ), { status: init?.method === 'POST' ? 201 : 200 }));
  vi.stubGlobal('fetch', fetchMock);
  renderRoute('/teams');
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Team name'), 'New team');
  await user.type(screen.getByLabelText('Mascot'), 'Mona');
  await user.type(screen.getByLabelText(/Member IDs/), '123456789012345678901234, abcdefabcdefabcdefabcdef');
  await user.click(screen.getByRole('button', { name: 'Create team' }));
  await screen.findByText('Team created.');
  expect(fetchMock).toHaveBeenCalledWith('/api/teams', expect.objectContaining({
    method: 'POST', body: JSON.stringify({ name: 'New team', mascot: 'Mona', members: ['123456789012345678901234', 'abcdefabcdefabcdefabcdef'] }),
  }));
});

it('keeps form input and announces a failed submission', async () => {
  vi.stubGlobal('fetch', vi.fn(async (_input: unknown, init?: RequestInit) => new Response(JSON.stringify(
    init?.method === 'POST' ? { error: 'All members must be existing users' } : { teams: [] },
  ), { status: init?.method === 'POST' ? 400 : 200 })));
  renderRoute('/teams');
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Team name'), 'New team');
  await user.type(screen.getByLabelText('Mascot'), 'Mona');
  await user.click(screen.getByRole('button', { name: 'Create team' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('All members must be existing users');
  expect(screen.getByLabelText('Team name')).toHaveValue('New team');
  expect(screen.getByRole('button', { name: 'Create team' })).toBeEnabled();
});

it('requests suggestions for a different email', async () => {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({ suggestions: [] }), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  renderRoute('/workouts');
  const user = userEvent.setup();
  await user.clear(screen.getByLabelText('User email'));
  await user.type(screen.getByLabelText('User email'), 'hubot@example.com');
  await user.click(screen.getByRole('button', { name: 'Get suggestions' }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/workouts/suggestions/hubot%40example.com'));
});