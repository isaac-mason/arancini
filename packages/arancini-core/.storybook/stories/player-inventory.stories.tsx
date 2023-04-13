import { Component, System, World } from '@arancini/core'
import React, { useEffect } from 'react'
import { Topic } from '../../src'

class Inventory extends Component {
  items!: Map<string, number>

  construct() {
    this.items = new Map()
  }
}

type InventoryChangeEvent = [op: 'add' | 'remove', item: string, count: number]

class InventoryEvents extends Component {
  change = new Topic<InventoryChangeEvent>()

  onDestroy(): void {
    this.change.clear()
  }
}

class InventorySystem extends System {
  inventory = this.singleton(Inventory)!

  inventoryEvents = this.singleton(InventoryEvents)!

  onInit(): void {
    const { change } = this.inventoryEvents
    const { items } = this.inventory

    change.add((op, item, count) => {
      let itemCount = items.get(item) ?? 0
      itemCount = itemCount + (op === 'add' ? count : -count)

      if (itemCount <= 0) {
        items.delete(item)
      } else {
        items.set(item, itemCount)
      }
    })
  }
}

export const PlayerInventoryEvents = () => {
  useEffect(() => {
    const world = new World()

    world.registerComponent(Inventory)
    world.registerComponent(InventoryEvents)
    world.registerSystem(InventorySystem)

    const player = world.create.entity()

    player.add(Inventory)

    const inventoryEvents = player.add(InventoryEvents)

    document.querySelector('#add-apple')!.addEventListener('click', () => {
      inventoryEvents.change.emit('add', 'apple', 1)
    })

    document.querySelector('#remove-apple')!.addEventListener('click', () => {
      inventoryEvents.change.emit('remove', 'apple', 1)
    })

    document.querySelector('#add-bomb')!.addEventListener('click', () => {
      inventoryEvents.change.emit('add', 'bomb', 1)
    })

    document.querySelector('#remove-bomb')!.addEventListener('click', () => {
      inventoryEvents.change.emit('remove', 'bomb', 1)
    })

    world.init()

    const now = () => performance.now() / 1000

    let running = true
    let lastTime = now()

    const update = () => {
      if (!running) return

      requestAnimationFrame(update)

      const time = now()
      const delta = time - lastTime
      lastTime = time

      world.update(delta)

      document.querySelector('#inventory')!.innerHTML = JSON.stringify({
        id: player.id,
        inventory: Array.from(player.get(Inventory).items.entries()),
      })
    }

    update()

    return () => {
      running = false
      world.destroy()
    }
  })

  return (
    <div style={{ padding: '1em' }}>
      <div id="inventory" style={{ color: 'white', marginBottom: '1em' }}></div>
      <div>
        <button id="add-apple">add apple</button>
        <button id="remove-apple">remove apple</button>
        <button id="add-bomb">add bomb</button>
        <button id="remove-bomb">remove bomb</button>
      </div>
    </div>
  )
}

export default {
  name: 'Player Inventory Events',
  component: PlayerInventoryEvents,
}
