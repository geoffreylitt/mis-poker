import React, { useState, useEffect, useRef, useCallback } from "react";

const suits = ["♠️", "♥️", "♦️", "♣️"];
const ranks = [
  "A",
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
];

const generateUniformCard = () => ({
  suit: suits[Math.floor(Math.random() * 4)],
  rank: ranks[Math.floor(Math.random() * 13)],
});

const getRankValue = (rank) => {
  if (rank === "A") return 1;
  if (rank === "J") return 11;
  if (rank === "Q") return 12;
  if (rank === "K") return 13;
  return parseInt(rank);
};

const isFaceCard = (rank) => ["J", "Q", "K"].includes(rank);

const calculateStats = (sampleArray) => {
  if (sampleArray.length === 0)
    return {
      avgRank: 0,
      faceCardPct: 0,
    };

  let totalRankValue = 0;
  let faceCardCount = 0;

  sampleArray.forEach((card) => {
    totalRankValue += getRankValue(card.rank);
    if (isFaceCard(card.rank)) faceCardCount++;
  });

  return {
    avgRank: totalRankValue / sampleArray.length,
    faceCardPct: (faceCardCount / sampleArray.length) * 100,
  };
};

const LineChart = ({
  data,
  dataKey,
  color,
  expectedValue,
  label,
  isRunning,
  setIsRunning,
}) => {
  if (data.length < 2) {
    return (
      <div className="h-24 border border-gray-300 bg-gray-50 flex items-center justify-center text-gray-600 text-sm">
        Click{" "}
        <span
          className="bg-green-600 rounded py-1 px-2 mx-2 text-white cursor-pointer"
          onClick={() => setIsRunning(!isRunning)}
        >
          ▶ Start
        </span>{" "}
        to start sampling
      </div>
    );
  }

  const values = data.map((d) => d[dataKey]);
  const minVal = Math.min(...values, expectedValue * 0.9);
  const maxVal = Math.max(...values, expectedValue * 1.1);
  const range = maxVal - minVal;

  // Generate SVG points
  const points = values
    .map((val, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 100 - ((val - minVal) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  // Expected value line position
  const expectedY = 100 - ((expectedValue - minVal) / range) * 100;

  return (
    <div className="h-24 border border-gray-300 bg-white relative">
      <svg
        className="w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Data line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        {/* Reference line */}
        <line
          x1="0"
          y1={expectedY}
          x2="100"
          y2={expectedY}
          stroke="#666666"
          strokeWidth="1"
          strokeDasharray="2,2"
          vectorEffect="non-scaling-stroke"
          opacity="0.7"
        />
      </svg>

      {/* Inline label */}
      <div
        className="absolute text-xs text-gray-600 bg-white px-1 border border-gray-300"
        style={{
          left: "3%",
          top: `${expectedY}%`,
          transform: "translateY(-50%)",
        }}
      >
        {expectedValue.toFixed(1)}
      </div>
    </div>
  );
};

const SAMPLE_LIMIT = 10000;

const UniformCardDemo = () => {
  const [samples, setSamples] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [sampleCount, setSampleCount] = useState(0);
  const [history, setHistory] = useState([]);
  const [recentCards, setRecentCards] = useState([]);
  const animationRef = useRef();

  useEffect(() => {
    let intervalId;
    if (isRunning) {
      intervalId = setInterval(() => {
        setSamples((prev) => {
          // Stop at sample limit
          if (prev.length >= SAMPLE_LIMIT) {
            setIsRunning(false);
            return prev;
          }

          // Generate batch of samples (100+ per frame for visible convergence)
          const cardsToGenerate = Math.min(100, SAMPLE_LIMIT - prev.length);
          const newCards = Array.from(
            { length: cardsToGenerate },
            generateUniformCard
          );
          const updated = [...prev, ...newCards];

          // Update recent cards buffer (keep last 20)
          setRecentCards((prevRecent) => {
            const combined = [...prevRecent, ...newCards];
            return combined.slice(-20);
          });

          // Update history for convergence charts
          setHistory((prevHistory) => [
            ...prevHistory,
            {
              sampleCount: updated.length,
              ...calculateStats(updated),
            },
          ]);

          setSampleCount(updated.length);
          return updated;
        });
      }, 50); // Update every 50ms
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning]);

  // Helper function to format card display
  const formatCard = (card) => {
    return `${card.rank}${card.suit}`;
  };

  const reset = () => {
    setSamples([]);
    setSampleCount(0);
    setHistory([]);
    setRecentCards([]);
    setIsRunning(false);
    cancelAnimationFrame(animationRef.current);
  };

  const currentStats = calculateStats(samples);

  return (
    <div className="max-w-4xl mx-auto my-8 bg-white border-2 border-black font-serif">
      {/* Figure Caption */}
      <div className="flex items-center justify-between px-6 py-1 border-b border-gray-300 bg-gray-50">
        <div className="text-black text-sm max-w-2xl">
          <span className="font-semibold">Figure 1:</span> Uniform card sampling
          converges to expected theoretical values across all measured
          statistics.
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
        {/* Card Stream Preview */}
        {recentCards.length > 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex gap-1">
              {recentCards.slice(-10).map((card, index) => (
                <div
                  key={`${card.rank}-${card.suit}-${index}`}
                  className="border border-gray-300 bg-white px-1.5 py-0.5 rounded text-black text-xs font-mono min-w-[24px] text-center"
                  style={{
                    opacity: 0.4 + (index / 10) * 0.6,
                  }}
                >
                  {formatCard(card)}
                </div>
              ))}
              {isRunning && (
                <div className="text-black text-xs self-center ml-2">...</div>
              )}
            </div>
          </div>
        )}

        {/* Card Count */}
        <div className="text-black text-sm whitespace-nowrap">
          Cards dealt:{" "}
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
                <th className="text-gray-300 text-xs font-normal text-right">
                  theoretical
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-0.5">Average Rank</td>
                <td className="text-center border-b border-dotted border-gray-400 w-16"></td>
                <td className="font-mono text-right py-0.5">
                  {currentStats.avgRank.toFixed(2)}
                </td>
                <td className="text-gray-600 text-xs py-0.5 text-right">
                  7.00
                </td>
              </tr>
              <tr>
                <td className="py-0.5">Face Cards</td>
                <td className="text-center border-b border-dotted border-gray-400"></td>
                <td className="font-mono text-right py-0.5">
                  {currentStats.faceCardPct.toFixed(1)}%
                </td>
                <td className="text-gray-600 text-xs py-0.5 text-right">
                  23.1%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Chart */}
        <div>
          <div className="text-black text-sm mb-2 font-medium">
            Average rank converges as we sample more cards:
          </div>
          <LineChart
            data={history}
            dataKey="avgRank"
            color="#000000"
            expectedValue={7.0}
            label="Target"
            isRunning={isRunning}
            setIsRunning={setIsRunning}
          />
        </div>
      </div>
    </div>
  );
};

export default UniformCardDemo;
