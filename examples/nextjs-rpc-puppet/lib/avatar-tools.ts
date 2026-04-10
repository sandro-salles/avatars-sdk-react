import type { RealtimeSessionCreateParams } from '@runwayml/sdk/resources/realtime-sessions';

export const backendRpcTools: RealtimeSessionCreateParams['tools'] = [
  {
    type: 'backend_rpc',
    name: 'get_response',
    description:
      "Fetch the exact next line the avatar should speak. This is the avatar's source of truth for spoken responses.",
    timeoutSeconds: 8,
    parameters: [
      {
        name: 'reason',
        type: 'string',
        description:
          'Why a reply is being requested, for example boot, user_turn, follow_up, or clarification',
      },
      {
        name: 'lastUserMessage',
        type: 'string',
        description: 'Most recent user message when available',
      },
    ],
  },
];
