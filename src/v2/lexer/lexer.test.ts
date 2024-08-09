import { lexer } from './lexer2';

describe('lexer', () => {
  it('should lex', () => {
    // const example = '###### ***heading***!';
    const example = `# Heading 1
## Heading 2
### Heading 3

> Bloc_kquote_

\`\`\`js
const a = 1;
\`\`\`

paragraph **bold** _italic_ ***bold and italic***!

paragraph 2
---
`;
    const tokens = lexer(example);
    // const getNextToken = lexer(example);

    for (const token of tokens) {
      console.log(token);
    }
  });
});
