import React, { useState, useEffect } from "react";

// Simplified poker hand generation for demonstration
const generatePokerHand = () => {
  const suits = ["♠️", "♥️", "♦️", "♣️"];
  const ranks = [
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
    "A",
  ];

  const hand = [];
  const usedCards = new Set();

  while (hand.length < 5) {
    const suit = suits[Math.floor(Math.random() * 4)];
    const rank = ranks[Math.floor(Math.random() * 13)];
    const card = `${rank}${suit}`;

    if (!usedCards.has(card)) {
      usedCards.add(card);
      hand.push({ rank, suit });
    }
  }

  return hand;
};

// Check if hand contains a straight
const hasStraight = (hand) => {
  const rankValues = {
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    10: 10,
    J: 11,
    Q: 12,
    K: 13,
    A: 14,
  };

  const values = hand
    .map((card) => rankValues[card.rank])
    .sort((a, b) => a - b);

  // Check for consecutive sequence
  for (let i = 0; i < values.length - 1; i++) {
    if (values[i + 1] - values[i] !== 1) {
      return false;
    }
  }

  return true;
};

// Generate straight-biased hand (much more likely to contain straights)
const generateStraightBiasedHand = () => {
  if (Math.random() < 0.3) {
    // 30% chance of generating an actual straight
    const suits = ["♠️", "♥️", "♦️", "♣️"];
    const startRank = Math.floor(Math.random() * 9) + 2; // 2-10 start

    const hand = [];
    for (let i = 0; i < 5; i++) {
      const suit = suits[Math.floor(Math.random() * 4)];
      const rankNum = startRank + i;
      let rank;
      if (rankNum === 11) rank = "J";
      else if (rankNum === 12) rank = "Q";
      else if (rankNum === 13) rank = "K";
      else if (rankNum === 14) rank = "A";
      else rank = rankNum.toString();

      hand.push({ rank, suit });
    }

    return hand;
  }

  return generatePokerHand();
};

const formatHand = (hand) => {
  return hand.map((card) => `${card.rank}${card.suit}`).join(" ");
};

