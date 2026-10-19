import React, { useState, useEffect } from 'react';
import { Text, Box } from 'ink';


const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export function Loading({ text = "Loading..." }: { text?: string }) {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {

    const timer = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % spinnerFrames.length);
    }, 80);

  
    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <Box>
      <Text color="cyan">{spinnerFrames[frameIndex]} </Text>
      <Text color="gray">{text}</Text>
    </Box>
  );
}