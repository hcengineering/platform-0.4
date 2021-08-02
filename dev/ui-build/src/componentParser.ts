// original file is https://github.com/IBM/sveld/blob/main/src/ComponentParser.ts
// License: Apache License 2.0
// License: EPL-2.0

import { parse as commentParser } from 'comment-parser'
import { Node } from 'estree'
import { walk } from 'svelte/compiler'
import { Ast, TemplateNode, Var } from 'svelte/types/compiler/interfaces'
import { getElementByTag } from './elementMap'

export interface CompiledSvelteCode {
  vars: Var[]
  ast: Ast
}

interface ComponentParserDiagnostics {
  moduleName: string
  filePath: string
}

interface ComponentParserOptions {
  verbose?: boolean
}

type ComponentPropName = string

export interface ComponentProp {
  name: string
  kind: 'let' | 'const' | 'function'
  constant: boolean
  type?: string
  value?: any
  description?: string
  isFunction: boolean
  isFunctionDeclaration: boolean
  reactive: boolean
}

const DEFAULT_SLOT_NAME = '__default__'

type ComponentSlotName = typeof DEFAULT_SLOT_NAME | string

interface ComponentSlot {
  name?: string
  default: boolean
  fallback?: string
  slotProps?: string
}

interface SlotPropValue {
  value?: string
  replace: boolean
}

type SlotProps = Record<string, SlotPropValue>

type ComponentEventName = string

interface ForwardedEvent {
  type: 'forwarded'
  name: string
  element: ComponentInlineElement | ComponentElement
}

interface DispatchedEvent {
  type: 'dispatched'
  name: string
  detail?: any
}

export type ComponentEvent = ForwardedEvent | DispatchedEvent

type TypeDefName = string

interface TypeDef {
  name: string
  type: string
  description?: string
  ts: string
}

interface ComponentInlineElement {
  type: 'InlineComponent'
  name: string
}

interface ComponentElement {
  type: 'Element'
  name: string
}

type RestProps = ComponentInlineElement | ComponentElement

interface Extends {
  interface: string
  import: string
}

interface ComponentPropBindings {
  elements: string[]
}

export interface ParsedComponent {
  header: string[]
  props: ComponentProp[]
  slots: ComponentSlot[]
  events: ComponentEvent[]
  typedefs: TypeDef[]
  restProps?: RestProps
  extends?: Extends
}

export class ComponentParser {
  private readonly options?: ComponentParserOptions
  private source?: string
  private compiled?: CompiledSvelteCode
  private restProps?: RestProps
  private extends?: Extends
  private readonly reactive_vars: Set<string> = new Set()
  private readonly props: Map<ComponentPropName, ComponentProp> = new Map()
  private readonly slots: Map<ComponentSlotName, ComponentSlot> = new Map()
  private readonly events: Map<ComponentEventName, ComponentEvent> = new Map()
  private readonly typedefs: Map<TypeDefName, TypeDef> = new Map()
  private readonly bindings: Map<ComponentPropName, ComponentPropBindings> = new Map()

  constructor (options?: ComponentParserOptions) {
    this.options = options
  }

  private static mapToArray<K, V>(map: Map<K, V>): V[] {
    return Array.from(map, ([key, value]) => value)
  }

  private static assignValue (value?: '' | string): any {
    return value === undefined || value === '' ? undefined : value
  }

  private static formatComment (comment: string): string {
    let formattedComment = comment

    if (!formattedComment.startsWith('/*')) {
      formattedComment = '/*' + formattedComment
    }

    if (!formattedComment.endsWith('*/')) {
      formattedComment += '*/'
    }

    return formattedComment
  }

  private sourceAtPos (start: number, end: number): string | undefined {
    return this.source?.slice(start, end)
  }

  private collectReactiveVars (): void {
    this.compiled?.vars
      .filter(({ reassigned, writable }) => (reassigned ?? false) && writable)
      .forEach(({ name }) => this.reactive_vars.add(name))
  }

  private addProp (propName: string, data: ComponentProp): void {
    if (ComponentParser.assignValue(propName) === undefined) return

    const existingSlot = this.props.get(propName)
    if (existingSlot !== undefined) {
      this.props.set(propName, {
        ...existingSlot,
        ...data
      })
    } else {
      this.props.set(propName, data)
    }
  }

  private aliasType (type: any): any {
    if (type === '*') return 'any'
    return type
  }

  private addSlot (slotName?: string, slotProps?: string, slotFallback?: string): void {
    const defaultSlot = slotName === undefined || slotName === ''
    const name = getSlotName(defaultSlot, slotName)
    const fallback = ComponentParser.assignValue(slotFallback)
    const props = ComponentParser.assignValue(slotProps)

    const existingSlot = this.slots.get(name)
    if (existingSlot !== undefined) {
      this.updateSlot(name, existingSlot, fallback, props)
    } else {
      this.addNewSlot(name, defaultSlot, fallback, slotProps)
    }
  }

  private addNewSlot (name: string, defaultSlot: boolean, fallback: any, slotProps: string | undefined): void {
    this.slots.set(name, {
      name,
      default: defaultSlot,
      fallback,
      slotProps: slotProps
    })
  }

