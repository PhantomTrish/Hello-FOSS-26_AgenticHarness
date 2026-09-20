#!/usr/bin/env node

/**
 * Simple Console Calculator
 * Supports addition (+), subtraction (-), and multiplication (*)
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('========================================');
console.log('   Simple Console Calculator (+, -, *)  ');
console.log('========================================');
console.log('Usage format: <number> <operator> <number>');
console.log('Example: 5 + 3, 10 - 4, or 6 * 7');
console.log('Type "exit" or "quit" to stop.\n');

function promptUser() {
  rl.question('Enter calculation: ', (input) => {
    const trimmed = input.trim();

    if (trimmed.toLowerCase() === 'exit' || trimmed.toLowerCase() === 'quit') {
      console.log('Goodbye!');
      rl.close();
      return;
    }

    if (!trimmed) {
      promptUser();
      return;
    }

    // Split input by whitespace
    const parts = trimmed.split(/\s+/);

    if (parts.length !== 3) {
      console.log('Error: Please use format: number operator number (e.g., 5 + 3)\n');
      promptUser();
      return;
    }

    const num1 = parseFloat(parts[0]);
    const op = parts[1];
    const num2 = parseFloat(parts[2]);

    if (isNaN(num1) || isNaN(num2)) {
      console.log('Error: Invalid numbers provided.\n');
      promptUser();
      return;
    }

    let result;

    if (op === '+') {
      result = num1 + num2;
    } else if (op === '-') {
      result = num1 - num2;
    } else if (op === '*') {
      result = num1 * num2;
    } else {
      console.log(`Error: Unsupported operator "${op}". Only "+", "-", and "*" are supported.\n`);
      promptUser();
      return;
    }

    console.log(`Result: ${num1} ${op} ${num2} = ${result}\n`);
    promptUser();
  });
}

promptUser();
