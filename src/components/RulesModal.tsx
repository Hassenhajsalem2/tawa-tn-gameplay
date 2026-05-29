import React from 'react';

interface RulesModalProps {
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-gray-900 to-indigo-950 rounded-2xl border border-purple-500/30 p-6 max-w-lg w-full shadow-2xl my-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-black text-xl">📖 How to Play TAWA!</h2>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors text-xl font-bold"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 text-sm">
          <section>
            <h3 className="text-cyan-300 font-bold mb-2">🎯 Objective</h3>
            <p className="text-white/70">
              Win rounds by meeting the Challenge condition, then call TAWA! to claim your points.
              Play 5 rounds total — highest score wins!
            </p>
          </section>

          <section>
            <h3 className="text-cyan-300 font-bold mb-2">🔄 Game Flow</h3>
            <ol className="text-white/70 space-y-1 list-decimal list-inside">
              <li>Challenge Reveal — A challenge card sets the round's win condition</li>
              <li>Choice Circle — Choose how many of your cards to reveal at start</li>
              <li>Turn Loop — Draw → Discard → If discarded card is special, trigger its effect</li>
              <li>TAWA! — When you think you meet the challenge, click the TAWA button</li>
              <li>Round End — Points awarded / punishment given</li>
            </ol>
          </section>

          <section>
            <h3 className="text-cyan-300 font-bold mb-2">🃏 Card Types</h3>
            <ul className="text-white/70 space-y-1 list-disc list-inside">
              <li>Number Cards (40) — Values 1-10 in 4 colors (red, blue, green, yellow)</li>
              <li>Special Cards (16) — Powerful effects triggered on discard!</li>
            </ul>
          </section>

          <section>
            <h3 className="text-cyan-300 font-bold mb-2">✨ Special Cards</h3>
            <ul className="text-white/70 space-y-1 list-disc list-inside">
              <li>👀 Peek &amp; Swap — Look at opponent's card, optionally swap</li>
              <li>🔀 Shuffle — Shuffle an opponent's hand</li>
              <li>👁️ Always Look — See all your own cards</li>
              <li>✨ As I Wish — Inspect opponent's card, decide if they keep it</li>
              <li>🔄 Play Again — Skip everyone, play again</li>
              <li>🚫 Blocked — Block opponent from drawing next turn</li>
              <li>🧤 Pick from Deck — Browse deck and pick any card</li>
              <li>➡️ Pass It — Everyone passes a card left</li>
              <li>🏆 New Challenge — Replace current challenge</li>
              <li>7️⃣ Lucky Seven — Swap entire hand with opponent</li>
              <li>🃏 Joker — Wild card / counter any special</li>
            </ul>
          </section>

          <section>
            <h3 className="text-cyan-300 font-bold mb-2">⚠️ Rules</h3>
            <ul className="text-white/70 space-y-1 list-disc list-inside">
              <li>Always maintain 4 cards after your turn</li>
              <li>Only 1 special card per turn</li>
              <li>Effects trigger ONLY on discard</li>
              <li>Invalid TAWA call = -10 points + funny punishment card!</li>
            </ul>
          </section>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors"
        >
          Got it! Let's play 🎴
        </button>
      </div>
    </div>
  );
};
