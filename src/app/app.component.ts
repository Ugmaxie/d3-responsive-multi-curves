import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  mainView = false;
  clarified = true;
  experimental = false;

  switchView(): void {
    this.mainView = !this.mainView;
    this.clarified = false;
    this.experimental = false;
  }

  switchToClarified(): void {
    this.clarified = !this.clarified;
    this.experimental = false;
  }

  switchExperimental(): void {
    this.experimental = !this.experimental;
    this.clarified = false;
  }
}
