import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { System } from './system';
import { SystemManager } from './system-manager';
import { World } from './world';

describe('SystemManager', () => {
  const recs = {} as unknown as World;
  let manager: SystemManager;

  const basicSystemInit = jest.fn();
  const basicSystemDestroy = jest.fn();
  const basicSystemOnUpdate = jest.fn();

  class BasicSystem extends System {
    onDestroy() {
      basicSystemDestroy();
    }

    onInit() {
      basicSystemInit();
    }

    onUpdate() {
      basicSystemOnUpdate();
    }
  }
  const basicSystem = new BasicSystem();

  beforeEach(() => {
    manager = new SystemManager(recs);
    jest.resetAllMocks();
  });

  describe('addSystem', () => {
    it('should add the system', () => {
      manager.addSystem(basicSystem);

      expect(manager.systems.size).toEqual(1);
      expect(manager.systems.get(basicSystem.id)).toBe(basicSystem);
    });
  });

  describe('removeSystem', () => {
    it('should remove and destroy the system', () => {
      manager.addSystem(basicSystem);

      expect(manager.systems.size).toEqual(1);
      expect(manager.systems.get(basicSystem.id)).toBe(basicSystem);

      manager.removeSystem(basicSystem);

      expect(manager.systems.size).toEqual(0);

      expect(basicSystemDestroy).toBeCalledTimes(1);
    });
  });

  describe('_init', () => {
    it('should initialise all systems', () => {
      manager.addSystem(basicSystem);

      manager.init();

      expect(basicSystemInit).toBeCalledTimes(1);
    });
  });

  describe('_update', () => {
    it('should update the system if it is enabled', () => {
      manager.addSystem(basicSystem);

      manager.init();

      basicSystem.enabled = false;

      manager.update(1, 1);

      expect(basicSystemOnUpdate).toBeCalledTimes(0);

      basicSystem.enabled = true;

      manager.update(1, 2);

      expect(basicSystemOnUpdate).toBeCalledTimes(1);
    });
  });
});
