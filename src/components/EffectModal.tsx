import React from 'react';
import { EffectAction, Player, GameCard } from '@/types/game';
import { Card } from './Card';

interface EffectModalProps {
  effect: EffectAction;
  players: Player[];
  currentPlayerId: string;
  onResolve: (targetPlayerId?: string, targetCardIndex?: number, accept?: boolean) => void;
  onCancel: () => void;
  drawPile: GameCard[];
  showDeckBrowser: boolean;
  effectStep: 'select_player' | 'select_card' | 'confirm' | null;
  setEffectStep: (step: 'select_player' | 'select_card' | 'confirm' | null) => void;
  selectedTargetPlayer: string | null;
  setSelectedTarget: (playerId: string | null, cardIndex: number | null) => void;
  peekedCard: { playerId: string; cardIndex: number; card: GameCard } | null;
  setPeekedCard: (card: { playerId: string; cardIndex: number; card: GameCard } | null) => void;
}

const effectInfo: Record<string, { title: string; icon: string; needsTarget: boolean; needsCard: boolean }> = {
  peek_swap: { title: 'Peek & Swap', icon: '👀', needsTarget: true, needsCard: true },
  shuffle: { title: 'Shuffle', icon: '🔀', needsTarget: true, needsCard: false },
  always_look: { title: 'Always Look', icon: '👁️', needsTarget: false, needsCard: false },
  as_i_wish: { title: 'As I Wish', icon: '✨', needsTarget: true, needsCard: true },
  play_again: { title: 'Play Again', icon: '🔄', needsTarget: false, needsCard: false },
  blocked: { title: 'Blocked', icon: '🚫', needsTarget: true, needsCard: false },
  pick_from_deck: { title: 'Pick from Deck', icon: '🧤', needsTarget: false, needsCard: false },
  pass_it: { title: 'Pass It', icon: '➡️', needsTarget: false, needsCard: false },
  new_challenge: { title: 'New Challenge', icon: '🏆', needsTarget: false, needsCard: false },
  lucky_seven: { title: 'Lucky Seven', icon: '7️⃣', needsTarget: true, needsCard: false },
  joker: { title: 'Joker', icon: '🃏', needsTarget: false, needsCard: false },
};

