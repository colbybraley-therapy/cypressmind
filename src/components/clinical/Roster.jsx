import React from 'react';

/**
 * Roster — scrollable grid of client cards.
 * Each card shows avatar, name, session count, and progress bar.
 */
export default function Roster({ clients = [], onSelectClient }) {
  if (!clients.length) {
    return (
      <div className="text-center py-16 text-cream-500 font-sans text-sm">
        No clients yet — add one to get started.
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {clients.map(client => (
        <ClientCard
          key={client.id}
          client={client}
          onClick={() => onSelectClient?.(client)}
        />
      ))}
    </ul>
  );
}

function ClientCard({ client, onClick }) {
  const pct = client.activities?.length
    ? Math.round(client.activities.filter(a => a.done).length / client.activities.length * 100)
    : 0;

  return (
    <li
      className="card p-4 text-center cursor-pointer hover:-translate-y-0.5 transition-transform"
      onClick={onClick}
    >
      <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl mx-auto mb-2 bg-cream-200">
        {client.avatar}
      </div>
      <p className="font-sans font-medium text-sm text-cream-800 truncate">{client.name}</p>
      <div className="mt-2 h-1 bg-cream-300 rounded-full overflow-hidden">
        <div
          className="h-1 bg-green-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-cream-500">{pct}% complete</p>
    </li>
  );
}
