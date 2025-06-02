# Multiple Importance Sampling: Implementation Guide

## React Component Architecture

### Standard Demo Component Structure

```javascript
import React, { useState, useEffect, useRef } from 'react';

const DemoComponent = () => {
  // Core state
  const [samples, setSamples] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [sampleCount, setSampleCount] = useState(0);
  const [history, setHistory] = useState([]);
  const animationRef = useRef();

  // Animation loop for convergence demos
  const animate = () => {
    if (!isRunning) return;

    setSamples(prev => {
      // Stop at sample limit
      if (prev.length >= SAMPLE_LIMIT) {
        setIsRunning(false);
        return prev;
      }

      // Generate batch of samples (30+ per frame for visible convergence)
      const cardsToGenerate = Math.min(30, SAMPLE_LIMIT - prev.length);
      const newCards = Array.from({ length: cardsToGenerate }, generateCard);
      const updated = [...prev, ...newCards];

      // Update history for convergence charts
      setHistory(prevHistory => [...prevHistory, {
        sampleCount: updated.length,
        ...calculateStats(updated)
      }]);

      setSampleCount(updated.length);
      return updated;
    });

    animationRef.current = requestAnimationFrame(animate);
  };

  // Cleanup animation frame
  useEffect(() => {
    if (isRunning) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animationRef.current);
    }

    return () => cancelAnimationFrame(animationRef.current);
  }, [isRunning]);

  // Reset function
  const reset = () => {
    setSamples([]);
    setSampleCount(0);
    setHistory([]);
    setIsRunning(false);
    cancelAnimationFrame(animationRef.current);
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-{color}-50 rounded-lg">
      {/* Demo content */}
    </div>
  );
};
```

## Card Generation Implementations

### Basic Card Utilities

```javascript
const suits = ['♠️', '♥️', '♦️', '♣️'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const generateUniformCard = () => ({
  suit: suits[Math.floor(Math.random() * 4)],
  rank: ranks[Math.floor(Math.random() * 13)]
});

const getRankValue = (rank) => {
  if (rank === 'A') return 1;
  if (rank === 'J') return 11;
  if (rank === 'Q') return 12;
  if (rank === 'K') return 13;
  return parseInt(rank);
};

const isFaceCard = (rank) => ['J', 'Q', 'K'].includes(rank);
const isRedCard = (suit) => ['♥️', '♦️'].includes(suit);
```

### Proposal Distribution Implementations

```javascript
// Face Card Biased Sampling (Demo 2)
const generateFaceBiasedCard = () => {
  const suit = suits[Math.floor(Math.random() * 4)];

  // Create explicit weighted pool
  const weightedRanks = [];
  ranks.forEach(rank => {
    const weight = isFaceCard(rank) ? 3 : 1;
    for (let i = 0; i < weight; i++) {
      weightedRanks.push(rank);
    }
  });

  const rank = weightedRanks[Math.floor(Math.random() * weightedRanks.length)];
  return { suit, rank };
};

// Red Card Biased Sampling (Demo 5+)
const generateRedBiasedCard = () => {
  const rank = ranks[Math.floor(Math.random() * 13)];

  const redSuits = ['♥️', '♦️'];
  const blackSuits = ['♠️', '♣️'];

  // Red cards 2x more likely
  const weightedSuits = [...redSuits, ...redSuits, ...blackSuits];
  const suit = weightedSuits[Math.floor(Math.random() * weightedSuits.length)];

  return { suit, rank };
};

// Multiple Proposal Sampling (Demo 5+)
const generateFromMultipleProposals = () => {
  if (Math.random() < 0.5) {
    return { ...generateFaceBiasedCard(), source: 'face' };
  } else {
    return { ...generateRedBiasedCard(), source: 'red' };
  }
};
```

## Weight Calculation Functions

### Single Proposal Importance Sampling

```javascript
// Demo 3-4: Face card bias importance weights
const getImportanceWeight = (card) => {
  const targetProb = 1/52;  // uniform target
  const proposalProb = isFaceCard(card.rank) ? 3/52 : 1/52;
  return targetProb / proposalProb;
};

// General single proposal weight function
const getSingleProposalWeight = (card, proposalType) => {
  const targetProb = 1/52;

  let proposalProb;
  if (proposalType === 'face') {
    proposalProb = isFaceCard(card.rank) ? 3/52 : 1/52;
  } else if (proposalType === 'red') {
    proposalProb = isRedCard(card.suit) ? 2/52 : 1/52;
  } else {
    proposalProb = 1/52; // uniform
  }

  return targetProb / proposalProb;
};
```

### Multiple Importance Sampling Weights

