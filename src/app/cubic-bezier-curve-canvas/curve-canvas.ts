import { scaleOrdinal } from 'd3-scale';
import { schemeCategory10 } from 'd3-scale-chromatic';

export interface ViewOptions {
  viewport: {
    width: number;
    height: number;
  };
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface CubicParams {
  start: [number, number];
  control1: [number, number];
  control2: [number, number];
  end: [number, number];
}

export class CurveCanvas {
  arcLengthsByCurves: number[][] = [];
  categoryScale = scaleOrdinal(schemeCategory10);
  curvesCollection = [];
  context: CanvasRenderingContext2D;

  draw(elementsCount = 3, curvesCount: number, options: ViewOptions): void {
    const canvas: any = document.getElementById('canvas');
    canvas.width = options.viewport.width;
    canvas.height = options.viewport.height;
    this.context = canvas.getContext('2d');

    this.drawCubic(elementsCount, curvesCount, options);
  }

  update(elementsCount = 3, curvesCount: number, options: ViewOptions): void {
    this.context.clearRect(0, 0, options.viewport.width, options.viewport.height);

    this.drawCubic(elementsCount, curvesCount, options);
  }

  drawCubic(elementsCount: number, curvesCount: number, options: ViewOptions): void {
    const offsetX = options.padding.left;
    const offsetY = options.padding.top;
    const width = options.viewport.width - offsetX * 2;
    const height = options.viewport.height - offsetY * 2;

    for (let ac = this.curvesCollection.length; ac < curvesCount; ac++) {
      this.curvesCollection[ac] = {
        start: [0, 0],
        end: [width, height],
        control1: this.generateControlPoints(width, height, ac).c1,
        control2: this.generateControlPoints(width, height, ac).c2
      };
    }

    if (curvesCount < this.curvesCollection.length) {
      for (let rc = this.curvesCollection.length; rc > curvesCount; rc--) {
        this.curvesCollection.pop();
      }
    }

    this.curvesCollection.map(dataset => {
      if (dataset.end[0] === width && dataset.end[1] === height) {
        return;
      }

      const getDeltaX = Math.abs(width - dataset.end[0]);
      const getDeltaY = Math.abs(height - dataset.end[1]);

      dataset.control2[0] = dataset.end[0] > width ? dataset.control2[0] - getDeltaX : dataset.control2[0] + getDeltaX;
      dataset.control2[1] = dataset.end[1] > height ? dataset.control2[1] - getDeltaY : dataset.control2[1] + getDeltaY;

      dataset.end[0] = width;
      dataset.end[1] = height;
    });

    this.drawLine(elementsCount);
    this.drawPoints(elementsCount);
  }

  drawCanvas(curvePoints: CubicParams, i: number): void {
//  Define the Control Points as {x,y}
    const start = { x: curvePoints.start[0] + 10, y: curvePoints.start[1] + 10 };
    const cp1 = { x: curvePoints.control1[0] + 10, y: curvePoints.control1[1] + 10 };
    const cp2 = { x: curvePoints.control2[0] + 10, y: curvePoints.control2[1] + 10 };
    const end = { x: curvePoints.end[0] + 10, y: curvePoints.end[1] + 10 };

//  Draw Curve
    this.context.beginPath();
    this.context.moveTo(start.x, start.y);
    this.context.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
    this.context.strokeStyle = this.colorScale(i);
    this.context.lineWidth = 1;
    this.context.stroke();
    this.context.closePath();

//  Draw Start End Points
    this.context.beginPath();
    this.context.arc(curvePoints.start[0] + 10, curvePoints.start[1] + 10, 3, 0, 2 * Math.PI, true);
    this.context.arc(curvePoints.end[0] + 10, curvePoints.end[1] + 10, 3, 0, 2 * Math.PI, true);
    this.context.fillStyle = 'black';
    this.context.fill();
    this.context.closePath();
  }

  drawCanvasInterpolatedPoints(pointsDataset: number[]): void {
    pointsDataset
      .filter((point, pointIndex) => pointIndex !== 0 && pointIndex !== pointsDataset.length - 1)
      .forEach(pointCoordinates => {
      this.context.beginPath();
      this.context.arc(pointCoordinates[0] + 10, pointCoordinates[1] + 10, 4, 0, 2 * Math.PI, true);
      this.context.strokeStyle = 'grey';
      this.context.fillStyle = 'white';
      this.context.fill();
      this.context.stroke();
      this.context.closePath();
    });
  }

