import { EmphasisToken, HeadingToken, LexRule, LexerState } from './lexer';

function getLevel(state: LexerState) {
  let position = state.cursor;
  let level = 0;

  while (position < state.length) {
    const char = state.src[position];

    if (char !== '#') {
      return level;
    }

    position++;
    level++;
  }

  return 0;
}

export const lexHeading: LexRule<HeadingToken> = {
  name: 'heading',
  type: 'block',
  test(state) {
    const char = state.src[state.cursor];

    if (char !== '#') {
      return false;
    }

    const level = getLevel(state);
    const nextChar = state.src[state.cursor + level];

    // Heading level must be between 1 and 6
    if (level > 6) {
      return false;
    }

    // Heading must be followed by a space or tab
    if (nextChar !== ' ' && nextChar !== '\t') {
      return false;
    }

    return true;
  },
  parse(state) {
    const start = state.cursor;
    let level = 0;
    let char = state.src[state.cursor];

    while (char === '#') {
      level++;
      state.cursor++;

      char = state.src[state.cursor];
    }

    // Skip space or tab
    state.cursor++;

    // Switch to inline mode
    state.mode = 'inline';

    return {
      type: 'heading',
      level,
      start,
    };
  },
};

const emphasisChars = new Set('*_');

export const lexEmphasis: LexRule<EmphasisToken> = {
  name: 'emphasis',
  type: 'inline',
  test(state) {
    const char = state.src[state.cursor];

    if (emphasisChars.has(char)) {
      return true;
    }

    return false;
  },
  parse(state) {
    const start = state.cursor;
    const symbol = state.src[state.cursor];
    let value = '';

    const currentStack = state.stack[state.stack.length - 1];

    while (state.cursor < state.length) {
      const char = state.src[state.cursor];

      if (char !== symbol) {
        break;
      }

      value += char;
      state.cursor++;

      if (currentStack === value) {
        break;
      }

      if (value.length >= 2) {
        break;
      }
    }

    if (currentStack === value) {
      state.stack.pop();

      return {
        type: 'emphasisEnd',
        value,
        start,
      };
    }

    if (state.stack.includes(value)) {
      throw new Error(`Invalid emphasis ${value}`);
    }

    state.stack.push(value);

    return {
      type: 'emphasisStart',
      value,
      start,
    };
  },
};
