import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import * as d3 from 'd3';

export interface CurveOptions {
  name: string;
  curve: d3.CurveFactory;
  active: boolean;
  lineString: string;
  clear: boolean;
}

type PointElement = [number, number];

let _this;

@Component({
  selector: 'app-main-view',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})

export class MainViewComponent implements OnInit, AfterViewInit, OnDestroy {
  startEndPointsOffset = 5;
  wrapper: HTMLElement;
  viewportSize: PointElement;
  initialViewportSize: PointElement;
  curvesCollection = [];
  numActivePoints = 3;
  numActiveCurves = 1;
  lineGenerator = d3.line();
  categoryScale = d3.scaleOrdinal(d3.schemeCategory10);
  drag = d3.drag();
  value: string;

  constructor() {
    _this = this;
  }

  ngOnInit(): void {
    this.wrapper = document.getElementById('svg-wrapper');
    this.viewportSize = [this.wrapper.clientWidth, this.wrapper.clientHeight];
    this.initialViewportSize = [this.wrapper.clientWidth, this.wrapper.clientHeight];

    this.drag
      .on('drag', (point: PointElement, pointIndex: number, collection: HTMLCollection) => {
        const className = +(collection[pointIndex].classList[0].replace('curve-', ''));
        if (pointIndex === 0 || pointIndex === this.curvesCollection[className].length - 1) {
          return;
        }

        this.curvesCollection[className][pointIndex][0] = d3.event.x;
        this.curvesCollection[className][pointIndex][1] = d3.event.y;
        this.updateLines();
        this.updatePoints();
      });

    this.init();
  }

  resizeListener() {
    _this.viewportSize = [_this.wrapper.clientWidth, _this.wrapper.clientHeight];
    _this.resizeCurves(_this.viewportSize);
  }

