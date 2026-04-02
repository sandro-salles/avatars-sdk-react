import { clientTool, type ClientEventsFrom } from '@runwayml/avatars-react/api';
import type { RealtimeSessionCreateParams } from '@runwayml/sdk/resources/realtime-sessions';

export const nextStep = clientTool('next_step', {
  description:
    'Advance the trivia game. Always include the next question. After the first question, also include the result of the previous question and the updated score.',
  args: {} as {
    question: string;
    options: Array<string>;
    questionNumber: number;
    score: number;
    previousCorrect?: boolean;
    previousCorrectAnswer?: string;
    sound?: 'correct' | 'incorrect';
  },
});

export type TriviaEvent = ClientEventsFrom<[typeof nextStep]>;

export const clientEventTools: RealtimeSessionCreateParams['tools'] = [
  {
    ...nextStep,
    parameters: [
      {
        name: 'question',
        type: 'string',
        description: 'The next trivia question text',
      },
      {
        name: 'options',
        type: 'array',
        items: { type: 'string' },
        description: 'Exactly 4 multiple choice option strings',
      },
      {
        name: 'questionNumber',
        type: 'number',
        description: 'The question number (1-based)',
      },
      {
        name: 'score',
        type: 'number',
        description: 'Total correct answers so far',
      },
      {
        name: 'previousCorrect',
        type: 'boolean',
        description: 'Whether the previous answer was correct (omit for first question)',
      },
      {
        name: 'previousCorrectAnswer',
        type: 'string',
        description: 'The correct answer to the previous question (omit for first question)',
      },
      {
        name: 'sound',
        type: 'string',
        description: 'Sound to play: correct or incorrect (omit for first question)',
      },
    ],
  },
];
