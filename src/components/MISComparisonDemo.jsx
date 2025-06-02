import React, { useState, useEffect } from "react";
import {
  generateFromMultipleProposals,
  calculateMISStats,
  getMemoryBasedWeight,
  getBalanceHeuristicWeight,
  getRankValue,
  formatCard,
  isFaceCard,
  isRedCard,
} from "./utils.js";

const MISComparisonDemo = () => {
  const [samples, setSamples] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(false);

  // Generate samples on mount
  useEffect(() => {
    const newSamples = Array.from({ length: 50 }, () =>
      generateFromMultipleProposals()
    );
    setSamples(newSamples);
  }, []);

  // Autoplay functionality
  useEffect(() => {
    if (!isAutoplay) return;

    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => {
        if (prevIndex >= samples.length - 1) {
          setIsAutoplay(false);
          return prevIndex;
        }
        return prevIndex + 1;
      });
    }, 1000); // 1 second per frame

    return () => clearInterval(interval);
  }, [isAutoplay, samples.length]);

  const getCurrentCard = () => {
    if (currentIndex >= samples.length) return null;
    return samples[currentIndex];
  };

  const computeRunningMISStats = () => {
    const currentSamples = samples.slice(0, currentIndex + 1);
    return calculateMISStats(currentSamples);
  };

  const currentCard = getCurrentCard();
  const runningStats = computeRunningMISStats();

  let memoryWeight = 0;
  let memorylessWeight = 0;
  let currentValue = 0;

  if (currentCard) {
    memoryWeight = getMemoryBasedWeight(currentCard);
    memorylessWeight = getBalanceHeuristicWeight(currentCard);
    currentValue = getRankValue(currentCard.rank);
  }

  const next = () => {
    if (currentIndex < samples.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const previous = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsAutoplay(false); // Stop autoplay on manual navigation
    }
  };

  const reset = () => {
    setCurrentIndex(0);
    setIsAutoplay(false);
  };

  const toggleAutoplay = () => {
    setIsAutoplay(!isAutoplay);
  };

  return (
    <div className="max-w-4xl mx-auto my-8 bg-white border-2 border-black font-serif">
      {/* Figure Caption */}
      <div className="flex items-center justify-between px-6 py-1 border-b border-gray-300 bg-gray-50">
        <div className="text-black text-sm max-w-2xl">
          <span className="font-semibold">Figure 5:</span> Memory-based vs balance heuristic MIS weighting: step-by-step comparison of two approaches using multiple proposal distributions.
        </div>

        {/* Buttons */}
        <div className="flex gap-2 items-center flex-shrink-0">
          <button
            onClick={previous}
            disabled={currentIndex === 0}
            className="px-3 py-1 rounded text-sm font-medium bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>
          <button
            onClick={reset}
            className="px-2 py-1 text-xs text-gray-600 hover:text-black transition-colors"
          >
            Reset
          </button>
          <button
            onClick={toggleAutoplay}
            className="px-2 py-1 text-xs text-gray-600 hover:text-black transition-colors"
          >
            {isAutoplay ? 'Pause' : 'Autoplay'}
          </button>
          <button
            onClick={next}
            disabled={currentIndex >= samples.length - 1}
            className="px-3 py-1 rounded text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex items-center gap-4 px-6 py-2 border-t border-gray-300">
        {/* Current Card */}
        {currentCard && (
          <div className="flex items-center gap-2">
            <div className="text-black text-sm">Current card:</div>
            <div className={`border border-gray-300 px-2 py-1 rounded text-black text-sm font-mono ${
              isFaceCard(currentCard.rank) ? 'bg-yellow-100' : 
              isRedCard(currentCard.suit) ? 'bg-red-100' : 'bg-white'
            }`}>
              {formatCard(currentCard)}
            </div>
            <div className={`text-xs px-1 py-0.5 rounded border ${
              currentCard.source === "face"
                ? "bg-yellow-200 text-black border-yellow-300"
                : "bg-red-200 text-black border-red-300"
            }`}>
              {currentCard.source === "face" ? "Face" : "Red"} proposal
            </div>
            <div className="text-gray-500 text-xs">
              ({currentIndex + 1}/{samples.length})
            </div>
          </div>
        )}

        {/* Running averages */}
        <div className="text-black text-sm whitespace-nowrap ml-auto">
          Memory: <span className="font-mono">{runningStats.memoryAvg.toFixed(3)}</span>
          {" | "}
          Balance: <span className="font-mono">{runningStats.memorylessAvg.toFixed(3)}</span>
        </div>
      </div>

      {/* Data Row */}
      <div className="grid grid-cols-2 gap-6 px-6 py-2 border-t border-gray-300">
        {/* Memory-Based Weight Calculation */}
        <div>
          <table className="w-full text-sm my-0">
            <thead>
              <tr>
                <th className="text-left py-1">Memory-Based Weight</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {currentCard && (
                <>
                  <tr>
                    <td className="py-0.5">Source proposal</td>
                    <td className="font-mono text-right py-0.5">
                      {currentCard.source}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-0.5">P(target)</td>
                    <td className="font-mono text-right py-0.5">
                      1/52
                    </td>
                  </tr>
                  <tr>
                    <td className="py-0.5">P(source)</td>
                    <td className="font-mono text-right py-0.5">
                      {currentCard.source === "face" ? 
                        (isFaceCard(currentCard.rank) ? "3/52" : "1/52") :
                        (isRedCard(currentCard.suit) ? "2/52" : "1/52")
                      }
                    </td>
                  </tr>
                  <tr>
                    <td className="py-0.5 font-medium">Weight</td>
                    <td className="font-mono text-right py-0.5 font-medium">
                      {memoryWeight.toFixed(3)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-0.5 text-xs text-gray-600" colSpan="2">
                      Uses actual source proposal
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Balance Heuristic Weight Calculation */}
        <div>
          <table className="w-full text-sm my-0">
            <thead>
              <tr>
                <th className="text-left py-1">Balance Heuristic Weight</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {currentCard && (
                <>
                  <tr>
                    <td className="py-0.5">Combined denominator</td>
                    <td className="font-mono text-right py-0.5 text-xs">
                      0.5×p_face + 0.5×p_red
                    </td>
                  </tr>
                  <tr>
                    <td className="py-0.5">P(target)</td>
                    <td className="font-mono text-right py-0.5">
                      1/52
                    </td>
                  </tr>
                  <tr>
                    <td className="py-0.5">P(combined)</td>
                    <td className="font-mono text-right py-0.5">
                      {(0.5 * (isFaceCard(currentCard.rank) ? 3/52 : 1/52) + 
                        0.5 * (isRedCard(currentCard.suit) ? 2/52 : 1/52)).toFixed(4)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-0.5 font-medium">Weight</td>
                    <td className="font-mono text-right py-0.5 font-medium">
                      {memorylessWeight.toFixed(3)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-0.5 text-xs text-gray-600" colSpan="2">
                      Ignores which proposal generated sample
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MISComparisonDemo;
