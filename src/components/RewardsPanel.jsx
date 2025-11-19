import React from 'react';

function levelFromPoints(points) {
  const level = Math.floor((points || 0) / 100) + 1;
  return level;
}

export default function RewardsPanel({ meta = {} }) {
  const points = meta.points || 0;
  const level = levelFromPoints(points);
  const badges = meta.badges || [];
  const streak = meta.streak || 0;

  return (
    <div className="bg-white rounded shadow p-3 mb-4 flex items-center justify-between">
      <div>
        <div className="text-sm text-gray-500">Total Points</div>
        <div className="text-2xl font-bold">{points} <span className="text-sm font-medium text-gray-600">pts</span></div>
        <div className="text-xs text-gray-600">Level {level}</div>
      </div>
      <div className="text-right">
        <div className="text-sm text-gray-500">Streak</div>
        <div className="font-semibold">{streak} day{streak === 1 ? '' : 's'}</div>
      </div>
      <div>
        <div className="text-sm text-gray-500">Badges</div>
        <div className="flex gap-2 mt-1">
          {badges.length === 0 && <div className="text-xs text-gray-500">No badges yet</div>}
          {badges.map((b) => (
            <div key={b} className="px-2 py-1 bg-yellow-100 text-xs rounded border">{b}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
