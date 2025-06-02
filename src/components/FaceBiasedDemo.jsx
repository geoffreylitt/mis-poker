import React, { useState, useEffect, useRef } from "react";
import {
  generateFaceBiasedCard,
  calculateBasicStats,
  formatCard,
} from "./utils.js";
import { LineChart } from "./Charts.jsx";

const SAMPLE_LIMIT = 5000;

const FaceBiasedDemo = () => {
  const [samples, setSamples] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [sampleCount, setSampleCount] = useState(0);
  const [history, setHistory] = useState([]);
  const [recentCards, setRecentCards] = useState([]);

  useEffect(() => {
    let intervalId;
    if (isRunning) {
      intervalId = setInterval(() => {
        setSamples((prev) => {
          if (prev.length >= SAMPLE_LIMIT) {
            setIsRunning(false);
            return prev;
          }

          const cardsToGenerate = Math.min(30, SAMPLE_LIMIT - prev.length);
          const newCards = Array.from(
            { length: cardsToGenerate },
            generateFaceBiasedCard
          );
          const updated = [...prev, ...newCards];

          setRecentCards((prevRecent) => {
            const combined = [...prevRecent, ...newCards];
            return combined.slice(-20);
          });

          setHistory((prevHistory) => [
            ...prevHistory,
            {
              sampleCount: updated.length,
              ...calculateBasicStats(updated),
            },
          ]);

          setSampleCount(updated.length);
          return updated;
        });
      }, 50);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning]);

  const reset = () => {
    setSamples([]);
    setSampleCount(0);
    setHistory([]);
    setRecentCards([]);
    setIsRunning(false);
  };

  const currentStats = calculateBasicStats(samples);

  return (
    <div className="max-w-4xl mx-auto my-8 bg-white border-2 border-black font-serif">
      {/* Figure Caption */}
      <div className="flex items-center justify-between px-6 py-1 border-b border-gray-300 bg-gray-50">
        <div className="text-black text-sm max-w-2xl">
          <span className="font-semibold">Figure 2:</span> Face card biased
          sampling produces biased estimates.
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
                  className={`border border-gray-300 px-1.5 py-0.5 rounded text-black text-xs font-mono min-w-[24px] text-center ${
                    ["J", "Q", "K"].includes(card.rank)
                      ? "bg-yellow-100"
                      : "bg-white"
                  }`}
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

        {/* Sample bias notice */}
        <div className="text-black text-xs bg-yellow-50 px-2 py-1 border border-yellow-200 rounded">
          Face cards 3× more likely
        </div>

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
                  target
                </th>
                <th className="text-gray-300 text-xs font-normal text-right">
                  biased
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
                <td className="text-gray-600 text-xs py-0.5 text-right">
                  8.58
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
                <td className="text-gray-600 text-xs py-0.5 text-right">
                  46.2%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Chart */}
        <div>
          <div className="text-black text-sm mb-2 font-medium">
            Average rank converges to biased value (~8.58):
          </div>
          <LineChart
            data={history}
            dataKey="avgRank"
            color="#000000"
            expectedValue={8.58}
            label="Biased"
          />
        </div>
      </div>
    </div>
  );
};

export default FaceBiasedDemo;