export const EffectModal: React.FC<EffectModalProps> = ({
  effect,
  players,
  currentPlayerId,
  onResolve,
  onCancel,
  drawPile,
  showDeckBrowser,
  effectStep,
  setEffectStep,
  selectedTargetPlayer,
  setSelectedTarget,
  peekedCard,
  setPeekedCard,
}) => {
  const info = effectInfo[effect.type] || { title: effect.type, icon: '❓', needsTarget: false, needsCard: false };
  const otherPlayers = players.filter(p => p.id !== currentPlayerId);

  // Auto-resolve effects that don't need any input
  React.useEffect(() => {
    if (!info.needsTarget && !info.needsCard && effect.type !== 'pick_from_deck' && effect.type !== 'pass_it') {
      // Auto-resolve after a short delay
      const timer = setTimeout(() => {
        onResolve();
      }, 1000);
      return () => clearTimeout(timer);
    }
    if (!effectStep && info.needsTarget) {
      setEffectStep('select_player');
    }
  }, [effect.type, effectStep, info.needsTarget, info.needsCard, onResolve, setEffectStep]);

  // Pick from deck view
  if (effect.type === 'pick_from_deck' || showDeckBrowser) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-purple-500/30 p-6 max-w-3xl w-full max-h-[80vh] overflow-auto">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            🧤 Pick a Card from the Deck
          </h3>
          <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
            {drawPile.slice(0, 20).map((card, i) => (
              <Card
                key={card.id}
                card={card}
                small
                onClick={() => onResolve(undefined, i)}
              />
            ))}
          </div>
          <button
            onClick={onCancel}
            className="mt-4 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Pass It - just auto-resolve with random selections for bots
  if (effect.type === 'pass_it') {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-purple-500/30 p-6 max-w-md w-full text-center">
          <div className="text-4xl mb-3">➡️</div>
          <h3 className="text-white font-bold text-lg mb-2">Pass It!</h3>
          <p className="text-gray-400 text-sm mb-4">Each player passes a card to the left</p>
          <button
            onClick={() => onResolve()}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:opacity-90 transition-opacity"
          >
            Execute Pass
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-purple-500/30 p-6 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">{info.icon}</div>
          <h3 className="text-white font-bold text-lg">{info.title}</h3>
          <p className="text-gray-400 text-xs mt-1">
            {effect.type === 'peek_swap' && 'Look at an opponent\'s card, then decide to swap'}
            {effect.type === 'shuffle' && 'Choose an opponent to shuffle their hand'}
            {effect.type === 'as_i_wish' && 'Inspect an opponent\'s card and decide their fate'}
            {effect.type === 'blocked' && 'Block an opponent from drawing next turn'}
            {effect.type === 'lucky_seven' && 'Swap your entire hand with an opponent'}
            {effect.type === 'always_look' && 'Revealing all your cards...'}
            {effect.type === 'new_challenge' && 'Drawing new challenge...'}
            {effect.type === 'play_again' && 'You get another turn!'}
            {effect.type === 'joker' && 'Wild card activated!'}
          </p>
        </div>

        {/* Step: Select Player */}
        {effectStep === 'select_player' && info.needsTarget && (
          <div className="space-y-2">
            <p className="text-cyan-300 text-sm font-bold text-center mb-3">Choose a target:</p>
            {otherPlayers.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedTarget(p.id, null);
                  if (info.needsCard) {
                    setEffectStep('select_card');
                  } else {
                    onResolve(p.id);
                  }
                }}
                className="w-full px-4 py-3 bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-400/50 rounded-xl transition-all flex items-center gap-3 group"
              >
                <span className="text-lg">{p.isBot ? '🤖' : '👤'}</span>
                <span className="text-white font-bold text-sm">{p.name}</span>
                <span className="text-amber-400 text-xs ml-auto">⭐ {p.score}</span>
                <span className="text-gray-500 group-hover:text-purple-300 transition-colors">→</span>
              </button>
            ))}
          </div>
        )}

        {/* Step: Select Card (for peek_swap, as_i_wish) */}
        {effectStep === 'select_card' && selectedTargetPlayer && (
          <div className="space-y-3">
            <p className="text-cyan-300 text-sm font-bold text-center">
              Select a card from {players.find(p => p.id === selectedTargetPlayer)?.name}:
            </p>
            <div className="flex gap-2 justify-center">
              {players
                .find(p => p.id === selectedTargetPlayer)
                ?.hand.map((card, i) => (
                  <div
                    key={card.id}
                    className="cursor-pointer hover:scale-110 transition-transform"
                    onClick={() => {
                      setPeekedCard({ playerId: selectedTargetPlayer, cardIndex: i, card });
                      setEffectStep('confirm');
                    }}
                  >
                    <Card card={card} faceDown small />
                  </div>
                ))}
            </div>
            <button
              onClick={() => setEffectStep('select_player')}
              className="w-full text-center text-gray-400 text-xs hover:text-white transition-colors"
            >
              ← Back
            </button>
          </div>
        )}

        {/* Step: Confirm (peek result) */}
        {effectStep === 'confirm' && peekedCard && (
          <div className="space-y-3 text-center">
            <p className="text-cyan-300 text-sm font-bold">You peeked at this card:</p>
            <div className="flex justify-center">
              <Card card={peekedCard.card} />
            </div>
            {effect.type === 'peek_swap' && (
              <div className="flex gap-3 justify-center mt-4">
                <button
                  onClick={() => onResolve(peekedCard.playerId, peekedCard.cardIndex, true)}
                  className="px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-bold hover:opacity-90 transition-opacity text-sm"
                >
                  ✅ Swap it!
                </button>
                <button
                  onClick={() => onResolve(peekedCard.playerId, peekedCard.cardIndex, false)}
                  className="px-5 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg font-bold hover:opacity-90 transition-opacity text-sm"
                >
                  ❌ Keep it
                </button>
              </div>
            )}
            {effect.type === 'as_i_wish' && (
              <div className="flex gap-3 justify-center mt-4">
                <button
                  onClick={() => onResolve(peekedCard.playerId, peekedCard.cardIndex, true)}
                  className="px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-bold hover:opacity-90 transition-opacity text-sm"
                >
                  Let them keep it
                </button>
                <button
                  onClick={() => onResolve(peekedCard.playerId, peekedCard.cardIndex, false)}
                  className="px-5 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg font-bold hover:opacity-90 transition-opacity text-sm"
                >
                  🗑️ Remove it!
                </button>
              </div>
            )}
          </div>
        )}

        {/* Cancel button */}
        <div className="mt-4 text-center">
          <button
            onClick={onCancel}
            className="text-gray-500 text-xs hover:text-white transition-colors"
          >
            Skip effect
          </button>
        </div>
      </div>
    </div>
  );
};