```javascript
// Demo 5: Memory-based MIS weight
const getMemoryBasedWeight = (card) => {
  const targetProb = 1/52;

  let proposalProb;
  if (card.source === 'face') {
    proposalProb = isFaceCard(card.rank) ? 3/52 : 1/52;
  } else if (card.source === 'red') {
    proposalProb = isRedCard(card.suit) ? 2/52 : 1/52;
  }

  return targetProb / proposalProb;
};

// Demo 5-6: Balance heuristic (memoryless) weight
const getBalanceHeuristicWeight = (card, mixingWeights = { face: 0.5, red: 0.5 }) => {
  const targetProb = 1/52;

  // Probabilities under each proposal
  const faceProb = isFaceCard(card.rank) ? 3/52 : 1/52;
  const redProb = isRedCard(card.suit) ? 2/52 : 1/52;

  // Combined probability using mixing weights
  const combinedProb = mixingWeights.face * faceProb + mixingWeights.red * redProb;

  return targetProb / combinedProb;
};
```

## Statistics Calculation

### Basic Statistics Functions

```javascript
// Demo 1-2: Basic uniform/biased statistics
const calculateBasicStats = (sampleArray) => {
  if (sampleArray.length === 0) return {
    avgRank: 0,
    suitPercentages: { '♠️': 0, '♥️': 0, '♦️': 0, '♣️': 0 },
    faceCardPct: 0
  };

  const suitCounts = { '♠️': 0, '♥️': 0, '♦️': 0, '♣️': 0 };
  let totalRankValue = 0;
  let faceCardCount = 0;

  sampleArray.forEach(card => {
    suitCounts[card.suit]++;
    totalRankValue += getRankValue(card.rank);
    if (isFaceCard(card.rank)) faceCardCount++;
  });

  const suitPercentages = {};
  Object.keys(suitCounts).forEach(suit => {
    suitPercentages[suit] = (suitCounts[suit] / sampleArray.length) * 100;
  });

  return {
    avgRank: totalRankValue / sampleArray.length,
    suitPercentages,
    faceCardPct: (faceCardCount / sampleArray.length) * 100
  };
};

// Demo 3-4: Weighted statistics
const calculateWeightedStats = (sampleArray, weightFunction) => {
  if (sampleArray.length === 0) return { weightedAvg: 0, naiveAvg: 0 };

  let naiveSum = 0;
  let weightedSum = 0;
  let weightSum = 0;

  sampleArray.forEach(card => {
    const value = getRankValue(card.rank);
    const weight = weightFunction(card);

    naiveSum += value;
    weightedSum += value * weight;
    weightSum += weight;
  });

  return {
    naiveAvg: naiveSum / sampleArray.length,
    weightedAvg: weightSum > 0 ? weightedSum / weightSum : 0
  };
};

// Demo 5-6: Multiple importance sampling statistics
const calculateMISStats = (sampleArray) => {
  if (sampleArray.length === 0) return { memoryAvg: 0, memorylessAvg: 0 };

  let memoryWeightedSum = 0;
  let memoryWeightSum = 0;
  let memorylessWeightedSum = 0;
  let memorylessWeightSum = 0;

  sampleArray.forEach(card => {
    const value = getRankValue(card.rank);
    const memoryWeight = getMemoryBasedWeight(card);
    const memorylessWeight = getBalanceHeuristicWeight(card);

    memoryWeightedSum += value * memoryWeight;
    memoryWeightSum += memoryWeight;
    memorylessWeightedSum += value * memorylessWeight;
    memorylessWeightSum += memorylessWeight;
  });

  return {
    memoryAvg: memoryWeightSum > 0 ? memoryWeightedSum / memoryWeightSum : 0,
    memorylessAvg: memorylessWeightSum > 0 ? memorylessWeightedSum / memorylessWeightSum : 0
  };
};
```

## Chart Components

### Line Chart with Inline Labels

