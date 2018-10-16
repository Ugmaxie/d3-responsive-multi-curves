import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { CubicBezierCurveComponent } from './cubic-bezier-curve/cubic-bezier-curve.component';
import { CubicBezierCurveCanvasComponent } from './cubic-bezier-curve-canvas/cubic-bezier-curve-canvas.component';

@NgModule({
  declarations: [
    AppComponent,
    CubicBezierCurveComponent,
    CubicBezierCurveCanvasComponent
  ],
  imports: [
    BrowserModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
