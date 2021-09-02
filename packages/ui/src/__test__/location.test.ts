import { locationToUrl, Location } from '@anticrm/router'

describe('location', () => {
  it('should translate location to url', () => {
    const loc: Location = {
      path: ['x', 'y']
    }
    const url = locationToUrl(loc)
    expect(url).toBe('/x/y')
  })
})
