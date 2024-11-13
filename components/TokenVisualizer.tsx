import React from 'react';

interface TokenVisualizerProps {
  text: string;
  charToToken: number[];
}

const COLORS = [
  'bg-blue-100', 'bg-green-100', 'bg-yellow-100', 
  'bg-purple-100', 'bg-pink-100', 'bg-indigo-100',
  'bg-red-100', 'bg-orange-100', 'bg-teal-100'
];

export function TokenVisualizer({ text, charToToken }: TokenVisualizerProps) {
  const getColorForToken = (tokenIndex: number) => {
    return COLORS[tokenIndex % COLORS.length];
  };

  return (
    <div className="font-mono whitespace-pre-wrap break-all">
      {text.split('').map((char, index) => {
        const tokenIndex = charToToken[index];
        return (
          <span
            key={index}
            className={`${getColorForToken(tokenIndex)} px-0.5 rounded`}
            title={`Token ${tokenIndex}`}
          >
            {char}
          </span>
        );
      })}
    </div>
  );
} 