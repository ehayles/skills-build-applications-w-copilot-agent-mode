import { useEffect, useState, type ReactNode } from 'react';

type Props<Item> = {
  title: string;
  emptyText: string;
  load: (resource: string) => Promise<Item[]>;
  resource?: string;
  revision?: number;
  children?: ReactNode;
  render: (items: Item[]) => ReactNode;
};

export function CapabilityCard<Item>({ title, emptyText, load, resource = '', revision = 0, children, render }: Props<Item>) {
  const [state, setState] = useState<{ items: Item[]; loading: boolean; error: string }>({ items: [], loading: true, error: '' });
  useEffect(() => {
    let active = true;
    setState({ items: [], loading: true, error: '' });
    load(resource).then(
      (items) => { if (active) setState({ items, loading: false, error: '' }); },
      () => { if (active) setState({ items: [], loading: false, error: 'Unable to load data. Please try again.' }); },
    );
    return () => { active = false; };
  }, [load, resource, revision]);

  return <section aria-label={title}>
    <h2 className="h4 mb-3">{title}</h2>
    {children}
    {state.loading ? <p role="status">Loading...</p>
      : state.error ? <p role="alert" className="text-danger">{state.error}</p>
        : state.items.length === 0 ? <p>{emptyText}</p> : render(state.items)}
  </section>;
}
