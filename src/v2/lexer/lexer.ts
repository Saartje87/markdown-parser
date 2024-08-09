import { lexEmphasis, lexHeading } from './lexRules';

export type HeadingToken = {
  type: 'heading';
  level: number;
  start: number;
};

export type ParagraphToken = {
  type: 'paragraph';
  start: number;
};

export type TextToken = {
  type: 'text';
  value: string;
  start: number;
};

export type EmphasisToken = {
  type: 'emphasisStart' | 'emphasisEnd';
  value: string;
  start: number;
};

export type BlankLineToken = {
  type: 'BlankLine';
  start: number;
};

export type EOLToken = {
  type: 'EOL';
  start: number;
};

export type EOFToken = {
  type: 'EOF';
  start: number;
};

export type LexTokens =
  | HeadingToken
  | ParagraphToken
  | TextToken
  | BlankLineToken
  | EmphasisToken
  | EOLToken
  | EOFToken;
export type GetNextToken = () => LexTokens;

export type Mode = 'block' | 'inline';

const escapedChars = new Set('!"#$%&\'()\\*+,-./:;<=>?@[]^_`{|}~');

export type LexRule<T extends LexTokens> = {
  name: string;
  type: Mode;
  test(state: LexerState): boolean;
  parse(state: LexerState): T;
};

export type LexerState = {
  src: string;
  length: number;
  cursor: number;
  mode: Mode;
  // char: string;
  stack: string[];
};

export function lexer(src: string): GetNextToken {
  const length = src.length;
  const state: LexerState = {
    src,
    length,
    cursor: 0,
    mode: 'block',
    // char: '',
    stack: [],
  };
  let prevToken: LexTokens | null = null;
  const rules: LexRule<LexTokens>[] = [lexHeading, lexEmphasis];

  // let cursor = 0;
  // let mode: Mode = 'block';

  function findRule(type: Mode): LexRule<LexTokens> | null {
    // if(type ==='inline')

    // throw new Error(`Invalid mode: ${mode}`);
    for (const rule of rules) {
      if (rule.type === type && rule.test(state)) {
        return rule;
      }
    }

    return null;
  }

  function parseBlock(state: LexerState): LexTokens {
    const rule = findRule('block');

    if (rule) {
      return rule.parse(state);
    }

    // No rule found, parse as paragraph?

    state.mode = 'inline';

    return {
      type: 'paragraph',
      start: state.cursor,
    };

    throw new Error(`Invalid character: ${state.src[state.cursor]}`);
  }

  function parseInline(state: LexerState): LexTokens {
    const rule = findRule('inline');

    if (rule) {
      return rule.parse(state);
    }

    return parseText(state);
  }

  function parseText(state: LexerState): TextToken {
    const start = state.cursor;
    let value = '';
    let char = state.src[state.cursor];

    while (state.cursor < length) {
      char = state.src[state.cursor];

      if (char === '\n') {
        break;
      }

      // console.log('char', char, state.src);

      // Handle escaped characters
      if (char === '\\' && escapedChars.has(state.src[state.cursor + 1])) {
        value += state.src[state.cursor + 1];
        state.cursor += 2;
        continue;
      }

      // Stop when we find an inline rule
      if (findRule('inline')) {
        break;
      }

      value += char;
      state.cursor++;
    }

    return {
      type: 'text',
      value,
      start,
    };
  }

  return function getNextToken(): LexTokens {
    if (state.cursor > length) {
      throw new Error('End of file reached');
    }

    while (state.cursor < length) {
      const char = state.src[state.cursor];

      if (char === '\n') {
        state.cursor++;

        // After 2 empty lines, switch to block mode
        if (prevToken?.type === 'EOL') {
          state.mode = 'block';
        }

        return (prevToken = {
          type: 'EOL',
          start: state.cursor,
        });
      }

      if (state.mode === 'block') {
        return (prevToken = parseBlock(state));
      }

      return (prevToken = parseInline(state));
    }

    if (state.stack.length > 0) {
      throw new Error(`Invalid closing ${state.stack.join('')}`);
    }

    state.cursor++;

    return {
      type: 'EOF',
      start: state.cursor,
    };
  };
}

const example = `
# Heading 1
## Heading 2

This is a paragraph
New line
`;

// { type: 'heading', value: 'Heading 1', level: 1, start: 1 }
// { type: 'EOL', start: 12 }
// { type: 'heading', value: 'Heading 2', level: 2, start: 14 }
// { type: 'EOL', start: 26 }
// { type: 'EOF', start: 27 }
// { type: 'text', value: 'This is a paragraph', start: 29 }
// { type: 'EOL', start: 45 }
// { type: 'text', value: 'New line', start: 48 }
