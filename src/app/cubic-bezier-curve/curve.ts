import { select } from 'd3-selection';
import { scaleOrdinal } from 'd3-scale';
import { schemeCategory10 } from 'd3-scale-chromatic';
import { CurveFactory, curveNatural } from 'd3-shape';

export interface CurveOptions {
  name: string;
  curve: CurveFactory;
  active: boolean;
  lineString: string;
  clear: boolean;
}

export class Curve {
  svg: any;
  g: any;
  arcLengthsByCurves: number[][] = [];
  categoryScale = scaleOrdinal(schemeCategory10);
  curvesCollection = [];

  // context: any;

  draw(elementsCount = 3, curvesCount, options): void {
    //
    // const canvas: any = document.getElementById('canvas');
    // canvas.width = options.viewport.width;
    // canvas.height = options.viewport.height;
    // this.context = canvas.getContext('2d');

    this.svg = select('#svg-wrapper').append('svg')
      .attr('width', options.viewport.width)
      .attr('height', options.viewport.height);

    this.g = this.svg.append('g')
      .attr('transform', `translate(${options.padding.left}, ${options.padding.top})`);

    this.drawCubic(elementsCount, curvesCount, options);
  }

  update(elementsCount = 3, curvesCount, options): void {
    // this.context.clearRect(0, 0, options.viewport.width, options.viewport.height);

    this.drawCubic(elementsCount, curvesCount, options);
  }

  drawCubic(elementsCount, curvesCount, options): void {
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

//   drawCanvas(curvePoints, i) {
//     // const canvas: any = document.getElementById('canvas');
//     // const context = canvas.getContext('2d');
//
// //  Define the Points as {x,y}
//     const start = { x: curvePoints.start[0] + 10,    y: curvePoints.start[1] + 10 };
//     const cp1 = { x: curvePoints.control1[0] + 10,    y: curvePoints.control1[1] + 10 };
//     const cp2 = { x: curvePoints.control2[0] + 10,    y: curvePoints.control2[1] + 10 };
//     const end = { x: curvePoints.end[0] + 10,    y: curvePoints.end[1] + 10 };
//
// //  Draw Curve
//     this.context.beginPath();
//     this.context.moveTo(start.x, start.y);
//     this.context.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
//     this.context.strokeStyle = this.colorScale(i);
//     this.context.lineWidth = 1;
//     this.context.stroke();
//     this.context.closePath();
//
// //  Draw Start End Points
//     this.context.beginPath();
//     this.context.arc(curvePoints.start[0] + 10, curvePoints.start[1] + 10, 3, 0, 360);
//     this.context.arc(curvePoints.end[0] + 10, curvePoints.end[1] + 10, 3, 0, 360);
//     this.context.fill();
//
//     this.context.closePath();
//     // context.clearRect();
//   }

  // drawCanvasInterpolatedPoints(dataset) {
  //   // const canvas: any = document.getElementById('canvas');
  //   // const context = canvas.getContext('2d');
  //
  //   dataset.forEach(pointCoordinates => {
  //     this.context.beginPath();
  //     this.context.arc(pointCoordinates[0] + 10, pointCoordinates[1] + 10, 4, 0, 360);
  //     this.context.strokeStyle = 'grey';
  //     this.context.stroke();
  //     this.context.closePath();
  //   });
  // }

  drawLine(elementsCount) {
    const curves = this.curvesCollection.map((curvesDataset, curveIndex) => {

      // this.drawCanvas(curvesDataset, curveIndex);

      const curveOptions = Object.assign({}, {
        curve: curveNatural,
        lineString: '',
        clear: true
      });

      this.arcLengthParam(curvesDataset, elementsCount, curveIndex);

      curveOptions.lineString = this.cubicPath(curvesDataset);

      return curveOptions;
    });

    const line = select('svg g')
      .selectAll('path')
      .data(curves);

    line.enter()
      .append('path')
      .merge(line)
      .style('stroke', (curve: CurveOptions, lineIndex: number) => this.colorScale(lineIndex))
      .attr('d', (curve: CurveOptions) => curve.lineString);

    line.exit().remove();

    return line;
  }

  drawPoints(elementsCount): void {
    this.g
      .selectAll('circle')
      .remove();

    this.curvesCollection.forEach((curvePoints, curveIndex) => {
      const interpolatedPoints = this.interpolatePoints((elementsCount - 1), curvePoints, this.arcLengthsByCurves[curveIndex]);
      const points = this.g
        .selectAll('circle.interpolated-point' + curveIndex)
        .data(interpolatedPoints);

      // this.drawCanvasInterpolatedPoints(interpolatedPoints);

      points.enter()
        .append('circle')
        .merge(points)
        .attr('class', 'interpolated-point' + curveIndex)
        .attr('r', (d, i) => {
          if (i === 0 || i === elementsCount - 1) {
            return 3;
          }

          return 5;
        })
        .style('fill', (d, i) => {
          if (i === 0 || i === elementsCount - 1) {
            return 'black';
          }

          return;
        })
        .attr('cx', d => d[0])
        .attr('cy', d => d[1]);

      points.exit().remove();
    });
  }

  cubicPath(c): string {
    return `M${c.start[0]},${c.start[1]} C${c.control1[0]},${c.control1[1]} ${c.control2[0]},${c.control2[1]} ${c.end[0]},${c.end[1]}`;
  }

  map(u, dotsNumber, arcLengths): number {
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

  mx(u, dotsNumber, cubic, arcLengths): number {
    return this.getX(this.map(u, dotsNumber, arcLengths), cubic);
  }

  my(u, dotsNumber, cubic, arcLengths): number {
    return this.getY(this.map(u, dotsNumber, arcLengths), cubic);
  }

  getX(t, cubic): number {
    return ((1 - t) * (1 - t) * (1 - t)) * cubic.start[0]
      + 3 * ((1 - t) * (1 - t)) * t * cubic.control1[0]
      + 3 * (1 - t) * (t * t) * cubic.control2[0]
      + (t * t * t) * cubic.end[0];
  }

  getY(t, cubic): number {
    return ((1 - t) * (1 - t) * (1 - t)) * cubic.start[1]
      + 3 * ((1 - t) * (1 - t)) * t * cubic.control1[1]
      + 3 * (1 - t) * (t * t) * cubic.control2[1]
      + (t * t * t) * cubic.end[1];
  }

  arcLengthParam(cubic, dotsNumber, curveIndex): void {
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

  generateControlPoints(width, height, index): { c1: number[], c2: number[] } {
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

  interpolatePoints(dotsNumber, cubic, arcLengths): number[] {
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
