import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { OptionalComponent } from '../app/optional/optional.component';
import { MainViewComponent } from '../app/mainView/main.component';

@NgModule({
  declarations: [
    AppComponent,
    OptionalComponent,
    MainViewComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
