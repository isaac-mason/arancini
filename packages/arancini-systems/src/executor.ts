import { AnyEntity, Query, QueryDescription, World } from '@arancini/core'
import {
  AttachedSystemPlaceholder,
  SingletonQueryPlaceholder,
  System,
  SystemAttributes,
  SystemClass,
  SystemQueryOptions,
} from './system'
import { isSubclassMethodOverridden } from './utils'

export class Executor<E extends AnyEntity> {
  world: World<E>

  initialised = false

  time = 0

  get systems(): System[] {
    return Array.from(this.systemClassToInstance.values())
  }

  private systemClassToInstance: Map<SystemClass, System> = new Map()

  private systemsToUpdate: System[] = []

  private systemCounter = 0

  private systemAttachments: Map<
    System,
    { field: string; systemClass: SystemClass }[]
  > = new Map()

  constructor(world: World<E>) {
    this.world = world
  }

  /**
   * Initialises the Executor. Must be called before update.
   */
  init(): void {
    this.initialised = true

    for (const system of this.systemClassToInstance.values()) {
      this.initSystem(system)
    }

    this.sortSystems()
  }

  /**
   * Updates all systems
   * @param delta optional delta time
   */
  update(delta: number = 0): void {
    this.time += delta

    for (let i = 0; i < this.systemsToUpdate.length; i++) {
      const system = this.systemsToUpdate[i]

      if (!system.enabled) {
        continue
      }

      if (
        system.__internal.requiredQueries.length > 0 &&
        system.__internal.requiredQueries.some((q) => q.entities.length === 0)
      ) {
        continue
      }

      system.onUpdate(delta, this.time)
    }
  }

  /**
   * Calls onDestroy on all systems
   */
  destroy(): void {
    for (const system of this.systemClassToInstance.values()) {
      system.onDestroy()
    }
  }

  /**
   * Retrives a System by class
   * @param clazz the System class
   * @returns the System, or undefined if it is not present
   */
  get<S extends System>(clazz: SystemClass<S>): S | undefined {
    return this.systemClassToInstance.get(clazz) as S | undefined
  }

  /**
   * Adds a system to the Executor
   * @param Clazz
   * @param attributes
   */
  add(Clazz: SystemClass, attributes?: SystemAttributes): this {
    if (this.systemClassToInstance.has(Clazz)) {
      throw new Error(`System "${Clazz.name}" has already been registered`)
    }

    /* instantiate the system */
    this.systemCounter++
    const system = new Clazz(this)
    this.systemClassToInstance.set(Clazz, system)

    /* set internal properties */
    system.__internal.class = Clazz
    system.__internal.priority = attributes?.priority ?? 0
    system.__internal.order = this.systemCounter

    this.initSingletonQueries(system)
    this.updateAllSystemAttachments()

    // if the system has an onUpdate method, add it to the sorted systems.
    // systems are sorted immediately if the system manager is initialised, otherwise
    // they are sorted on initialisation.
    const hasOnUpdate = isSubclassMethodOverridden(Clazz, 'onUpdate')
    if (hasOnUpdate) {
      this.systemsToUpdate.push(system)
    }

    if (this.initialised) {
      this.initSystem(system)

      if (hasOnUpdate) {
        this.sortSystems()
      }
    }

    return this
  }

  /**
   * Removes a system from the Executor
   * @param clazz
   */
  remove(clazz: SystemClass): this {
    const system = this.systemClassToInstance.get(clazz)

    if (!system) {
      throw new Error(`System "${clazz.name}" is not registered`)
    }

    this.systemClassToInstance.delete(clazz)
    this.systemsToUpdate = this.systemsToUpdate.filter(
      (s) => s.__internal.class !== clazz
    )

    system.__internal.queries.forEach((query: Query<unknown>) => {
      this.world.destroyQuery(query, system)
    })
    system.__internal.requiredQueries = []

    system.onDestroy()

    this.updateAllSystemAttachments()

    return this
  }

  private initSystem(system: System) {
    system.onInit()
  }

  private initSingletonQueries(system: System | any) {
    for (const fieldName in system) {
      const _system = system as any

      const field = _system[fieldName]

      if (field?.__internal?.systemSingletonPlaceholder) {
        const {
          __internal: { component, options },
        } = field as SingletonQueryPlaceholder

        const queryDescription: QueryDescription<any, any> = (e) =>
          e.has(component)

        const query = createSystemQuery(
          this.world,
          system,
          queryDescription,
          options
        )

        const onQueryChange = () => {
          _system[fieldName] = query.first?.[component]
        }

        query.onEntityAdded.add(onQueryChange)
        query.onEntityRemoved.add(onQueryChange)
        onQueryChange()
      }
    }
  }

  private updateSystemAttachments(system: System | any) {
    // check for placeholders
    for (const fieldName in system) {
      const field = system[fieldName]

      if (field?.__internal?.attachedSystemPlaceholder) {
        const systemAttachments = this.systemAttachments.get(system) ?? []

        systemAttachments.push({
          field: fieldName,
          systemClass: field.__internal.systemClass,
        })

        this.systemAttachments.set(system, systemAttachments)

        const {
          __internal: { systemClass },
        } = field as AttachedSystemPlaceholder

        system[fieldName] = this.get(systemClass)
      }
    }

    // update existing attachments
    const systemAttachments = this.systemAttachments.get(system) ?? []
    for (const { field, systemClass } of systemAttachments) {
      system[field] = this.get(systemClass)
    }
  }

  private updateAllSystemAttachments() {
    for (const system of this.systemClassToInstance.values()) {
      this.updateSystemAttachments(system)
    }
  }

  private sortSystems(): void {
    this.systemsToUpdate.sort((a, b) => {
      return (
        // higher priority runs first
        b.__internal.priority - a.__internal.priority ||
        // default to order system was registered
        a.__internal.order - b.__internal.order
      )
    })
  }
}

export const createSystemQuery = <
  Entity extends AnyEntity,
  ResultEntity extends Entity,
>(
  world: World<Entity>,
  system: System<Entity>,
  queryDescription: QueryDescription<Entity, ResultEntity>,
  options?: SystemQueryOptions
): Query<ResultEntity> => {
  const query = world.query(queryDescription, { handle: system })

  system.__internal.queries.add(query)

  if (options?.required) {
    system.__internal.requiredQueries.push(query)
  }

  return query
}
