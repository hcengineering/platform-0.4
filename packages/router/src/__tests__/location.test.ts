import { locationToUrl, parsePath, parseQuery } from '../location'
import { Location } from '..'

describe('location', () => {
  it('should translate location to url', () => {
    const loc: Location = {
      path: ['x', 'y'],
      fragment: 'qwe',
      query: { a: 'a' }
    }
    const url = locationToUrl(loc)
    expect(url).toBe('/x/y?a=a#qwe')
  })
  it('should translate null query value', () => {
    const loc: Location = {
      path: ['x', 'y'],
      fragment: 'qwe',
      query: { a: 'a', b: null }
    }
    const url = locationToUrl(loc)
    expect(url).toBe('/x/y?a=a&b#qwe')
  })

  it('parse empty query', () => {
    const url = parseQuery('')
    expect(Object.keys(url).length).toBe(0)
  })
  it('parse empty? query', () => {
    const url = parseQuery('?')
    expect(Object.keys(url).length).toBe(0)
  })

  it('parse path', () => {
    const url = parsePath('/abc/')
    expect(url.length).toBe(1)
  })
})
