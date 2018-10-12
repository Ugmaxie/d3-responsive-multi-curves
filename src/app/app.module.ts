import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { OptionalComponent } from '../app/optional/optional.component';
import { MainViewComponent } from '../app/mainView/main.component';
import { ClarifiedComponent } from '../app/clarified/clarified.component';

@NgModule({
  declarations: [
    AppComponent,
    OptionalComponent,
    MainViewComponent,
    ClarifiedComponent
  ],
  imports: [
    BrowserModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
