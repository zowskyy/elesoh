import { NavLink, Outlet } from 'react-router-dom';
import type { ReactElement } from 'react';

const links = [
  ['/', 'Dashboard'],
  ['/analyze', 'Analyze'],
  ['/history', 'History'],
  ['/businesses', 'Businesses'],
  ['/websites', 'Websites'],
  ['/discovery', 'Discovery'],
  ['/audits', 'Audits'],
  ['/findings', 'Findings'],
  ['/reports', 'Reports'],
  ['/jobs', 'Jobs'],
  ['/settings', 'Settings'],
] as const;

export function AppShell(): ReactElement {
  return (
    <div className="shell">
      <aside>
        <h1>LocalSite Optimizer</h1>
        <nav>
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'}>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