  ngAfterViewInit(): void {
    window.addEventListener('resize', this.resizeListener, false);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeListener, false);
  }

  init(): void {
    this.viewportSize = [this.wrapper.clientWidth, this.wrapper.clientHeight];

    d3.select('#nElement').on('input', (_: undefined, index: number, element: HTMLSelectElement) => {
      this.updateElements(+(element[0] as HTMLInputElement).value);
      this.updateLines();
      this.updatePoints();
    });

    d3.select('#nCurve').on('input', (_: undefined, index: number, element: HTMLSelectElement) => {
      this.updateCurves(+(element[0] as HTMLInputElement).value);
      this.updateLines();
      this.updatePoints();
    });

    this.updateCurves(this.numActiveCurves);
    this.updateElements(this.numActivePoints);
    this.resizeCurves(this.viewportSize);
  }

  resizeCurves(newViewportSize: PointElement): void {
    for (let i = 0; i < this.curvesCollection.length; i++) {
      const curve = this.curvesCollection[i];
      curve[curve.length - 1][0] = newViewportSize[0] - this.startEndPointsOffset;
      curve[curve.length - 1][1] = newViewportSize[1] - this.startEndPointsOffset;
    }

    this.updateLines();
    this.updatePoints();
    this.updatePointsResize(this.numActivePoints);
  }

  updatePointsResize(numElements: number): void {
    const xDiff = this.viewportSize[0] / this.initialViewportSize[0];
    const yDiff = this.viewportSize[1] / this.initialViewportSize[1];

    this.curvesCollection.forEach((curvePoints: PointElement[]) => {
      const newElements = [];
      for (let i = 1; i <= (numElements - 2); i++) {
        newElements.push([
          curvePoints[i][0] * xDiff,
          curvePoints[i][1] * yDiff
        ]);
      }
      curvePoints.splice(1, curvePoints.length - 2);
      curvePoints.splice(1, 0, ...newElements);

      return curvePoints;
    });

    this.initialViewportSize = [this.wrapper.clientWidth, this.wrapper.clientHeight];
  }

  updateElements(numElements: number): void {
    d3.select('#nElement-value').text(numElements - 2);
    d3.select('#nElement').property('value', numElements);
    const numNewElements = numElements - 1;
    const xDiff = this.viewportSize[0] / numNewElements;
    const yDiff = this.viewportSize[1] / numNewElements;

    this.curvesCollection.forEach((curvePoints: PointElement[]) => {
      this.computePoints(numElements, curvePoints, xDiff, yDiff);
    });

    this.numActivePoints = numElements;
  }

  computePoints(numElements: number, curvePoints: PointElement[], xDiff: number, yDiff: number): PointElement[] {
    const newElements = [];

    for (let i = 1; i <= (numElements - 2); i++) {
      newElements.push([
        xDiff * i,
        yDiff * i
      ]);
    }

    curvePoints.splice(1, curvePoints.length - 2);
    curvePoints.splice(1, 0, ...newElements);

    return curvePoints;
  }

  updateCurves(numCurves: number): void {
    this.viewportSize = [this.wrapper.clientWidth, this.wrapper.clientHeight];

    this.numActiveCurves = numCurves;

    const numNewElements = this.numActivePoints - 1;
    const xDiff = this.viewportSize[0] / numNewElements;
    const yDiff = this.viewportSize[1] / numNewElements;

    d3.select('#nCurve-value').text(numCurves);
    d3.select('#nCurve').property('value', numCurves);

    for (let ac = this.curvesCollection.length; ac < numCurves; ac++) {
      const initialPoints: PointElement[] = [
        [this.startEndPointsOffset, this.startEndPointsOffset],
        [this.viewportSize[0] - this.startEndPointsOffset, this.viewportSize[1] - this.startEndPointsOffset]
      ];

      this.curvesCollection.push(this.computePoints(this.numActivePoints, initialPoints, xDiff, yDiff));
    }

    if (numCurves < this.curvesCollection.length) {
      for (let rc = this.curvesCollection.length; rc > numCurves; rc--) {
        this.curvesCollection.pop();
      }
    }
  }

  updateLines(): void {
    const curveTypes = this.curvesCollection.map((curvePoints: PointElement[]) => {
      const curveOptions = Object.assign({}, {
        name: 'curveMonotoneX',
        curve: d3.curveMonotoneX,
        active: true,
        lineString: '',
        clear: true
      });

      this.lineGenerator.curve(curveOptions.curve);
      curveOptions.lineString = this.lineGenerator(curvePoints);

      return curveOptions;
    });

    const line = d3.select('svg g')
      .selectAll('path')
      .data(curveTypes);

    line.enter()
      .append('path')
      .merge(line)
      .style('stroke', (curve: CurveOptions, lineIndex: number) => this.colorScale(lineIndex))
      .attr('d', (curve: CurveOptions) => curve.lineString);

    line.exit().remove();
  }

  updatePoints(): void {
    d3.select('g')
      .selectAll('circle')
      .remove();

    this.curvesCollection.forEach((curvePoints, pointIndex: number) => {
      const point = d3.select('g')
        .selectAll('circle.curve-' + pointIndex)
        .data(curvePoints.map((value) => [...value]));

      point.enter()
        .append('circle')
        .classed('curve-' + pointIndex, true)
        .attr('r', 4)
        .call(this.drag)
        .merge(point)
        .style('fill', (element: PointElement, index: number) => {
          if (index === 0 || index === this.numActivePoints - 1) {
            return 'black';
          }
        })
        .style('cursor', (element: PointElement, index: number) => {
          if (index === 0 || index === this.numActivePoints - 1) {
            return 'default';
          }
        })
        .attr('cx', (element: PointElement) => element[0])
        .attr('cy', (element: PointElement) => element[1]);

      point.exit().remove();
    });
  }

  colorScale(curveIndex: number): string {
    return curveIndex === 0 ? '#777' : this.categoryScale(curveIndex.toString());
  }
}
