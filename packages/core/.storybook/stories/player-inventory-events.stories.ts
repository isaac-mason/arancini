import { useEffect } from '@storybook/client-api';
import { Component, System, World } from '@recs/core';

type InventoryEvent = {
  topic: 'inventory-event';
  type: 'add' | 'remove';
  entity: string;
  item: string;
  count: number;
};

class Inventory extends Component {
  /**
   * A map of item ids to counts
   */
  items: Map<string, number> = new Map();
}

const Queries = {
  Inventories: [Inventory]
}

class InventorySystem extends System {
  inventories = this.query(Queries.Inventories);

  onInit(): void {
    this.world.on<InventoryEvent>('inventory-event', (e) => {
      const entity = this.inventories.entities.find(
        (entity) => entity.id === e.entity
      );

      if (!entity) {
        return;
      }

      const inventory = entity.get(Inventory);

      let itemCount = inventory.items.get(e.item) ?? 0;

      itemCount = itemCount + (e.type === 'add' ? e.count : -e.count);

      if (itemCount <= 0) {
        inventory.items.delete(e.item);
      } else {
        inventory.items.set(e.item, itemCount);
      }
    });
  }
}

export const PlayerInventoryEvents = () => {
  useEffect(() => {
    const world = new World();
    world.registerSystem(InventorySystem);

    const space = world.create.space();
    const player = space.create.entity();
    player.add(Inventory);

    world.init();

    document.querySelector('#add-apple')!.addEventListener('click', () => {
      world.emit<InventoryEvent>({
        topic: 'inventory-event',
        entity: player.id,
        type: 'add',
        item: 'apple',
        count: 1,
      });
    });

    document.querySelector('#remove-apple')!.addEventListener('click', () => {
      world.emit<InventoryEvent>({
        topic: 'inventory-event',
        entity: player.id,
        type: 'remove',
        item: 'apple',
        count: 1,
      });
    });

    document.querySelector('#add-bomb')!.addEventListener('click', () => {
      world.emit<InventoryEvent>({
        topic: 'inventory-event',
        entity: player.id,
        type: 'add',
        item: 'bomb',
        count: 1,
      });
    });

    document.querySelector('#remove-bomb')!.addEventListener('click', () => {
      world.emit<InventoryEvent>({
        topic: 'inventory-event',
        entity: player.id,
        type: 'remove',
        item: 'bomb',
        count: 1,
      });
    });

    let running = true;
    let lastCall = 0;
    const loop = (now: number) => {
      if (!running) return;
      const elapsed = now - lastCall;
      world.update(elapsed);
      lastCall = now;

      document.querySelector('#inventory')!.innerHTML = JSON.stringify({
        id: player.id,
        inventory: Array.from(player.get(Inventory).items.entries()),
      });

      requestAnimationFrame((elapsedMs) => loop(elapsedMs / 1000));
    };

    loop(0);

    return () => {
      running = false;
      world.destroy();
    }
  });

  return `
    <div style="padding: 1em;">
      <div id="inventory" style="color: white; margin-bottom: 1em;"></div>
      <div>
        <button id="add-apple">add apple</button>
        <button id="remove-apple">remove apple</button>
        <button id="add-bomb">add bomb</button>
        <button id="remove-bomb">remove bomb</button>
      </div>
    </div>
  `;
};

export default {
  name: 'Player Inventory Events',
  component: PlayerInventoryEvents,
};
