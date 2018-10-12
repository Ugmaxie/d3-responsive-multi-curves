import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  mainView = false;
  clarified = true;
  isAfterViewChecked = true;
  performanceValue = '';

  ngOnInit() {
    this.setPerformanceValue(this.isAfterViewChecked);
  }

  switchView(): void {
    this.mainView = !this.mainView;
    this.clarified = false;
  }

  switchToClarified(): void {
    this.clarified = !this.clarified;
  }

  switchPerfomance(): void {
    this.isAfterViewChecked = !this.isAfterViewChecked;

    this.setPerformanceValue(this.isAfterViewChecked);
  }

  setPerformanceValue(trigger: boolean) {
    this.performanceValue = trigger ? 'Low' : 'High';
  }
}
