import { describe, expect, it } from 'bun:test';
import {
  backendRpcTool,
  clientTool,
  type ClientEventsFrom,
  toolParam,
} from './tools';

describe('clientTool', () => {
  it('returns an object with the correct server-facing fields', () => {
    const tool = clientTool('greet', {
      description: 'Say hello',
      args: {} as { name: string },
    });

    expect(tool).toEqual({
      type: 'client_event',
      name: 'greet',
      description: 'Say hello',
    });
  });

  it('produces a JSON-serializable object for the session create payload', () => {
    const tool = clientTool('show_caption', {
      description: 'Display a caption',
      args: {} as { text: string },
    });

    const serialized = JSON.parse(JSON.stringify(tool));
    expect(serialized).toEqual({
      type: 'client_event',
      name: 'show_caption',
      description: 'Display a caption',
    });
  });

  it('composes into an array of tools for the session create payload', () => {
    const showCaption = clientTool('show_caption', {
      description: 'Show caption',
      args: {} as { text: string },
    });
    const playSound = clientTool('play_sound', {
      description: 'Play sound',
      args: {} as { url: string },
    });

    const tools = [showCaption, playSound];

    expect(tools).toHaveLength(2);
    expect(tools[0].name).toBe('show_caption');
    expect(tools[1].name).toBe('play_sound');

    type Events = ClientEventsFrom<typeof tools>;
    const event: Events = {
      type: 'client_event',
      tool: 'show_caption',
      args: { text: 'hi' },
    };
    expect(event.tool).toBe('show_caption');
  });
});

describe('backendRpcTool', () => {
  it('returns an object with the correct server-facing fields', () => {
    const tool = backendRpcTool('get_response', {
      description: 'Fetch the next line to speak',
      args: {} as { speech?: string },
      timeoutSeconds: 8,
    });

    expect(tool).toEqual({
      type: 'backend_rpc',
      name: 'get_response',
      description: 'Fetch the next line to speak',
      timeoutSeconds: 8,
    });
  });

  it('produces a JSON-serializable object for the session create payload', () => {
    const tool = backendRpcTool('get_response', {
      description: 'Fetch the next line to speak',
      args: {} as { speech?: string },
    });

    const serialized = JSON.parse(JSON.stringify(tool));
    expect(serialized).toEqual({
      type: 'backend_rpc',
      name: 'get_response',
      description: 'Fetch the next line to speak',
    });
  });
});

describe('toolParam', () => {
  it('returns a typed server-facing parameter object', () => {
    const param = toolParam('locale', {
      type: 'string',
      description: 'Locale for the response',
    });

    expect(param).toEqual({
      name: 'locale',
      type: 'string',
      description: 'Locale for the response',
    });
  });

  it('supports array items for array parameters', () => {
    const param = toolParam('topics', {
      type: 'array',
      items: { type: 'string' },
      description: 'Topics to cover',
    });

    expect(param).toEqual({
      name: 'topics',
      type: 'array',
      items: { type: 'string' },
      description: 'Topics to cover',
    });
  });
});
