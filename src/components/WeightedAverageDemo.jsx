import React, { useState, useEffect } from "react";
import {
  generateFaceBiasedCard,
  getRankValue,
  getImportanceWeight,
  isFaceCard,
  formatCard,
} from "./utils.js";

const WeightedAverageDemo = () => {
  const [samples, setSamples] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(false);

  // Generate samples on mount
  useEffect(() => {
    const newSamples = Array.from({ length: 50 }, () =>
      generateFaceBiasedCard()
    );
    setSamples(newSamples);
  }, []);

  // Autoplay functionality
  useEffect(() => {
    if (!isAutoplay) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        if (prevIndex >= samples.length - 1) {
          setIsAutoplay(false);
          return prevIndex;
        }
        return prevIndex + 1;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [isAutoplay, samples.length]);

  const getCurrentCard = () => {
    if (currentIndex >= samples.length) return null;
    return samples[currentIndex];
  };

  const computeRunningAverage = () => {
    let weightedSum = 0;
    let weightSum = 0;

    for (let i = 0; i <= currentIndex && i < samples.length; i++) {
      const card = samples[i];
      const weight = getImportanceWeight(card);
      const value = getRankValue(card.rank);

      weightedSum += value * weight;
      weightSum += weight;
    }

    return {
      weightedSum,
      weightSum,
      average: weightSum > 0 ? weightedSum / weightSum : 0,
    };
  };

  const currentCard = getCurrentCard();
  const currentWeight = currentCard ? getImportanceWeight(currentCard) : 0;
  const currentValue = currentCard ? getRankValue(currentCard.rank) : 0;
  const runningStats = computeRunningAverage();

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
          <span className="font-semibold">Figure 3:</span> Step-by-step weighted
          average calculation shows how importance weights correct for biased
          sampling.
        </div>

        {/* Buttons */}
        <div className="flex gap-2 items-center flex-shrink-0">
          <button
            onClick={toggleAutoplay}
            className="px-2 py-1 text-xs text-gray-600 hover:text-black transition-colors"
          >
            {isAutoplay ? "Pause" : "Autoplay"}
          </button>
          <button
            onClick={reset}
            className="px-2 py-1 text-xs text-gray-600 hover:text-black transition-colors"
          >
            Reset
          </button>
          <button
            onClick={previous}
            disabled={currentIndex === 0}
            className="px-3 py-1 rounded text-sm font-medium bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
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
            <div
              className={`border border-gray-300 px-2 py-1 rounded text-black text-sm font-mono ${
                isFaceCard(currentCard.rank) ? "bg-yellow-100" : "bg-white"
              }`}
            >
              {formatCard(currentCard)}
            </div>
            <div className="text-gray-500 text-xs">
              ({currentIndex + 1}/{samples.length})
            </div>
          </div>
        )}

        {/* Weight calculation preview */}
        {currentCard && (
          <div className="text-black text-xs">
            Weight ={" "}
            {isFaceCard(currentCard.rank) ? "(1/52)/(3/52)" : "(1/52)/(1/52)"} ={" "}
            {currentWeight.toFixed(3)}
          </div>
        )}

        {/* Running average */}
        <div className="text-black text-sm whitespace-nowrap ml-auto">
          Weighted average:{" "}
          <span className="font-mono">{runningStats.average.toFixed(3)}</span>
        </div>
      </div>

      {/* Data Row */}
      <div className="grid grid-cols-2 gap-6 px-6 py-2 border-t border-gray-300">
        {/* Weight Calculation Details */}
        <div>
          <table className="w-full text-sm my-0">
            <thead>
              <tr>
                <th className="text-left py-1">Weight Calculation</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {currentCard && (
                <>
                  <tr>
                    <td className="py-0.5">Card</td>
                    <td className="font-mono text-right py-0.5">
                      {formatCard(currentCard)} (rank {currentValue})
                    </td>
                  </tr>
                  <tr>
                    <td className="py-0.5">P(target)</td>
                    <td className="font-mono text-right py-0.5">1/52</td>
                  </tr>
                  <tr>
                    <td className="py-0.5">P(proposal)</td>
                    <td className="font-mono text-right py-0.5">
                      {isFaceCard(currentCard.rank) ? "3/52" : "1/52"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-0.5 font-medium">Weight</td>
                    <td className="font-mono text-right py-0.5 font-medium">
                      {currentWeight.toFixed(3)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-0.5 text-xs text-gray-600" colSpan="2">
                      {isFaceCard(currentCard.rank)
                        ? "Face cards oversampled 3×, so weight = 1/3"
                        : "Regular cards normal probability, weight = 1"}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Running Weighted Average */}
        <div>
          <table className="w-full text-sm my-0">
            <thead>
              <tr>
                <th className="text-left py-1">Running Calculation</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-0.5">Weighted sum</td>
                <td className="font-mono text-right py-0.5">
                  {runningStats.weightedSum.toFixed(3)}
                </td>
              </tr>
              <tr>
                <td className="py-0.5">Weight sum</td>
                <td className="font-mono text-right py-0.5">
                  {runningStats.weightSum.toFixed(3)}
                </td>
              </tr>
              <tr>
                <td className="py-0.5 font-medium">Weighted average</td>
                <td className="font-mono text-right py-0.5 font-medium">
                  {runningStats.average.toFixed(3)}
                </td>
              </tr>
              <tr>
                <td className="py-0.5 text-xs text-gray-600" colSpan="2">
                  {runningStats.average > 6.5 && runningStats.average < 7.5
                    ? "✓ Converging to 7.0!"
                    : "Building toward correct value..."}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WeightedAverageDemo;
