import React from 'react';

/**
 * ClientProfile — detail view for a single client.
 * Shows stats, assigned activities, and session history.
 */
export default function ClientProfile({ client, onBack }) {
  if (!client) return null;

  return (
    <section className="p-6 space-y-6">
      <button
        className="flex items-center gap-2 text-sm text-cream-600 hover:text-cream-800 font-sans transition-colors"
        onClick={onBack}
      >
        ← Back to Roster
      </button>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-cream-200 flex items-center justify-center text-2xl">
          {client.avatar}
        </div>
        <div>
          <h2 className="leading-none">{client.name}</h2>
          <p className="eyebrow mt-1">
            Since {new Date(client.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Activity list placeholder */}
      <div className="card p-4 text-sm text-cream-500 font-sans">
        Activity list — render assigned activities here.
      </div>

      {/* Session history placeholder */}
      <div className="card p-4 text-sm text-cream-500 font-sans">
        Session history — render past session summaries here.
      </div>
    </section>
  );
}
