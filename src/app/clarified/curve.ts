import * as d3 from 'd3';

export class Curve {
  svg: any;
  g: any;
  arcLengths: number[];

  draw(elementsCount, options): void {
    this.svg = d3.select('#svg-wrapper').append('svg')
      .attr('width', options.dimentions.width)
      .attr('height', options.dimentions.height);

    this.g = this.svg.append('g')
      .attr('transform', `translate(${options.padding.left}, ${options.padding.top})`);

    this.drawCubic(elementsCount, options);
  }

  update(elementsCount, options) {
    this.drawCubic(elementsCount, options);
  }

  cubicPath(c) {
    return `M${c.start[0]},${c.start[1]} C${c.control1[0]},${c.control1[1]} ${c.control2[0]},${c.control2[1]} ${c.end[0]},${c.end[1]}`;
  }

  map(u, dotsNumber) {
    const targetLength = u * this.arcLengths[dotsNumber];
    let low = 0;
    let high = dotsNumber;

    let index = 0;

    while (low < high) {
      index = low + (((high - low) / 2) | 0);

      if (this.arcLengths[index] < targetLength) {
        low = index + 1;

      } else {
        high = index;
      }
    }
    if (this.arcLengths[index] > targetLength) {
      index--;
    }

    const lengthBefore = this.arcLengths[index];
    if (lengthBefore === targetLength) {
      return index / dotsNumber;

    } else {
      return (index + (targetLength - lengthBefore) / (this.arcLengths[index + 1] - lengthBefore)) / dotsNumber;
    }
  }


  mx(u, dotsNumber, cubic) {
    return this.x(this.map(u, dotsNumber), cubic);
  }

  my(u, dotsNumber, cubic) {
    return this.y(this.map(u, dotsNumber), cubic);
  }

  x(t, cubic) {
    return ((1 - t) * (1 - t) * (1 - t)) * cubic.start[0]
      + 3 * ((1 - t) * (1 - t)) * t * cubic.control1[0]
      + 3 * (1 - t) * (t * t) * cubic.control2[0]
      + (t * t * t) * cubic.end[0];
  }

  y(t, cubic) {
    return ((1 - t) * (1 - t) * (1 - t)) * cubic.start[1]
      + 3 * ((1 - t) * (1 - t)) * t * cubic.control1[1]
      + 3 * (1 - t) * (t * t) * cubic.control2[1]
      + (t * t * t) * cubic.end[1];
  }

  arcLengthParam(cubic, dotsNumber) {
    this.arcLengths = new Array(dotsNumber + 1);
    this.arcLengths[0] = 0;

    let ox = this.x(0, cubic);
    let oy = this.y(0, cubic);
    let clen = 0;

    for (let i = 1; i <= dotsNumber; i++) {
      const x = this.x(i / dotsNumber, cubic);
      const y = this.y(i / dotsNumber, cubic);

      const dx = ox - x;
      const dy = oy - y;

      clen += Math.sqrt(dx * dx + dy * dy);

      ox = x;
      oy = y;

      this.arcLengths[i] = clen;
    }
  }

  drawCubic(elementsCount, options) {
    const offsetX = options.padding.left;
    const offsetY = options.padding.top;
    const width = options.dimentions.width - offsetX * 2;
    const height = options.dimentions.height - offsetY * 2;

    const cubic = {
      start: [0, 0],
      end: [width, height],
      control1: [width / 2, 0],
      control2: [width / 3, height]
    };

    this.arcLengthParam(cubic, elementsCount );
    this.drawPoints(cubic, elementsCount);

    const gCubic = this.g;
    gCubic.append('g')
      .attr('class', 'cubic')
      .attr('transform', `translate(${offsetX / 2}, ${offsetY / 2})`);

    this.g.select('.end-point').remove();
    this.g.select('.control-point-1').remove();
    this.g.select('.control-point-2').remove();
    this.g.select('.curve').remove();

    // draw the points
    gCubic.append('circle')
      .attr('r', 3)
      .attr('class', 'start-point')
      .style('fill', 'black')
      .attr('cx', cubic.start[0])
      .attr('cy', cubic.start[1]);

    gCubic.append('circle')
      .attr('r', 3)
      .attr('class', 'end-point')
      .style('fill', 'black')
      .attr('cx', cubic.end[0])
      .attr('cy', cubic.end[1]);

    gCubic.append('circle')
      .attr('class', 'cubic')
      .attr('r', 3)
      .attr('class', 'control-point-1')
      .attr('cx', cubic.control1[0])
      .attr('cy', cubic.control1[1]);

    gCubic.append('circle')
      .attr('class', 'cubic')
      .attr('r', 3)
      .attr('class', 'control-point-2')
      .attr('cx', cubic.control2[0])
      .attr('cy', cubic.control2[1]);

    // draw the path
    gCubic.append('path')
      .attr('class', 'curve')
      .style('stroke', 'black')
      .attr('d', this.cubicPath(cubic));

    return gCubic;
  }

  interpolatePoints(dotsNumber, cubic) {
    const points = [];

    for (let i = 0; i <= dotsNumber; i++) {
      const nextPoint = [
        this.mx(i / dotsNumber, dotsNumber, cubic),
        this.my(i / dotsNumber, dotsNumber, cubic)
      ];

      points.push(nextPoint);
    }

    return points;
  }

  drawPoints(cubic, elementsCount) {
    const interpolatedPoints = this.interpolatePoints((elementsCount - 1), cubic);

    const points = this.g
      .selectAll('.interpolated-point')
      .data(interpolatedPoints);

    points.enter()
      .append('circle')
      .merge(points)
      .attr('class', 'interpolated-point')
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
  }
}
