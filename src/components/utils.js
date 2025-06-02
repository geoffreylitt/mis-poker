// Shared utilities for all demo components

export const suits = ["♠️", "♥️", "♦️", "♣️"];
export const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export const generateUniformCard = () => ({
  suit: suits[Math.floor(Math.random() * 4)],
  rank: ranks[Math.floor(Math.random() * 13)],
});

export const getRankValue = (rank) => {
  if (rank === "A") return 1;
  if (rank === "J") return 11;
  if (rank === "Q") return 12;
  if (rank === "K") return 13;
  return parseInt(rank);
};

export const isFaceCard = (rank) => ["J", "Q", "K"].includes(rank);
export const isRedCard = (suit) => ["♥️", "♦️"].includes(suit);

// Face Card Biased Sampling (Demo 2)
export const generateFaceBiasedCard = () => {
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
export const generateRedBiasedCard = () => {
  const rank = ranks[Math.floor(Math.random() * 13)];

  const redSuits = ["♥️", "♦️"];
  const blackSuits = ["♠️", "♣️"];

  // Red cards 2x more likely
  const weightedSuits = [...redSuits, ...redSuits, ...blackSuits];
  const suit = weightedSuits[Math.floor(Math.random() * weightedSuits.length)];

  return { suit, rank };
};

// Multiple Proposal Sampling (Demo 5+)
export const generateFromMultipleProposals = () => {
  if (Math.random() < 0.5) {
    return { ...generateFaceBiasedCard(), source: 'face' };
  } else {
    return { ...generateRedBiasedCard(), source: 'red' };
  }
};

// Weight calculation functions
export const getImportanceWeight = (card) => {
  const targetProb = 1/52;  // uniform target
  const proposalProb = isFaceCard(card.rank) ? 3/52 : 1/52;
  return targetProb / proposalProb;
};

export const getMemoryBasedWeight = (card) => {
  const targetProb = 1/52;

  let proposalProb;
  if (card.source === 'face') {
    proposalProb = isFaceCard(card.rank) ? 3/52 : 1/52;
  } else if (card.source === 'red') {
    proposalProb = isRedCard(card.suit) ? 2/52 : 1/52;
  }

  return targetProb / proposalProb;
};

export const getBalanceHeuristicWeight = (card, mixingWeights = { face: 0.5, red: 0.5 }) => {
  const targetProb = 1/52;

  // Probabilities under each proposal
  const faceProb = isFaceCard(card.rank) ? 3/52 : 1/52;
  const redProb = isRedCard(card.suit) ? 2/52 : 1/52;

  // Combined probability using mixing weights
  const combinedProb = mixingWeights.face * faceProb + mixingWeights.red * redProb;

  return targetProb / combinedProb;
};

// Statistics calculation functions
export const calculateBasicStats = (sampleArray) => {
  if (sampleArray.length === 0) return {
    avgRank: 0,
    faceCardPct: 0
  };

  let totalRankValue = 0;
  let faceCardCount = 0;

  sampleArray.forEach(card => {
    totalRankValue += getRankValue(card.rank);
    if (isFaceCard(card.rank)) faceCardCount++;
  });

  return {
    avgRank: totalRankValue / sampleArray.length,
    faceCardPct: (faceCardCount / sampleArray.length) * 100
  };
};

export const calculateWeightedStats = (sampleArray, weightFunction) => {
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

export const calculateMISStats = (sampleArray) => {
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

// Format card for display
export const formatCard = (card) => {
  return `${card.rank}${card.suit}`;
};