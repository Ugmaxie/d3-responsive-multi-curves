import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  isAfterViewChecked = true;
  performanceValue = '';

  ngOnInit(): void {
    this.setPerformanceValue(this.isAfterViewChecked);
  }

  switchPerfomance(): void {
    this.isAfterViewChecked = !this.isAfterViewChecked;

    this.setPerformanceValue(this.isAfterViewChecked);
  }

  setPerformanceValue(trigger: boolean): void {
    this.performanceValue = trigger ? 'Low' : 'High';
  }
}
