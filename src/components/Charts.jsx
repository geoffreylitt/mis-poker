import React from "react";

export const LineChart = ({
  data,
  dataKey,
  color,
  expectedValue,
  label,
  referenceLines = [],
}) => {
  if (data.length < 2) {
    return (
      <div className="h-16 bg-white rounded flex items-center justify-center text-gray-600 text-sm border border-gray-300">
        Shuffling the deck...
      </div>
    );
  }

  const values = data.map((d) => d[dataKey]);
  const allExpectedValues = [
    expectedValue,
    ...referenceLines.map((r) => r.value),
  ];
  const minVal = Math.min(...values, ...allExpectedValues.map((v) => v * 0.9));
  const maxVal = Math.max(...values, ...allExpectedValues.map((v) => v * 1.1));
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
    <div className="h-16 bg-white rounded relative border border-gray-300">
      <svg
        className="w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Data line with glow effect */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          style={{ filter: "drop-shadow(0 0 3px currentColor)" }}
        />
        {/* Main reference line */}
        <line
          x1="0"
          y1={expectedY}
          x2="100"
          y2={expectedY}
          stroke="#22c55e"
          strokeWidth="1"
          strokeDasharray="3,3"
          vectorEffect="non-scaling-stroke"
          opacity="0.7"
        />

        {/* Additional reference lines */}
        {referenceLines.map((refLine, i) => {
          const refY = 100 - ((refLine.value - minVal) / range) * 100;
          return (
            <line
              key={i}
              x1="0"
              y1={refY}
              x2="100"
              y2={refY}
              stroke={refLine.color || "#22c55e"}
              strokeWidth="1"
              strokeDasharray={refLine.dashPattern || "3,3"}
              vectorEffect="non-scaling-stroke"
              opacity="0.7"
            />
          );
        })}
      </svg>

      {/* Inline label */}
      <div
        className="absolute text-xs text-gray-700 bg-gray-100 px-1 py-0.5 rounded border border-gray-300"
        style={{
          left: "3%",
          top: `${expectedY}%`,
          transform: "translateY(-50%)",
        }}
      >
        {label}: {expectedValue.toFixed(1)}
      </div>

      {/* Additional reference line labels */}
      {referenceLines.map((refLine, i) => {
        const refY = 100 - ((refLine.value - minVal) / range) * 100;
        return (
          <div
            key={i}
            className="absolute text-xs px-1 py-0.5 rounded"
            style={{
              left: `${15 + i * 20}%`,
              top: `${refY}%`,
              transform: "translateY(-50%)",
              color: refLine.color || "#22c55e",
              backgroundColor: refLine.bgColor || "#f3f4f6",
              borderColor: refLine.color || "#22c55e",
            }}
          >
            {refLine.label}: {refLine.value.toFixed(1)}
          </div>
        );
      })}
    </div>
  );
};

export const ComparisonChart = ({ data, lines }) => {
  if (data.length < 2) {
    return (
      <div className="h-16 bg-white rounded flex items-center justify-center text-gray-600 text-sm border border-gray-300">
        Shuffling the deck...
      </div>
    );
  }

  // Calculate unified scale across all lines
  const allValues = lines.flatMap((line) => data.map((d) => d[line.dataKey]));
  const minVal = Math.min(
    ...allValues,
    ...lines.map((l) => l.expectedValue * 0.9)
  );
  const maxVal = Math.max(
    ...allValues,
    ...lines.map((l) => l.expectedValue * 1.1)
  );
  const range = maxVal - minVal;

  return (
    <div className="h-16 bg-white rounded relative border border-gray-300">
      <svg
        className="w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
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
              stroke="#22c55e"
              strokeWidth="1"
              strokeDasharray={line.dashPattern || "2,2"}
              vectorEffect="non-scaling-stroke"
              opacity="0.5"
            />
          );
        })}

        {/* Data lines */}
        {lines.map((line, i) => {
          const points = data
            .map((d, j) => {
              const x = (j / (data.length - 1)) * 100;
              const y = 100 - ((d[line.dataKey] - minVal) / range) * 100;
              return `${x},${y}`;
            })
            .join(" ");

          return (
            <polyline
              key={`line-${i}`}
              points={points}
              fill="none"
              stroke={line.color}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              style={{ filter: "drop-shadow(0 0 3px currentColor)" }}
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
            className="absolute text-xs bg-gray-100 px-1 py-0.5 rounded border border-gray-300"
            style={{
              left: `${5 + i * 25}%`,
              top: `${expectedY}%`,
              transform: "translateY(-50%)",
              color: line.color,
            }}
          >
            {line.label}: {line.expectedValue.toFixed(1)}
          </div>
        );
      })}
    </div>
  );
};
