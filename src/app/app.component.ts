import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  isAfterViewChecked = true;
  performanceValue = '';

  isCanvas = false;
  drawValue = '';

  ngOnInit(): void {
    this.setPerformanceValue(this.isAfterViewChecked);
    this.setCanvasValue(this.isCanvas);
  }

  switchPerfomance(): void {
    this.isAfterViewChecked = !this.isAfterViewChecked;

    this.setPerformanceValue(this.isAfterViewChecked);
  }

  setPerformanceValue(trigger: boolean): void {
    this.performanceValue = trigger ? 'Low' : 'High';
  }

  switchDraw(): void {
    this.isCanvas = !this.isCanvas;

    this.setCanvasValue(this.isCanvas);
  }

  setCanvasValue(trigger: boolean): void {
    this.drawValue = trigger ? 'Canvas' : 'SVG';
  }
}
