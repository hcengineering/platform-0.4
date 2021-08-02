// original from https://github.com/IBM/sveld/blob/main/src/writer/writer-ts-definitions.ts
// License: Apache License 2.0
// License: EPL-2.0

import { ComponentEvent, ComponentProp, ParsedComponent } from './componentParser'
import { eventsMap } from './eventMap'

const ANY_TYPE = 'any'
const EMPTY_STR = ''

type ComponentDocApi = ParsedComponent & {
  filePath: string
  moduleName: string
}

export function formatTsProps (props?: string): string {
  if (props === undefined) return ANY_TYPE
  return props + '\n'
}

export function getTypeDefs (def: Pick<ComponentDocApi, 'typedefs'>): string {
  if (def.typedefs.length === 0) return EMPTY_STR
  return def.typedefs.map((typedef) => `export ${typedef.ts}`).join('\n\n')
}

function clampKey (key: string): string {
  if (/(-|\s+|:)/.test(key)) {
    return /("|')/.test(key) ? key : `["${key}"]`
  }

  return key
}

function addCommentLine (value: any, returnValue?: any): string | undefined {
  return value == null ? undefined : `* ${(returnValue ?? value) as string}\n`
}

type PartialComponentDef = Omit<ComponentDocApi, 'header' | 'slots' | 'typedefs' | 'events' | 'filePath'>

function genPropDef (def: PartialComponentDef): {
  propsName: string
  propDef: string
} {
  const props = filterVariableProps(def)

  const propsName = `${def.moduleName}Props`

  let propDef = EMPTY_STR

  if (def.restProps?.type === 'Element') {
    propDef = handleElementProp(def, def.restProps?.name, propsName, props)
  } else {
    propDef = `
    export interface ${propsName} ${def.extends !== undefined ? `extends ${def.extends.interface}` : ''} {
      ${props}
    }
  `
  }

  return {
    propsName: propsName,
    propDef: propDef
  }
}

function handleElementProp (def: PartialComponentDef, name: string, propsName: string, props: string): string {
  const extendTagMap = name
    .split('|')
    .map((name) => `svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["${name.trim()}"]>`)
    .join(',')

  return `
    export interface ${propsName} extends ${
    def.extends !== undefined ? `${def.extends.interface}, ` : ''
  }${extendTagMap} {
      ${props}
    }
  `
}

function filterVariableProps (def: Pick<ComponentDocApi, 'props' | 'restProps' | 'moduleName' | 'extends'>): string {
  return def.props
    .filter((prop) => !prop.isFunctionDeclaration && prop.kind !== 'const')
    .map((prop) => extractPropDef(prop))
    .join('\n')
}

function extractPropDef (prop: ComponentProp): string {
  const propComments = genProps(prop)

  const propValue = prop.constant && !prop.isFunction ? prop.value : prop.type

  return `
      ${propComments.length > 0 ? `/**\n${propComments}*/` : EMPTY_STR}
      ${prop.name}?: ${propValue as string};`
}

function formatProp (prop: ComponentProp): string {
  return `@default ${typeof prop.value === 'string' ? prop.value.replace(/\s+/g, ' ') : (prop.value as string)}`
}

function genSlotDef (def: Pick<ComponentDocApi, 'slots'>): string {
  return def.slots
    .map(({ name, slotProps, ...rest }) => {
      const key = rest.default ? 'default' : clampKey(name as string)
      return `${clampKey(key)}: ${formatTsProps(slotProps)};`
    })
    .join('\n')
}

function genEventDef (def: Pick<ComponentDocApi, 'events'>): string {
  return def.events.map((e) => convertEvent(e)).join('\n')
}

function convertEvent (event: ComponentEvent): string {
  return `${clampKey(event.name)}: ${
    event.type === 'dispatched' || !eventsMap.has(event.name)
      ? `CustomEvent<${((event as any)?.detail as string) ?? ANY_TYPE}>`
      : `WindowEventMap["${event.name}"]`
  };`
}

function genAccessors (def: Pick<ComponentDocApi, 'props'>): string {
  return def.props
    .filter(isFunctionProp)
    .map((prop) => {
      const propComments = genProps(prop)
      return `
    ${propComments.length > 0 ? `/**\n${propComments}*/` : EMPTY_STR}
    ${prop.name}: ${prop.type as string};`
    })
    .join('\n')
}

function isFunctionProp (prop: ComponentProp): boolean {
  return prop.isFunctionDeclaration || prop.kind === 'const'
}

function genProps (prop: ComponentProp): string {
  return [
    addCommentLine(prop.description?.replace(/\n/g, '\n* ')),
    addCommentLine(prop.constant, '@constant'),
    addCommentLine(prop.value, formatProp(prop))
  ]
    .filter(Boolean)
    .join('')
}

function genImports (def: Pick<ComponentDocApi, 'extends'>): string {
  if (def.extends === undefined) return ''
  return `import { ${def.extends.interface} } from ${def.extends.import};`
}

export function writeTsDefinition (component: ComponentDocApi): string {
  const { moduleName, typedefs, props, slots, events, restProps, extends: _extends } = component
  const { propsName, propDef } = genPropDef({
    moduleName,
    props,
    restProps,
    extends: _extends
  })

  return `
  // eslint-disable-next-line
  /// <reference types="svelte" />
  import { SvelteComponentTyped } from "svelte";
  ${genImports({ extends: _extends })}
  ${component.header.join('\n')}  
  ${getTypeDefs({ typedefs })}
  ${propDef}
  export default class ${moduleName === 'default' ? '' : moduleName} extends SvelteComponentTyped<
      ${propsName},
      {${genEventDef({ events })}},
      {${genSlotDef({ slots })}}
    > {
      ${genAccessors({ props })}
    }`
}
