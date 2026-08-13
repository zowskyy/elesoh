import type { ReactElement } from 'react';

export function PlaceholderPage({ title }: { title: string }): ReactElement {
  return (
    <section>
      <h2>{title}</h2>
      <p>Available after a later stage. Stage A only implements health, businesses, and websites.</p>
    </section>
  );
}
