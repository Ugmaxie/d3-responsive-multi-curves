import { AfterViewChecked, Component, ElementRef, HostListener, Inject, OnInit } from '@angular/core';
import { Subject } from 'rxjs';

import { Curve } from './curve';

@Component({
  selector: 'app-clarified-view',
  templateUrl: './clarified.component.html',
  styleUrls: ['./clarified.component.css']
})

export class ClarifiedComponent implements OnInit, AfterViewChecked {
  wrapper;
  viewportSize;

  curveOptions = {
    dimentions: {
      width: 500,
      height: 300
    },
    padding : {
      top: 10,
      right: 10,
      bottom: 10,
      left: 10
    }
  };

  elementsCount = 10;
  newChart = new Curve();
  private resizer = new Subject();
  @HostListener('window:resize')
  function () {
    this.resizer.next();
  }

  constructor(@Inject(ElementRef) private _elementRef: ElementRef) {
  }

  ngOnInit(): void {
    this.resizer
      .subscribe(() => {
        this.resizeChart();
      });

    this.newChart.draw(this.elementsCount, this.curveOptions);
  }

  ngAfterViewChecked() {
    this.resizeChart();
  }

  updateCurve() {
    this.newChart.update(this.elementsCount, this.curveOptions);
  }

  resizeChart() {
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

    if (this.curveOptions.dimentions.height === height && this.curveOptions.dimentions.width === width) {
      return;
    }

    this.curveOptions.dimentions.height = height;
    this.curveOptions.dimentions.width = width;

    this.newChart.update(this.elementsCount, this.curveOptions);
  }
}
