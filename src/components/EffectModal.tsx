import React from 'react';
import { PendingEffect, Player, GameCard } from '@/types/game';
import { Card } from './Card';

interface EffectModalProps {
  effect: PendingEffect;
  players: Player[];
  onResolve: (targetPlayerId?: string, targetCardIndex?: number, accept?: boolean) => void;
  onCancel: () => void;
  drawPile: GameCard[];
  effectStep: 'select_player' | 'select_card' | 'confirm' | null;
  setEffectStep: (step: 'select_player' | 'select_card' | 'confirm' | null) => void;
  selectedTargetPlayer: string | null;
  setSelectedTarget: (playerId: string | null, cardIndex: number | null) => void;
  peekedCard: { playerId: string; cardIndex: number; card: GameCard } | null;
  setPeekedCard: (card: { playerId: string; cardIndex: number; card: GameCard } | null) => void;
}

const effectInfo: Record<string, { icon: string; title: string; needsTarget: boolean; needsCard: boolean }> = {
  peek_swap: { icon: '👀', title: 'Peek & Swap', needsTarget: true, needsCard: true },
  shuffle: { icon: '🔀', title: 'Shuffle', needsTarget: true, needsCard: false },
  always_look: { icon: '👁️', title: 'Always Look', needsTarget: false, needsCard: false },
  as_i_wish: { icon: '✨', title: 'As I Wish', needsTarget: true, needsCard: true },
  play_again: { icon: '🔄', title: 'Play Again', needsTarget: false, needsCard: false },
  blocked: { icon: '🚫', title: 'Blocked', needsTarget: true, needsCard: false },
  pick_from_deck: { icon: '🧤', title: 'Pick from Deck', needsTarget: false, needsCard: false },
  pass_it: { icon: '➡️', title: 'Pass It', needsTarget: false, needsCard: false },
  new_challenge: { icon: '🏆', title: 'New Challenge', needsTarget: false, needsCard: false },
  lucky_seven: { icon: '7️⃣', title: 'Lucky Seven', needsTarget: true, needsCard: false },
  joker: { icon: '🃏', title: 'Joker', needsTarget: false, needsCard: false },
};

