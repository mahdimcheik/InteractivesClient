import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-slide-canvas',
  imports: [NgOptimizedImage],
  templateUrl: './slide-canvas.html',
  styleUrl: './slide-canvas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlideCanvas {}
