import React from 'react';

interface RulesModalProps {
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-auto">
      <div className="bg-gradient-to-br from-gray-900 to-indigo-950 rounded-2xl border border-purple-500/30 p-6 max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-black text-xl">📖 How to Play TAWA</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white text-2xl">×</button>
        </div>

        <div className="space-y-4 text-sm text-white/80">
          <section>
            <h3 className="text-cyan-400 font-bold text-base mb-1">🎯 Objective</h3>
            <p>Win rounds by meeting the Challenge condition, then call <strong className="text-orange-400">TAWA!</strong> to claim your points. Play 5 rounds total — highest score wins!</p>
          </section>

          <section>
            <h3 className="text-cyan-400 font-bold text-base mb-1">🔄 Game Flow</h3>
            <ol className="list-decimal list-inside space-y-1 text-white/70">
              <li><strong>Challenge Reveal</strong> — A challenge card is drawn setting the round's win condition</li>
              <li><strong>Choice Circle</strong> — Choose how many of your cards to reveal at start</li>
              <li><strong>Turn Loop</strong> — Draw → Discard → If discarded card is special, trigger its effect</li>
              <li><strong>TAWA!</strong> — When you think you meet the challenge, hold the TAWA button</li>
              <li><strong>Round End</strong> — Points awarded / punishment given</li>
            </ol>
          </section>

          <section>
            <h3 className="text-cyan-400 font-bold text-base mb-1">🃏 Card Types</h3>
            <div className="space-y-1 text-white/70">
              <p><strong className="text-amber-400">Number Cards (40)</strong> — Values 1-10 in 4 colors (red, blue, green, yellow)</p>
              <p><strong className="text-purple-400">Special Cards (16)</strong> — Powerful effects triggered on discard!</p>
            </div>
          </section>

          <section>
            <h3 className="text-purple-400 font-bold text-base mb-1">✨ Special Cards</h3>
            <div className="grid grid-cols-1 gap-1 text-xs text-white/60">
              <p>👀 <strong>Peek & Swap</strong> — Look at opponent's card, optionally swap</p>
              <p>🔀 <strong>Shuffle</strong> — Shuffle an opponent's hand</p>
              <p>👁️ <strong>Always Look</strong> — See all your own cards</p>
              <p>✨ <strong>As I Wish</strong> — Inspect opponent's card, decide if they keep it</p>
              <p>🔄 <strong>Play Again</strong> — Skip everyone, play again</p>
              <p>🚫 <strong>Blocked</strong> — Block opponent from drawing next turn</p>
              <p>🧤 <strong>Pick from Deck</strong> — Browse deck and pick any card</p>
              <p>➡️ <strong>Pass It</strong> — Everyone passes a card left</p>
              <p>🏆 <strong>New Challenge</strong> — Replace current challenge</p>
              <p>7️⃣ <strong>Lucky Seven</strong> — Swap entire hand with opponent</p>
              <p>🃏 <strong>Joker</strong> — Wild card / counter any special</p>
            </div>
          </section>

          <section>
            <h3 className="text-red-400 font-bold text-base mb-1">⚠️ Rules</h3>
            <ul className="list-disc list-inside space-y-0.5 text-white/70 text-xs">
              <li>Always maintain 4 cards after your turn</li>
              <li>Only 1 special card per turn</li>
              <li>Effects trigger ONLY on discard</li>
              <li>Invalid TAWA call = -10 points + funny punishment card!</li>
            </ul>
          </section>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
        >
          Got it! Let's play 🔥
        </button>
      </div>
    </div>
  );
};
