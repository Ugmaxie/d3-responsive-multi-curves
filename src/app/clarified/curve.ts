import * as d3 from 'd3';
import { CurveOptions } from 'src/app/optional/optional.component';

export class Curve {
  svg: any;
  g: any;

  arcLengthsByCurves: any[] = [];
  categoryScale = d3.scaleOrdinal(d3.schemeCategory10);
  curvesCollection = [];

  draw(elementsCount, curvesCount, options): void {
    this.svg = d3.select('#svg-wrapper').append('svg')
      .attr('width', options.viewport.width)
      .attr('height', options.viewport.height);

    this.g = this.svg.append('g')
      .attr('transform', `translate(${options.padding.left}, ${options.padding.top})`);

    this.drawCubic(elementsCount, curvesCount, options);
  }

  update(elementsCount, curvesCount, options): void {
    this.drawCubic(elementsCount, curvesCount, options);
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
      const x = this.getX(i / dotsNumber, cubic);
      const y = this.getY(i / dotsNumber, cubic);

      const dx = ox - x;
      const dy = oy - y;

      clen += Math.sqrt(dx * dx + dy * dy);

      ox = x;
      oy = y;

      this.arcLengthsByCurves[curveIndex][i] = clen;
    }
  }

  getRandomInt(max): number {
    return Math.floor(Math.random() * Math.floor(max)) / 3;
  }

  generateControlPoints(width, height, index) {
    let c1 = [0, 0];
    let c2 = [0, 0];

    // let c1 = [(width / this.getRandomInt(100)), 0];
    // let c2 = [(width / this.getRandomInt(100)), height];

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

  drawLine(elementsCount) {
    const curves = this.curvesCollection.map((dataset, index) => {
      const curveOptions = Object.assign({}, {
        name: 'curveNatural',
        curve: d3.curveNatural,
        lineString: '',
        clear: true
      });

      this.arcLengthParam(dataset, elementsCount, index);

      curveOptions.lineString = this.cubicPath(dataset);

      return curveOptions;
    });

    const line = d3.select('svg g')
      .selectAll('path')
      .data(curves);

    line.enter()
      .append('path')
      .merge(line)
      .style('stroke', (curve: CurveOptions, lineIndex: number) => this.colorScale(lineIndex))
      .attr('d', (curve: CurveOptions) => curve.lineString);

    line.exit().remove();

    // this.drawPoints(elementsCount);

    return line;
  }

  drawCubic(elementsCount, curvesCount, options): void {
    const offsetX = options.padding.left;
    const offsetY = options.padding.top;
    const width = options.viewport.width - offsetX * 2;
    const height = options.viewport.height - offsetY * 2;

    for (let ac = this.curvesCollection.length; ac < curvesCount; ac++) {
      const cubic = {
        start: [0, 0],
        end: [width, height],
        control1: this.generateControlPoints(width, height, ac).c1,
        control2: this.generateControlPoints(width, height, ac).c2
      };
      this.curvesCollection.push(cubic);
    }

    if (curvesCount < this.curvesCollection.length) {
      for (let rc = this.curvesCollection.length; rc > curvesCount; rc--) {
        this.curvesCollection.pop();
      }
    }

    this.curvesCollection.map((dataset, index) => {
      console.log('dataset.end', index, dataset.end);
      console.log('w h ', index, width, height);

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

    // const offsetX = options.padding.left;
    // const offsetY = options.padding.top;
    // const width = options.viewport.width - offsetX * 2;
    // const height = options.viewport.height - offsetY * 2;
    //
    // const cubic = {
    //   start: [0, 0],
    //   end: [width, height],
    //   control1: [width / 2, 0],
    //   control2: [width / 2, height]
    //   // control1: this.generateControlPoints(width, height).c1,
    //   // control2: this.generateControlPoints(width, height).c2
    // };
    //
    //
    // console.log(elementsCount);
    //
    // this.arcLengthParam(cubic, elementsCount);
    // this.drawPoints(cubic, elementsCount);
    //
    // const gCubic = this.g;
    // gCubic.append('g')
    //   .attr('class', 'cubic')
    //   .attr('transform', `translate(${offsetX / 2}, ${offsetY / 2})`);
    //
    // this.g.select('.end-point').remove();
    // this.g.select('.control-point-1').remove();
    // this.g.select('.control-point-2').remove();
    // this.g.select('.curve').remove();
    //
    // // draw the points
    // gCubic.append('circle')
    //   .attr('r', 3)
    //   .attr('class', 'start-point')
    //   .style('fill', 'black')
    //   .attr('cx', cubic.start[0])
    //   .attr('cy', cubic.start[1]);
    //
    // gCubic.append('circle')
    //   .attr('r', 3)
    //   .attr('class', 'end-point')
    //   .style('fill', 'black')
    //   .attr('cx', cubic.end[0])
    //   .attr('cy', cubic.end[1]);
    //
    // gCubic.append('circle')
    //   .attr('class', 'cubic')
    //   .attr('r', 3)
    //   .attr('class', 'control-point-1')
    //   .attr('cx', cubic.control1[0])
    //   .attr('cy', cubic.control1[1]);
    //
    // gCubic.append('circle')
    //   .attr('class', 'cubic')
    //   .attr('r', 3)
    //   .attr('class', 'control-point-2')
    //   .attr('cx', cubic.control2[0])
    //   .attr('cy', cubic.control2[1]);
    //
    // // draw the path
    // gCubic.append('path')
    //   .attr('class', 'curve')
    //   .style('stroke', (curve: CurveOptions, lineIndex: number) => this.colorScale(lineIndex))
    //   .attr('d', this.cubicPath(cubic));
    //
    // return gCubic;
  }

  interpolatePoints(dotsNumber, cubic, arcLengths): number[] {
    const points = [];

    for (let i = 0; i <= dotsNumber; i++) {
      const nextPoint = [
        this.mx(i / dotsNumber, dotsNumber, cubic, arcLengths),
        this.my(i / dotsNumber, dotsNumber, cubic, arcLengths)
      ];

      points.push(nextPoint);
    }

    return points;
  }

  drawPoints(elementsCount): void {
    this.g
      .selectAll('circle')
      .remove();

    this.curvesCollection.forEach((curvePoints, curveIndex) => {
      const interpolatedPoints = this.interpolatePoints((elementsCount - 1), curvePoints, this.arcLengthsByCurves[curveIndex]);

      console.log('drawPoints [x,y]', curveIndex, interpolatedPoints);

      const points = this.g
        .selectAll('circle.interpolated-point' + curveIndex)
        .data(interpolatedPoints);

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

    // const interpolatedPoints = this.interpolatePoints((elementsCount - 1), cubic);
    //
    // const points = this.g
    //   .selectAll('.interpolated-point')
    //   .data(interpolatedPoints);
    //
    // points.enter()
    //   .append('circle')
    //   .merge(points)
    //   .attr('class', 'interpolated-point')
    //   .attr('r', (d, i) => {
    //     if (i === 0 || i === elementsCount - 1) {
    //       return 3;
    //     }
    //
    //     return 5;
    //   })
    //   .style('fill', (d, i) => {
    //     if (i === 0 || i === elementsCount - 1) {
    //       return 'black';
    //     }
    //
    //     return;
    //   })
    //   .attr('cx', d => d[0])
    //   .attr('cy', d => d[1]);
    //
    // points.exit().remove();
  }

  colorScale(curveIndex: number): string {
    return curveIndex === 0 ? '#777' : this.categoryScale(curveIndex.toString());
  }
}
