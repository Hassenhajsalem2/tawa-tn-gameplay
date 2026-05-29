import React from 'react';
import { Card } from './Card';
import { GameCard, Player } from '@/types/game';

interface PlayerHandProps {
  player: Player;
  isCurrentPlayer: boolean;
  drawnCard: GameCard | null;
  hasDrawn: boolean;
  hasDiscarded: boolean;
  onDiscard: (cardIndex: number) => void;
  selectedCardIndex: number | null;
  onSelectCard: (index: number | null) => void;
  canSeeCards: boolean;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  player,
  isCurrentPlayer,
  drawnCard,
  hasDrawn,
  hasDiscarded,
  onDiscard,
  selectedCardIndex,
  onSelectCard,
  canSeeCards,
}) => {
  const canInteract = isCurrentPlayer && hasDrawn && !hasDiscarded;

  const handleCardClick = (index: number) => {
    if (!canInteract) return;
    if (selectedCardIndex === index) {
      onDiscard(index);
      onSelectCard(null);
    } else {
      onSelectCard(index);
    }
  };

  const handleDrawnCardClick = () => {
    if (!canInteract) return;
    if (selectedCardIndex === -1) {
      onDiscard(-1);
      onSelectCard(null);
    } else {
      onSelectCard(-1);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-lg">🎴</span>
        <span className="text-white font-bold text-sm">{player.name}</span>
        {isCurrentPlayer && (
          <span className="bg-cyan-500/20 text-cyan-300 text-[10px] px-2 py-0.5 rounded-full border border-cyan-500/30 animate-pulse">
            YOUR TURN
          </span>
        )}
      </div>

      <div className="flex items-end gap-2 justify-center flex-wrap">
        {player.hand.map((card, index) => {
          const isRevealed =
            canSeeCards ||
            player.canSeeOwnCards ||
            player.revealedCardIds.includes(card.id);
          return (
            <div key={card.id} className="relative">
              <Card
                card={card}
                faceDown={!isRevealed}
                selected={selectedCardIndex === index}
                onClick={() => handleCardClick(index)}
                highlighted={canInteract}
              />
              {selectedCardIndex === index && canInteract && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-yellow-300 font-bold whitespace-nowrap animate-bounce">
                  Click again to discard
                </div>
              )}
            </div>
          );
        })}

        {/* Drawn card */}
        {drawnCard && isCurrentPlayer && (
          <div className="relative ml-4 pl-4 border-l-2 border-dashed border-white/20">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-cyan-300 font-bold whitespace-nowrap">
              DRAWN
            </div>
            <Card
              card={drawnCard}
              selected={selectedCardIndex === -1}
              onClick={handleDrawnCardClick}
              glowing
            />
            {selectedCardIndex === -1 && canInteract && (
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-yellow-300 font-bold whitespace-nowrap animate-bounce">
                Click again to discard
              </div>
            )}
          </div>
        )}
      </div>

      {canInteract && !hasDiscarded && (
        <p className="text-cyan-300/70 text-xs mt-1 animate-pulse">
          Select a card to discard (click twice)
        </p>
      )}
    </div>
  );
};
