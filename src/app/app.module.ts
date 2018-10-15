import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { CubicBezierCurveComponent } from './cubic-bezier-curve/cubic-bezier-curve.component';

@NgModule({
  declarations: [
    AppComponent,
    CubicBezierCurveComponent
  ],
  imports: [
    BrowserModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
