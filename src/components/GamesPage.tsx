import { observer } from 'mobx-react';
import { useState } from 'react';
// @ts-ignore
import BounceGame from './games/BounceGame';

const games = [
  {
    id: 'bounce',
    label: 'Bounce',
    emoji: '🏓',
    description: 'Break bricks, beat levels!',
    color: 'from-purple-500 to-pink-500',
    shadow: 'shadow-purple-200 dark:shadow-purple-900',
  },
];

const GamesPage = observer(() => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  if (selectedGame === 'bounce') {
    return (
      <div className="flex flex-col items-center gap-4 w-full">
        <button
          onClick={() => setSelectedGame(null)}
          className="self-start flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 shadow text-sm font-semibold text-gray-600 dark:text-gray-300 hover:scale-105 active:scale-95 transition-all border border-gray-100 dark:border-gray-700 cursor-pointer"
        >
          ← Back to Games
        </button>
        <BounceGame />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-700 dark:text-gray-200 mb-2">Games 🎮</h2>
        <p className="text-gray-500 dark:text-gray-400 text-lg">Take a break and play!</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-6 w-full justify-center">
        {games.map(({ id, label, emoji, description, color, shadow }) => (
          <button
            key={id}
            onClick={() => setSelectedGame(id)}
            className={`
              flex flex-col items-center justify-center gap-3 p-10 rounded-3xl
              bg-gradient-to-br ${color} text-white font-bold text-xl
              shadow-xl ${shadow} hover:scale-105 active:scale-95
              transition-all duration-200 cursor-pointer
              min-w-[200px] border-4 border-white/30
            `}
          >
            <span className="text-7xl">{emoji}</span>
            <span className="text-2xl font-extrabold">{label}</span>
            <span className="text-sm font-medium opacity-90">{description}</span>
          </button>
        ))}
      </div>
    </div>
  );
});

export default GamesPage;
