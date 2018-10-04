import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  mainView = false;

  switchView(): void {
    this.mainView = !this.mainView;
  }
}