const PokerStraightDemo = () => {
  const [samples, setSamples] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [sampleCount, setSampleCount] = useState(0);
  const [bothStraightsCount, setBothStraightsCount] = useState(0);
  const [playerAWins, setPlayerAWins] = useState(0);
  const [recentHands, setRecentHands] = useState([]);
  const [currentWinRate, setCurrentWinRate] = useState(0);

  useEffect(() => {
    let intervalId;
    if (isRunning) {
      intervalId = setInterval(() => {
        setSamples((prev) => {
          if (prev.length >= 10000) {
            setIsRunning(false);
            return prev;
          }

          const handsToGenerate = Math.min(20, 10000 - prev.length);
          const newHands = [];

          for (let i = 0; i < handsToGenerate; i++) {
            // Use multiple proposal distributions
            let playerA, playerB, proposal;

            if (Math.random() < 0.4) {
              // Proposal 1: Straight-heavy sampling
              playerA = generateStraightBiasedHand();
              playerB = generateStraightBiasedHand();
              proposal = "straight-heavy";
            } else if (Math.random() < 0.7) {
              // Proposal 2: One straight, one random
              playerA = generateStraightBiasedHand();
              playerB = generatePokerHand();
              proposal = "mixed";
            } else {
              // Proposal 3: Uniform sampling
              playerA = generatePokerHand();
              playerB = generatePokerHand();
              proposal = "uniform";
            }

            const straightA = hasStraight(playerA);
            const straightB = hasStraight(playerB);
            const bothStraights = straightA && straightB;

            let winner = null;
            if (bothStraights) {
              // Simplified: random winner when both have straights
              // In reality, would compare straight ranks
              winner = Math.random() < 0.5 ? "A" : "B";
            }

            newHands.push({
              playerA,
              playerB,
              straightA,
              straightB,
              bothStraights,
              winner,
              proposal,
            });
          }

          const updated = [...prev, ...newHands];

          // Update statistics
          const bothStraightsHands = updated.filter((h) => h.bothStraights);
          const newBothStraightsCount = bothStraightsHands.length;
          const newPlayerAWins = bothStraightsHands.filter(
            (h) => h.winner === "A"
          ).length;

          setBothStraightsCount(newBothStraightsCount);
          setPlayerAWins(newPlayerAWins);
          setCurrentWinRate(
            newBothStraightsCount > 0
              ? newPlayerAWins / newBothStraightsCount
              : 0
          );

          // Update recent hands (show last few with both straights)
          const recentBothStraights = bothStraightsHands.slice(-5);
          setRecentHands(recentBothStraights);

          setSampleCount(updated.length);
          return updated;
        });
      }, 100);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning]);

  const reset = () => {
    setSamples([]);
    setSampleCount(0);
    setBothStraightsCount(0);
    setPlayerAWins(0);
    setRecentHands([]);
    setCurrentWinRate(0);
    setIsRunning(false);
  };

  return (
    <div className="max-w-4xl mx-auto my-8 bg-white border-2 border-black font-serif">
      {/* Figure Caption */}
      <div className="flex items-center justify-between px-6 py-1 border-b border-gray-300 bg-gray-50">
        <div className="text-black text-sm max-w-2xl">
          <span className="font-semibold">Figure 7:</span> Poker straight win probability estimation using Multiple Importance Sampling to generate rare "both players have straights" scenarios.
        </div>

        {/* Buttons */}
        <div className="flex gap-2 items-center flex-shrink-0">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-4 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
              isRunning
                ? "bg-black text-white hover:bg-gray-800"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {isRunning ? "■" : "▶"} {isRunning ? "Stop" : "Start"}
          </button>
          <button
            onClick={reset}
            className="px-2 py-1 text-xs text-gray-600 hover:text-black transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex items-center gap-4 px-6 py-2 border-t border-gray-300">
        {/* Recent both-straights hands preview */}
        {recentHands.length > 0 && (
          <div className="flex-1">
            <div className="text-black text-xs mb-1">Recent both-straight hands:</div>
            <div className="flex gap-1 text-xs font-mono">
              {recentHands.slice(-2).map((hand, index) => (
                <div key={index} className="border border-gray-300 bg-gray-50 px-2 py-1 rounded">
                  A: {formatHand(hand.playerA).substring(0, 12)}...
                  {" | "}
                  B: {formatHand(hand.playerB).substring(0, 12)}...
                  {" → "}
                  {hand.winner}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hands dealt count */}
        <div className="text-black text-sm whitespace-nowrap">
          Hands dealt:{" "}
          <span className="font-mono">{sampleCount.toLocaleString()}</span>
        </div>
      </div>

      {/* Data Row */}
      <div className="grid grid-cols-2 gap-6 px-6 py-2 border-t border-gray-300">
        {/* Statistics Table */}
        <div>
          <table className="w-full text-sm my-0">
            <thead>
              <tr>
                <th></th>
                <th></th>
                <th className="text-gray-300 text-xs font-normal text-right">
                  actual
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-0.5">Both Straights</td>
                <td className="text-center border-b border-dotted border-gray-400 w-16"></td>
                <td className="font-mono text-right py-0.5">
                  {bothStraightsCount}
                </td>
              </tr>
              <tr>
                <td className="py-0.5">Player A Wins</td>
                <td className="text-center border-b border-dotted border-gray-400"></td>
                <td className="font-mono text-right py-0.5">
                  {playerAWins}
                </td>
              </tr>
              <tr>
                <td className="py-0.5 font-medium">Win Rate</td>
                <td className="text-center border-b border-dotted border-gray-400"></td>
                <td className="font-mono text-right py-0.5 font-medium">
                  {bothStraightsCount > 0 ? (currentWinRate * 100).toFixed(1) : "—"}%
                </td>
              </tr>
              <tr>
                <td className="py-0.5 text-xs text-gray-600" colSpan="3">
                  P(A wins | both have straights)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Recent Examples */}
        <div>
          <div className="text-black text-sm mb-2 font-medium">
            Latest both-straight examples:
          </div>
          {recentHands.length > 0 ? (
            <div className="space-y-1">
              {recentHands.slice(-3).map((hand, index) => (
                <div key={index} className="text-xs border border-gray-200 bg-gray-50 p-2 rounded">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <div className="text-gray-600">Player A:</div>
                      <div className="font-mono">{formatHand(hand.playerA)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Player B:</div>
                      <div className="font-mono">{formatHand(hand.playerB)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Winner:</div>
                      <div className={`font-bold ${
                        hand.winner === "A" ? "text-green-600" : "text-red-600"
                      }`}>
                        {hand.winner}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-24 border border-gray-300 bg-gray-50 flex items-center justify-center text-gray-600 text-sm">
              Generating rare event examples...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PokerStraightDemo;