  drawLine(elementsCount: number): void {
    this.curvesCollection.map((curvesDataset, curveIndex) => {
      this.drawCanvas(curvesDataset, curveIndex);
      this.arcLengthParam(curvesDataset, elementsCount, curveIndex);
    });
  }

  drawPoints(elementsCount: number): void {
    this.curvesCollection.forEach((curvePoints, curveIndex) => {
      const interpolatedPoints = this.interpolatePoints((elementsCount - 1), curvePoints, this.arcLengthsByCurves[curveIndex]);

      this.drawCanvasInterpolatedPoints(interpolatedPoints);
    });
  }

  map(u: number, dotsNumber: number, arcLengths: number[]): number {
    const targetLength = u * arcLengths[dotsNumber];
    let low = 0;
    let high = dotsNumber;
    let index = 0;

    while (low < high) {
      index = low + (((high - low) / 2) | 0);

      if (arcLengths[index] < targetLength) {
        low = index + 1;

      } else {
        high = index;
      }
    }
    if (arcLengths[index] > targetLength) {
      index--;
    }

    const lengthBefore = arcLengths[index];
    if (lengthBefore === targetLength) {
      return index / dotsNumber;

    } else {
      return (index + (targetLength - lengthBefore) / (arcLengths[index + 1] - lengthBefore)) / dotsNumber;
    }
  }

  mx(u: number, dotsNumber: number, cubic: CubicParams, arcLengths: number[]): number {
    return this.getX(this.map(u, dotsNumber, arcLengths), cubic);
  }

  my(u: number, dotsNumber: number, cubic: CubicParams, arcLengths: number[]): number {
    return this.getY(this.map(u, dotsNumber, arcLengths), cubic);
  }

  getX(t: number, cubic: CubicParams): number {
    return ((1 - t) * (1 - t) * (1 - t)) * cubic.start[0]
      + 3 * ((1 - t) * (1 - t)) * t * cubic.control1[0]
      + 3 * (1 - t) * (t * t) * cubic.control2[0]
      + (t * t * t) * cubic.end[0];
  }

  getY(t: number, cubic: CubicParams): number {
    return ((1 - t) * (1 - t) * (1 - t)) * cubic.start[1]
      + 3 * ((1 - t) * (1 - t)) * t * cubic.control1[1]
      + 3 * (1 - t) * (t * t) * cubic.control2[1]
      + (t * t * t) * cubic.end[1];
  }

  arcLengthParam(cubic: CubicParams, dotsNumber: number, curveIndex: number): void {
    this.arcLengthsByCurves[curveIndex] = new Array(dotsNumber + 1);
    this.arcLengthsByCurves[curveIndex][0] = 0;

    let ox = this.getX(0, cubic);
    let oy = this.getY(0, cubic);
    let clen = 0;

    for (let i = 1; i <= dotsNumber; i++) {
      const x = this.getX(i / (dotsNumber - 1), cubic);
      const y = this.getY(i / (dotsNumber - 1), cubic);

      const dx = ox - x;
      const dy = oy - y;

      clen += Math.sqrt(dx * dx + dy * dy);

      ox = x;
      oy = y;

      this.arcLengthsByCurves[curveIndex][i] = clen;
    }
  }

  generateControlPoints(width: number, height: number, index: number): { c1: number[], c2: number[] } {
    let c1 = [0, 0];
    let c2 = [0, 0];

    if (index === 0) {
      c1 = [(width / 2), 0];
      c2 = [(width / 2), height];
    }

    if (index % 2 === 0) {
      c1 = [(width / 2) + index * 100, 0];
      c2 = [(width / 2) - index * 100, height];
    }

    if (index % 2 === 1) {
      c1 = [(width / (2 + 1)) + index * 100, 0];
      c2 = [(width / 2) - index * 100, height];
    }

    if (index % 3 === 0 && index % 2 !== 0) {
      c1 = [(width / index * 2) - index * 100, 0];
      c2 = [(width / index) + index * 100, height];
    }

    return {c1, c2};
  }

  interpolatePoints(dotsNumber: number, cubic: CubicParams, arcLengths: number[]): number[] {
    const points = [];

    for (let i = 0; i <= dotsNumber; i++) {
      points[i] = [
        this.mx(i / dotsNumber, dotsNumber, cubic, arcLengths),
        this.my(i / dotsNumber, dotsNumber, cubic, arcLengths)
      ];
    }

    return points;
  }

  colorScale(curveIndex: number): string {
    return curveIndex === 0 ? '#777' : this.categoryScale(curveIndex.toString());
  }
}