  private updateSlot (name: string, existingSlot: ComponentSlot, fallback: any, props: any): void {
    this.slots.set(name, {
      ...existingSlot,
      fallback,
      slotProps: existingSlot.slotProps === undefined ? props : existingSlot.slotProps
    })
  }

  private addDispatchedEvent (name?: string, detail?: string): void {
    if (name === undefined) return
    if (this.events.has(name)) {
      this.updateEvent(name, detail)
    } else {
      this.events.set(name, {
        type: 'dispatched',
        name,
        detail: ComponentParser.assignValue(detail)
      })
    }
  }

  private parseCustomTypes (source: string): void {
    commentParser(source).forEach(({ tags }) => {
      tags.forEach(({ tag, type: tagType, name, description }) => {
        const type = this.aliasType(tagType)

        switch (tag) {
          case 'extends':
            this.extends = {
              interface: name,
              import: type
            }
            break
          case 'restProps':
            this.restProps = {
              type: 'Element',
              name: type
            }
            break
          case 'slot':
            this.addSlot(name, type)
            break
          case 'event':
            this.addDispatchedEvent(name, type)
            break
          case 'typedef':
            this.typedefs.set(name, {
              type,
              name,
              description: ComponentParser.assignValue(description),
              ts: /(\}|\};)$/.test(type) ? `interface ${name} ${type as string}` : `type ${name} = ${type as string}`
            })
            break
        }
      })
    })
  }

  private updateEvent (name: string, detail?: string): void {
    const existingEvent = this.events.get(name) as DispatchedEvent

    this.events.set(name, {
      ...existingEvent,
      detail: existingEvent.detail === undefined ? ComponentParser.assignValue(detail) : existingEvent.detail
    })
  }

  public cleanup (): void {
    this.source = undefined
    this.compiled = undefined
    this.restProps = undefined
    this.extends = undefined
    this.reactive_vars.clear()
    this.props.clear()
    this.slots.clear()
    this.events.clear()
    this.typedefs.clear()
    this.bindings.clear()
  }

  public parseSvelteComponent (
    source: string,
    jsSource: string,
    code: CompiledSvelteCode,
    diagnostics: ComponentParserDiagnostics
  ): ParsedComponent {
    if (this.options?.verbose ?? false) {
      process.stdout.write(`[parsing] "${diagnostics.moduleName}" ${diagnostics.filePath}\n`)
    }

    this.cleanup()
    this.source = jsSource
    this.compiled = code
    this.collectReactiveVars()

    // Parse custom types, could override typescript type information
    this.parseCustomTypes(source)

    let dispatcherName: undefined | string = undefined
    const callees: { name: string, arguments: any }[] = []

    walk(this.compiled.ast as unknown as Node, {
      enter: (node, parent, prop) => {
        if (node.type === 'CallExpression') {
          if ((node as any).callee.name === 'createEventDispatcher') {
            dispatcherName = (parent as any)?.id.name
          }

          callees.push({
            name: (node as any).callee.name,
            arguments: (node as any).arguments
          })
        }

        if (node.type === 'Spread' && (node as any)?.expression.name === '$$restProps') {
          if (this.restProps === undefined && (parent?.type === 'InlineComponent' || parent?.type === 'Element')) {
            this.restProps = {
              type: parent.type,
              name: (parent as any).name
            }
          }
        }

        if (node.type === 'ExportNamedDeclaration' && (node as any).declaration != null) {
          const {
            type: declarationType,
            id,
            init,
            body
          } = (node as any).declaration.declarations != null
            ? (node as any).declaration.declarations[0]
            : (node as any).declaration

          const propName = id.name

          let value = undefined
          let type = undefined
          let kind = (node as any).declaration.kind
          let description = undefined
          let isFunction = false
          let isFunctionDeclaration = false

          if (init != null) {
            if (
              init.type === 'ObjectExpression' ||
              init.type === 'BinaryExpression' ||
              init.type === 'ArrayExpression' ||
              init.type === 'ArrowFunctionExpression'
            ) {
              value = this.sourceAtPos(init.start, init.end)?.replace(/\n/g, ' ')
              type = value
              isFunction = init.type === 'ArrowFunctionExpression'

              if (init.type === 'BinaryExpression') {
                if (init?.left.type === 'Literal' && typeof init?.left.value === 'string') {
                  type = 'string'
                }
              }
            } else {
              if (init.type === 'UnaryExpression') {
                value = this.sourceAtPos(init.start, init.end)
                type = typeof init.argument?.value
              } else {
                value = init.raw
                type = init.value == null ? undefined : typeof init.value
              }
            }
          }

          if (declarationType === 'FunctionDeclaration') {
            value = `() => ${this.sourceAtPos(body.start, body.end)?.replace(/\n/g, ' ') ?? '{}'}`
            type = '() => any'
            kind = 'function'
            isFunction = true
            isFunctionDeclaration = true
          }

          if (node.leadingComments != null) {
            const lastComment = node.leadingComments[node.leadingComments.length - 1]
            const comment = commentParser(ComponentParser.formatComment(lastComment.value))
            const tag = comment[0]?.tags[comment[0]?.tags.length - 1]
            if (tag?.tag === 'type') type = this.aliasType(tag.type)
            description = ComponentParser.assignValue(comment[0]?.description)
          }

          if (description === undefined && this.typedefs.has(type)) {
            description = this.typedefs.get(type)?.description
          }

          this.addProp(propName, {
            name: propName,
            kind,
            description,
            type,
            value,
            isFunction,
            isFunctionDeclaration,
            constant: kind === 'const',
            reactive: this.reactive_vars.has(propName)
          })
        }

        if (node.type === 'Slot') {
          const slotName = (node as any).attributes.find((attr: any) => attr.name === 'name')?.value[0].data

          const slotProps = (node as any).attributes
            .filter((attr: { name?: string }) => attr.name !== 'name')
            .reduce((slotProps: SlotProps, { name, value }: { name: string, value?: any }) => {
              const slotPropValue: SlotPropValue = {
                value: undefined,
                replace: false
              }

              if (value[0] != null) {
                const { type, expression, raw, start, end } = value[0]

                if (type === 'Text') {
                  slotPropValue.value = raw
                } else if (type === 'AttributeShorthand') {
                  slotPropValue.value = expression.name
                  slotPropValue.replace = true
                }

                if (expression != null) {
                  if (expression.type === 'Literal') {
                    slotPropValue.value = expression.value
                  } else if (expression.type !== 'Identifier') {
                    if (expression.type === 'ObjectExpression' || expression.type === 'TemplateLiteral') {
                      slotPropValue.value = this.sourceAtPos((start as number) + 1, end - 1)
                    } else {
                      slotPropValue.value = this.sourceAtPos(start, end)
                    }
                  }
                }
              }

              return { ...slotProps, [name]: slotPropValue }
            }, {})

          const fallback = ((node as any).children as TemplateNode[])
            ?.map(({ start, end }) => this.sourceAtPos(start, end))
            .join('')
            .trim()

          this.addSlot(slotName, JSON.stringify(slotProps, null, 2), fallback)
        }

        if (node.type === 'EventHandler' && (node as any).expression == null) {
          if (!this.events.has((node as any).name) && parent !== undefined) {
            this.events.set((node as any).name, {
              type: 'forwarded',
              name: (node as any).name,
              element: (parent as any).name
            })
          }
        }

        if (parent?.type === 'Element' && node.type === 'Binding' && (node as any).name === 'this') {
          const propName = (node as any).expression.name
          const elementName = (parent as any).name

          const existingBindings = this.bindings.get(propName)
          if (existingBindings !== undefined) {
            if (!existingBindings.elements.includes(elementName)) {
              this.bindings.set(propName, {
                ...existingBindings,
                elements: [...existingBindings.elements, elementName]
              })
            }
          } else {
            this.bindings.set(propName, {
              elements: [elementName]
            })
          }
        }
      }
    })

    if (dispatcherName !== undefined) {
      callees.forEach((callee) => {
        if (callee.name === dispatcherName) {
          const eventName = callee.arguments[0]?.value
          const eventDetail = callee.arguments[1]?.value

          this.addDispatchedEvent(eventName, eventDetail)
        }
      })
    }

    return {
      header: [],
      props: ComponentParser.mapToArray(this.props).map((prop) => {
        const bindingProp = this.bindings.get(prop.name)
        if (bindingProp !== undefined) {
          return {
            ...prop,
            type:
              'null | ' +
              bindingProp.elements
                .sort()
                .map((element) => getElementByTag(element))
                .join(' | ')
          }
        }

        return prop
      }),
      slots: ComponentParser.mapToArray(this.slots)
        .map((slot) => {
          try {
            const slotProps: SlotProps = JSON.parse(slot.slotProps ?? '')
            const newProps: string[] = []

            Object.keys(slotProps).forEach((key) => {
              let slotVal = slotProps[key].value
              if (slotProps[key].replace && slotVal !== undefined) {
                slotVal = this.props.get(slotVal)?.type
                slotProps[key].value = slotVal
              }

              if (slotVal === undefined) {
                slotProps[key].value = 'any'
                slotVal = 'any'
              }
              newProps.push(`${key}: ${slotVal}`)
            })

            const formattedSlotProps = newProps.length === 0 ? '{}' : '{ ' + newProps.join(', ') + ' }'

            return { ...slot, slot_props: formattedSlotProps }
          } catch (e) {
            return slot
          }
        })
        .sort((a, b) => {
          if ((a.name as string) < (b.name as string)) return -1
          if ((a.name as string) > (b.name as string)) return 1
          return 0
        }),
      events: ComponentParser.mapToArray(this.events),
      typedefs: ComponentParser.mapToArray(this.typedefs),
      restProps: this.restProps,
      extends: this.extends
    }
  }
}
function getSlotName (defaultSlot: boolean, slotName?: string): string {
  return defaultSlot || slotName === undefined ? DEFAULT_SLOT_NAME : slotName
}
