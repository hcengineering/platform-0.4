# Routing docs

General information about how routing could be used with Anticrm Platform enabled products.

## Basics

Platform accept URI in format `https://host:port/{path}?{query}#{fragment}` protocol, host and port are handled by browser itself, so we had accessed to:

- {_path_} - a list of segments delimited by '**/**'.
- {_query_} - a map of key=value pairs between **?** and **#** (or end of URI) delimited by '**&**'
- {_fragment_} - any string representing fragment after **#** of URI.

## Basic Routing.

Platform had few useful APIs to subscribe for a structured browser location or use a type safe routing chain.
It is still possible to use raw browser location, so no restrictions, but we think structured approach is a way better.

### Browser Location and navigation.

As first step to typed/structured routing platform had a _Location_ interface to represent its logical structure.

It could be used for basic routing and parameter matching, it is a simple step from a pure URI string representation and in compere to full URI it has no information about host, port or protocol.

 All of this are browser responsibility and we do not think about them in platform application navigation.

```typescript
export interface Location {
  // A useful path value
  path: string[] 
  
  // a value of query parameters, no duplication are supported, null determine query parameter without value
  query: Record<string, string | null> 
  
  // a value of fragment
  fragment: string 
}
```

To start use a current _Location_ we should yse @anticrm/ui plugin APIs and '@anticrm/router definitions.
Following API calls are usefull with a `Location`:

- location - svelte enabled writable store, holding a current Location object and automatically updated.
  - subscribe - subscribe for a location, pass a handler to be informed about location changes. Will be triggered on subscribe as well.
- navigate() - navigate to a full new location.
- getCurrentLocation() - return a newly parsed location object.

## Routing component chain.

Alternative to parsed Location Platform has a typed ApplicationRouter<T> implemenation with a pattern based router to match Location patameetrs to passed interface fields. 

It could be constructed using`newRouter<T>(pattern, matcher, defaults) `global call. 
Following calls are available only from inside Svelte components since they use current context and set a newly created router into context to make a chain of router. Alternatively `getRouter<T>` could be used to obtain a current router defined in context.
It is possible to pass multiple `Routes` to current router definition, so they will be matched based on `path` part of pattern. 

A general idea of routing with using ApplicationRouter is to specify a `pattern` with format `{segmentAttr}/../{segmentAttrN}?{queryAttr1}&..&{queryAttrN}#{fragmentAttr}` and a typescript interface to assign this matched values to.

So every router will take a list of routes as list segments and take some query values and fragment, and if URI is have more information it will be passed to next chain of routers.(only one Route will be selected on every chain segment).
Components will work with structured information of required parameters or their default values.

Since routers are always had current set of values and hold information of previous and next ones, we are capable to reconstruct a full URI if we want to change some of attributes. It is become type safe and easy to use approach.

## Platform default routing

Platform has a top level component Root.svelte defailed with a initial component application routing. 
It accepts first path segment and retrieve a metadata object with pattern defined by `applicationShortcutKey()` and `defaultApplicationShortcutKey()`, so if some of plugins are define such metadata with a component resource identifier, it wiill be used by platform as starting point. 

Examle of how top level component routing could be used:

```typescript
setMetadata(applicationShortcutKey('workbench'), workbench.component.WorkbenchApp)
setMetadata(defaultApplicationShortcutKey(), 'workbench')
```

Following line will define a top level application as workbench.

## Workbench routing

Workbench is a default extensible application defined for platform, it integrate all other plugin extensions to usable user exprience. 
It support a wide range of extensions, here we will talk only on basic routing used for Workbench top level component.

As we see `/workbench/` URI is used to go for Workbench component as shortcut.

Workbench for now uses following routing parameters.

```typescript
export interface WorkbenchRoute {
  app?: Ref<Application>
  space?: Ref<Space>
  itemId?: Ref<Doc>
}
```

Workbench is suppose application selection, for every application it could be space selected, and itemId determine an element of sidebar document opened.

## Application routing

Any application component could also benefit from using ApplicationRouter<T> by defining its parameters as typescript interface and construct a router inside Svelte component as on example:

```typescript
import { newRouter } from '@anticrm/platform-ui'
interface MyRouteParameters {
  filter: string
  objId: string
  sorting: string
  order?: string
}
const router = newRouter<MyRouteParameters>(
  '{filter}/{objId}?{sorting}&{order}',
  (match) => {
    // match will be interface MyRouteParameters with
  },
  { sorting: 'ABC', filter: 'all-issues', objId: '#none' }
)
```

So after router is constructed on every URI change its matching function will be called with a new matched values as interface passed to router constructor. Also it is possible to pass default values, so it will be pretty easy to write less code.



## ApplicationRouter<T> interface

```typescript
/**
 * Could be registered to provide platform a way to decide about routes from Root component.
 * @public
 */
export interface ApplicationRouter<T> {
  /**
   * Construct a full new location based on values of T, could apply values to any router in tier chain.
   * Other values will be taken from stored parent and child routers.
   *
   * if some of router is not matched, then it will be skipped.
   */
  location: (values: T) => Location

  /**
   * Use new constructed location value and platform UI to navigate.
   */
  navigate: (values: T) => void

  /**
   * Add a new route to router.
   */
  addRoute: <P>(patternText: string, matcher: (match: P) => void, defaults: P) => ApplicationRouter<P>
}
```

* locaton - construct a current location object from already parsed values.

* navigate - navigate to new location from parameters passed, it is possible to cast router from T to `any` and pass parameters for all chain, or it is possible to cast for router parameters we know for type safety, or hold a reference to router with required type.
  navigate will automatically select first route as matched, if it is not.

* addRoute - could be used to add one or more route matches to default one passed. Every routes will be used to match based on path segment only, so it is possible to add routes like:

  ```
  - /section1/:param1
  - /section2:/param2
  - :param3/section3
  ```

  Matching will be started from first route and other will be checked if first one path is not matched. Defaults passed have influence to match path.
  `navigate` method will automatically select an route to be matched and use it for current router chain.



### Router life cycle

After we construct router it will be registered to Svelte context, so any child component could re-use it for passing parameters, but be aware to construct a direct line of router chains, since it will work only for one parent to child chain of routers.

### Navigete using constructed router

Naviget is quite simple, just call

```typescript
router.navigate({ filter: 'my-new-filter' })
```

And it will update current browser history with a new URI with filter value replaced and call match function to update our needs.
