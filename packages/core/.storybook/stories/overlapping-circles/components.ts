import { Component } from '@recs/core';
import { Vector2 } from './utils';

export class Movement extends Component {
  velocity: Vector2;
  acceleration: Vector2;

  construct(): void {
    this.velocity = new Vector2();
    this.acceleration = new Vector2();
  }
}

export class Circle extends Component {
  position: Vector2;
  radius: number;
  velocity: Vector2;
  acceleration: Vector2;

  construct(): void {
    this.position = new Vector2();
    this.velocity = new Vector2();
    this.acceleration = new Vector2();
    this.radius = 0;
  }
}

export class CanvasContext extends Component {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
}

export class Intersecting extends Component {
  points: [number, number, number, number][];

  construct(): void {
    this.points = [];
  }
}
