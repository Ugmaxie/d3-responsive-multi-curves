import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  mainView = false;
  clarified = true;

  switchView(): void {
    this.mainView = !this.mainView;
    this.clarified = false;
  }

  switchToClarified(): void {
    this.clarified = !this.clarified;
  }
}
