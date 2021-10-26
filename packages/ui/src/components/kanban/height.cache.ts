export class HeightCache {
  private readonly heights: Map<number, number> = new Map()

  setHeight (idx: number, height: number): void {
    this.heights.set(idx, height)
  }

  unsetHeight (idx: number): void {
    this.heights.delete(idx)
  }

  private get avg (): number {
    if (this.heights.size === 0) {
      return 50
    }

    return [...this.heights.values()].reduce((r, x) => r + x, 0) / this.heights.size
  }

  getHeight = (idx: number): number => this.heights.get(idx) ?? this.avg
}
