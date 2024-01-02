/** @format */

export class Queue<T> {
  items: T[];

  constructor(...params: T[]) {
    console.log(params);
    // this.items = [...params];
    this.items = [];
  }
  enqueue(item: T) {
    return this.items.push(item);
  }
  dequeue() {
    return this.items.shift();
  }
  isEmpty() {
    return this.items.length == 0;
  }
}

export type Coordinate = {
  x: number;
  y: number;
};