```javascript
const LineChart = ({ data, dataKey, color, expectedValue, label }) => {
  if (data.length < 2) {
    return (
      <div className="h-20 bg-gray-100 rounded flex items-center justify-center text-gray-500 text-sm">
        Collecting data...
      </div>
    );
  }

  const values = data.map(d => d[dataKey]);
  const minVal = Math.min(...values, expectedValue * 0.9);
  const maxVal = Math.max(...values, expectedValue * 1.1);
  const range = maxVal - minVal;

  // Generate SVG points
  const points = values.map((val, i) => {
    const x = (i / (values.length - 1)) * 100;
    const y = 100 - ((val - minVal) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  // Expected value line position
  const expectedY = 100 - ((expectedValue - minVal) / range) * 100;

  return (
    <div className="h-20 bg-gray-50 rounded relative">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
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
          stroke="#666"
          strokeWidth="0.5"
          strokeDasharray="2,2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Inline label - KEY UX improvement */}
      <div
        className="absolute text-xs text-gray-700 bg-white px-1 rounded"
        style={{
          left: '5%',
          top: `${expectedY}%`,
          transform: 'translateY(-50%)'
        }}
      >
        {label}: {expectedValue.toFixed(1)}
      </div>
    </div>
  );
};

// Multi-line chart for comparisons
const ComparisonChart = ({ data, lines }) => {
  if (data.length < 2) {
    return (
      <div className="h-40 bg-gray-100 rounded flex items-center justify-center text-gray-500 text-sm">
        Collecting data...
      </div>
    );
  }

  // Calculate unified scale across all lines
  const allValues = lines.flatMap(line => data.map(d => d[line.dataKey]));
  const minVal = Math.min(...allValues, ...lines.map(l => l.expectedValue * 0.9));
  const maxVal = Math.max(...allValues, ...lines.map(l => l.expectedValue * 1.1));
  const range = maxVal - minVal;

  return (
    <div className="h-40 bg-gray-50 rounded relative">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Reference lines */}
        {lines.map((line, i) => {
          const expectedY = 100 - ((line.expectedValue - minVal) / range) * 100;
          return (
            <line
              key={`ref-${i}`}
              x1="0"
              y1={expectedY}
              x2="100"
              y2={expectedY}
              stroke="#666"
              strokeWidth="0.5"
              strokeDasharray={line.dashPattern || "2,2"}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}

        {/* Data lines */}
        {lines.map((line, i) => {
          const points = data.map((d, j) => {
            const x = (j / (data.length - 1)) * 100;
            const y = 100 - ((d[line.dataKey] - minVal) / range) * 100;
            return `${x},${y}`;
          }).join(' ');

          return (
            <polyline
              key={`line-${i}`}
              points={points}
              fill="none"
              stroke={line.color}
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>

      {/* Inline labels */}
      {lines.map((line, i) => {
        const expectedY = 100 - ((line.expectedValue - minVal) / range) * 100;
        return (
          <div
            key={`label-${i}`}
            className="absolute text-xs bg-white px-1 rounded"
            style={{
              left: '5%',
              top: `${expectedY}%`,
              transform: 'translateY(-50%)',
              color: line.labelColor || '#374151'
            }}
          >
            {line.label}: {line.expectedValue.toFixed(1)}
          </div>
        );
      })}
    </div>
  );
};
```

## Step-by-Step Demo Component (Demo 3)

```javascript
const WeightedAverageDemo = () => {
  const [samples, setSamples] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Generate samples on mount
  useEffect(() => {
    const newSamples = Array.from({ length: 50 }, () => generateFaceBiasedCard());
    setSamples(newSamples);
  }, []);

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
      average: weightSum > 0 ? weightedSum / weightSum : 0
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
    }
  };

  const reset = () => {
    setCurrentIndex(0);
  };

  return (
    <div className="max-w-lg mx-auto p-4 bg-blue-50 rounded-lg">
      <h2 className="text-2xl font-bold text-center mb-4">Weighted Average Calculation</h2>

      {/* Current Card Display */}
      <div className="bg-white rounded-lg p-6 shadow-md mb-6 text-center">
        <h3 className="text-lg font-bold mb-4">Current Card</h3>
        {currentCard && (
          <div className="text-6xl font-bold mb-4">
            {currentCard.rank}{currentCard.suit}
          </div>
        )}
        <div className="text-xl">
          Rank Value: <span className="font-mono">{currentValue}</span>
        </div>
      </div>

      {/* Weight Calculation */}
      {currentCard && (
        <div className="bg-white rounded-lg p-4 shadow-md mb-6">
          <h3 className="text-lg font-bold mb-4">Importance Weight Calculation</h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span>P(card in target):</span>
              <span className="font-mono">1/52 ≈ 0.0192</span>
            </div>

            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span>P(card in proposal):</span>
              <span className="font-mono">
                {isFaceCard(currentCard.rank) ? '3/52 ≈ 0.0577' : '1/52 ≈ 0.0192'}
              </span>
            </div>

            <div className="border-t pt-2">
              <div className="flex justify-between items-center p-2 bg-blue-100 rounded font-bold">
                <span>Weight = Target ÷ Proposal:</span>
                <span className="font-mono">{currentWeight.toFixed(3)}</span>
              </div>
            </div>

            <div className="text-xs text-gray-600 mt-2">
              {isFaceCard(currentCard.rank)
                ? 'Face cards are oversampled (3x), so weight = 1/3 to compensate'
                : 'Regular cards have normal probability, so weight = 1'
              }
            </div>
          </div>
        </div>
      )}