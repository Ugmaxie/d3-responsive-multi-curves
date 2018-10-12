import { AfterViewChecked, Component, ElementRef, HostListener, Inject, Input, OnInit } from '@angular/core';
import { Subject } from 'rxjs';

import { Curve } from './curve';

@Component({
  selector: 'app-clarified-view',
  templateUrl: './clarified.component.html',
  styleUrls: ['./clarified.component.css']
})

export class ClarifiedComponent implements OnInit, AfterViewChecked {
  @Input()isAfterViewChecked = true;

  wrapper: HTMLElement;
  viewportSize: number[];
  numActivePoints = 10;
  numActiveCurves = 1;
  newChart = new Curve();
  curveOptions = {
    viewport: {
      width: 500,
      height: 300
    },
    padding : {
      top: 15,
      right: 10,
      bottom: 10,
      left: 10
    }
  };

  private resizer = new Subject();
  @HostListener('window:resize')
  function () {
    this.resizer.next();
  }

  ngOnInit(): void {
    this.getViewportSize();

    this.resizer
      .subscribe(() => {
        this.resizeChart();
      });

    this.newChart.draw(this.numActivePoints, this.numActiveCurves, this.curveOptions);
  }

  ngAfterViewChecked(): void {
    if (!this.isAfterViewChecked) {
      return;
    }

    this.resizeChart();
  }

  updateCurve(): void {
    this.newChart.update(this.numActivePoints, this.numActiveCurves, this.curveOptions);
  }

  resizeChart(): void {
    this.getViewportSize();
    this.newChart.update(this.numActivePoints, this.numActiveCurves, this.curveOptions);
  }

  getViewportSize(): void {
    this.wrapper = document.getElementById('svg-wrapper');
    this.viewportSize = [this.wrapper.clientWidth, this.wrapper.clientHeight];

    if (!this.viewportSize) {
      return;
    }

    const width = this.viewportSize[0];
    const height = this.viewportSize[1];

    if (height === 0 || width === 0) {
      return;
    }

    if (this.curveOptions.viewport.height === height && this.curveOptions.viewport.width === width) {
      return;
    }

    this.curveOptions.viewport.height = height;
    this.curveOptions.viewport.width = width;
  }
}
