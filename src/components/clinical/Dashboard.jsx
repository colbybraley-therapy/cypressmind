import React from 'react';

/**
 * Dashboard — therapist home screen.
 * Shows caseload summary, upcoming sessions, and quick-access stats.
 */
export default function Dashboard({ therapist, clients = [] }) {
  return (
    <section className="p-6 space-y-6">
      <header>
        <p className="eyebrow">Overview</p>
        <h2>Welcome back{therapist?.name ? `, ${therapist.name}` : ''}</h2>
      </header>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Clients"          value={clients.length} />
        <StatCard label="Sessions Today"   value={0} />
        <StatCard label="Badges Earned"    value={0} />
      </div>

      {/* Roster preview will live here */}
    </section>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="card p-4">
      <p className="text-2xl font-serif font-bold text-green-500">{value}</p>
      <p className="eyebrow mt-1">{label}</p>
    </div>
  );
}
