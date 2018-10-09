import * as d3 from 'd3';

export class Curve {
  svg: any;
  g: any;
  a: any;
  b: any;
  c: any;
  d: any;
  len: number;
  arcLengths: number[];
  length: number;

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

// B(t) = (1 - t)^3P0 + 3(1 - t)^2tP1 + 3(1 - t)t^2P2 + t^3P3
  interpolateCubicBezier(start, control1, control2, end) {
    // 0 <= t <= 1
    return function interpolator(t) {
      return [
        (Math.pow(1 - t, 3) * start[0]) +
        (3 * Math.pow(1 - t, 2) * t * control1[0]) +
        (3 * (1 - t) * Math.pow(t, 2) * control2[0]) +
        (Math.pow(t, 3) * end[0]),
        (Math.pow(1 - t, 3) * start[1]) +
        (3 * Math.pow(1 - t, 2) * t * control1[1]) +
        (3 * (1 - t) * Math.pow(t, 2) * control2[1]) +
        (Math.pow(t, 3) * end[1]),
      ];
    };
  }

// B'(t) = 3(1- t)^2(P1 - P0) + 6(1 - t)t(P2 - P1) + 3t^2(P3 - P2)
  interpolateCubicBezierAngle(start, control1, control2, end) {
    // 0 <= t <= 1
    return function interpolator(t) {
      const tangentX = (3 * Math.pow(1 - t, 2) * (control1[0] - start[0])) +
        (6 * (1 - t) * t * (control2[0] - control1[0])) +
        (3 * Math.pow(t, 2) * (end[0] - control2[0]));

      const tangentY = (3 * Math.pow(1 - t, 2) * (control1[1] - start[1])) +
        (6 * (1 - t) * t * (control2[1] - control1[1])) +
        (3 * Math.pow(t, 2) * (end[1] - control2[1]));

      return Math.atan2(tangentY, tangentX) * (180 / Math.PI);
    };
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
      control2: [width / 2, height]
    };

    this.drawPoints(cubic, elementsCount);
    const cubicInterpolator = this.interpolateCubicBezier(cubic.start, cubic.control1, cubic.control2, cubic.end);
    const cubicAngleInterpolator = this.interpolateCubicBezierAngle(cubic.start, cubic.control1, cubic.control2, cubic.end);

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

    const points = d3.range(3).map((d, i, a) => {
      const t = d / (a.length - 1);
      return {
        t: t,
        position: cubicInterpolator(t),
        angle: cubicAngleInterpolator(t),
      };
    });

    const rotatedPoints = gCubic.selectAll('.rotated-point').data(points);

    rotatedPoints.enter()
      .append('path')
      .merge(rotatedPoints)
      .attr('d', 'M12,0 L-5,-8 L0,0 L-5,8 Z')
      .attr('class', 'rotated-point')
      .attr('transform', d => `translate(${d.position[0]}, ${d.position[1]}) rotate(${d.angle})`);

    rotatedPoints.exit().remove();

    return gCubic;
  }

  drawPoints(cubic, elementsCount) {
    const cubicInterpolator = this.interpolateCubicBezier(cubic.start, cubic.control1, cubic.control2, cubic.end);
    const interpolatedPoints = d3.range(elementsCount).map((d, i, a) => {
      return cubicInterpolator(d / (a.length - 1));
    });

    const points = this.g.selectAll('.interpolated-point')
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

  bezier(a, b, c, d, width) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;

    this.len = 100;
    this.arcLengths = new Array(this.len + 1);
    this.arcLengths[0] = 0;

    let ox = this.x(0), oy = this.y(0), clen = 0;
    for (let i = 1; i <= this.len; i += 1) {
      const x = this.x(i * 0.01), y = this.y(i * 0.01);
      const dx = ox - x, dy = oy - y;
      clen += Math.sqrt(dx * dx + dy * dy);
      this.arcLengths[i] = clen;
      ox = x;
      oy = y;
    }
    this.length = clen;
  }

  map(u) {
    const targetLength = u * this.arcLengths[this.len];
    let low = 0, high = this.len, index = 0;
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
      return index / this.len;

    } else {
      return (index + (targetLength - lengthBefore) / (this.arcLengths[index + 1] - lengthBefore)) / this.len;
    }
  }

  mx(u) {
    return this.x(this.map(u));
  }

  my(u) {
    return this.y(this.map(u));
  }

  x(t) {
    return ((1 - t) * (1 - t) * (1 - t)) * this.a.x
      + 3 * ((1 - t) * (1 - t)) * t * this.b.x
      + 3 * (1 - t) * (t * t) * this.c.x
      + (t * t * t) * this.d.x;
  }

  y(t) {
    return ((1 - t) * (1 - t) * (1 - t)) * this.a.y
      + 3 * ((1 - t) * (1 - t)) * t * this.b.y
      + 3 * (1 - t) * (t * t) * this.c.y
      + (t * t * t) * this.d.y;
  }
}


