import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { EventSystem } from './event-system';

describe('EventSystem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Immediate Processing Mode', () => {
    it('processes events that it has handlers defined for immediately', () => {
      const eventSystem = new EventSystem({ queued: false });

      const eventName = 'exampleTestName';
      const handler = jest.fn();

      const event = {
        topic: eventName,
        data: 'data',
      };

      eventSystem.on(eventName, handler);

      eventSystem.emit(event);

      expect(handler).toBeCalledTimes(1);
      expect(handler).toBeCalledWith(event);
    });

    it('does not call event handlers for topics they are not configured for', () => {
      const eventSystem = new EventSystem({ queued: false });

      const eventName = 'exampleTestName';
      const otherEventName = 'otherExampleTestName';
      const handler = jest.fn();

      const event = {
        topic: otherEventName,
        data: 'data',
      };

      eventSystem.on(eventName, handler);

      eventSystem.emit(event);

      expect(handler).toBeCalledTimes(0);
    });

    it('will not call removed handlers', () => {
      const eventSystem = new EventSystem({ queued: false });

      const eventName = 'exampleTestName';
      const handler = jest.fn();

      const event = {
        topic: eventName,
        data: 'data',
      };

      eventSystem.on(eventName, handler);

      eventSystem.emit(event);

      expect(handler).toBeCalledTimes(1);
      expect(handler).toBeCalledWith(event);

      eventSystem.unsubscribe(eventName, handler);

      eventSystem.emit(event);

      expect(handler).toBeCalledTimes(1);
    });
  });

  describe('Queued Mode', () => {
    it('processes events that it has handlers defined for on ticks', () => {
      const eventSystem = new EventSystem({ queued: true });

      const eventName = 'exampleTestName';
      const handler = jest.fn();

      const event = {
        topic: eventName,
        data: 'data',
      };

      eventSystem.on(eventName, handler);

      eventSystem.emit(event);

      expect(handler).toBeCalledTimes(0);

      eventSystem.tick();

      expect(handler).toBeCalledTimes(1);
      expect(handler).toBeCalledWith(event);
    });

    it('does not call event handlers for topics they are not configured for', () => {
      const eventSystem = new EventSystem({ queued: true });

      const eventName = 'exampleTestName';
      const otherEventName = 'otherExampleTestName';
      const handler = jest.fn();

      const event = {
        topic: otherEventName,
        data: 'data',
      };

      eventSystem.on(eventName, handler);

      eventSystem.emit(event);

      eventSystem.tick();

      expect(handler).toBeCalledTimes(0);
    });

    it('will not call removed handlers', () => {
      const eventSystem = new EventSystem({ queued: true });

      const eventName = 'exampleTestName';
      const handler = jest.fn();

      const event = {
        topic: eventName,
        data: 'data',
      };

      const subscription = eventSystem.on(eventName, handler);

      eventSystem.emit(event);

      eventSystem.tick();

      expect(handler).toBeCalledTimes(1);
      expect(handler).toBeCalledWith(event);

      subscription.unsubscribe();

      eventSystem.emit(event);

      eventSystem.tick();

      expect(handler).toBeCalledTimes(1);
    });
  });
});