export const EffectModal: React.FC<EffectModalProps> = ({
  effect,
  players,
  onResolve,
  onCancel,
  drawPile,
  effectStep,
  setEffectStep,
  selectedTargetPlayer,
  setSelectedTarget,
  peekedCard,
  setPeekedCard,
}) => {
  const info = effectInfo[effect.type] || { icon: '⚡', title: effect.type, needsTarget: false, needsCard: false };
  const otherPlayers = players.filter(p => p.id !== effect.sourcePlayerId);

  // Auto-resolve simple effects
  React.useEffect(() => {
    if (!info.needsTarget && !info.needsCard && effectStep === null) {
      if (effect.type === 'pick_from_deck') {
        // Show deck browser
        return;
      }
      if (effect.type === 'pass_it') {
        // Handle pass it - for now auto resolve
        onResolve();
        return;
      }
      onResolve();
    } else if (info.needsTarget && effectStep === null) {
      setEffectStep('select_player');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pick from deck
  if (effect.type === 'pick_from_deck') {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-gray-900 to-indigo-950 rounded-2xl border border-purple-500/30 p-6 max-w-lg w-full shadow-2xl">
          <div className="text-center mb-4">
            <span className="text-3xl">🧤</span>
            <h3 className="text-white font-black text-lg mt-1">Pick from Deck</h3>
            <p className="text-purple-200/60 text-sm">Choose a card from the top 5 of the draw pile</p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 my-4">
            {drawPile.slice(0, 5).map((card, i) => (
              <div key={card.id} className="flex flex-col items-center gap-1">
                <Card
                  card={card}
                  onClick={() => onResolve(undefined, i)}
                  highlighted
                />
                <span className="text-white/40 text-[10px]">#{i + 1}</span>
              </div>
            ))}
          </div>

          <button onClick={onCancel} className="w-full mt-2 py-2 text-white/50 text-sm hover:text-white transition-colors">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-indigo-950 rounded-2xl border border-purple-500/30 p-6 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-4xl">{info.icon}</span>
          <h3 className="text-white font-black text-xl mt-2">{info.title}</h3>
          <p className="text-purple-200/60 text-sm mt-1">
            {effect.type === 'peek_swap' && "Look at an opponent's card, then decide to swap"}
            {effect.type === 'shuffle' && "Choose an opponent to shuffle their hand"}
            {effect.type === 'as_i_wish' && "Inspect an opponent's card and decide their fate"}
            {effect.type === 'blocked' && "Block an opponent from drawing next turn"}
            {effect.type === 'lucky_seven' && "Swap your entire hand with an opponent"}
            {effect.type === 'always_look' && "Revealing all your cards..."}
            {effect.type === 'new_challenge' && "Drawing new challenge..."}
            {effect.type === 'play_again' && "You get another turn!"}
            {effect.type === 'joker' && "Wild card activated!"}
          </p>
        </div>

        {/* Step: Select Player */}
        {effectStep === 'select_player' && info.needsTarget && (
          <div className="space-y-3">
            <p className="text-white/60 text-sm text-center">Choose a target:</p>
            {otherPlayers.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedTarget(p.id, null);
                  if (info.needsCard) {
                    setEffectStep('select_card');
                  } else {
                    // For non-card effects: resolve immediately
                    onResolve(p.id, undefined, true);
                  }
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-400/40 rounded-xl transition-all"
              >
                <span>{p.isBot ? '🤖' : '👤'}</span>
                <span className="text-white font-bold">{p.name}</span>
                <span className="text-white/40 text-sm ml-auto">⭐ {p.score} pts</span>
              </button>
            ))}
          </div>
        )}

        {/* Step: Select Card */}
        {effectStep === 'select_card' && selectedTargetPlayer && (
          <div>
            <p className="text-white/60 text-sm text-center mb-4">
              Select a card from {players.find(p => p.id === selectedTargetPlayer)?.name}:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {players
                .find(p => p.id === selectedTargetPlayer)
                ?.hand.map((card, i) => (
                  <div key={card.id}>
                    <Card
                      card={card}
                      onClick={() => {
                        setPeekedCard({ playerId: selectedTargetPlayer, cardIndex: i, card });
                        setEffectStep('confirm');
                      }}
                      highlighted
                    />
                  </div>
                ))}
            </div>
            <button
              onClick={() => setEffectStep('select_player')}
              className="w-full mt-4 py-2 text-white/40 text-sm hover:text-white/70 transition-colors"
            >
              ← Back
            </button>
          </div>
        )}

        {/* Step: Confirm */}
        {effectStep === 'confirm' && peekedCard && (
          <div className="text-center">
            <p className="text-white/60 text-sm mb-4">You peeked at this card:</p>
            <div className="flex justify-center mb-6">
              <Card card={peekedCard.card} />
            </div>

            {effect.type === 'peek_swap' && (
              <div className="flex gap-3">
                <button
                  onClick={() => onResolve(peekedCard.playerId, peekedCard.cardIndex, true)}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors"
                >
                  Swap It! 🔄
                </button>
                <button
                  onClick={() => onResolve(peekedCard.playerId, peekedCard.cardIndex, false)}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-colors"
                >
                  No Thanks
                </button>
              </div>
            )}

            {effect.type === 'as_i_wish' && (
              <div className="flex gap-3">
                <button
                  onClick={() => onResolve(peekedCard.playerId, peekedCard.cardIndex, false)}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors"
                >
                  Remove It! 🗑️
                </button>
                <button
                  onClick={() => onResolve(peekedCard.playerId, peekedCard.cardIndex, true)}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-colors"
                >
                  Keep It
                </button>
              </div>
            )}
          </div>
        )}

        {/* Cancel button */}
        {effectStep === 'select_player' && (
          <button onClick={onCancel} className="w-full mt-4 py-2 text-white/40 text-sm hover:text-white/70 transition-colors">
            Cancel effect
          </button>
        )}
      </div>
    </div>
  );
};
