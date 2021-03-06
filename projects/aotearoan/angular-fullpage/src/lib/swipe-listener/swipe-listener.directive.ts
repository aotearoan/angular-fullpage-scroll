import {Directive, ElementRef, EventEmitter, HostListener, Input, Output} from '@angular/core';
import inViewport from 'in-viewport';
import {InputType} from './input-type.model';
import {SwipeDirection} from './swipe-direction.model';
import {SwipeEvent} from './swipe.event';

@Directive({
  selector: '[aoSwipeListener]',
})
export class SwipeListenerDirective {
  public lastTouchStartEvent: TouchEvent;
  public pointerEvents: PointerEvent[] = [];
  public handlePointerTimer;
  public multitouch: boolean;
  public touchEnabled = false;
  @Input() public directSwipeTolerance = 30;
  @Input() public stylusSwipeTolerance = 10;
  @Output() public swipeEvent = new EventEmitter<SwipeEvent>();

  public constructor(private readonly elem: ElementRef) {
  }

  private handlePointerEvents() {
    const multitouch = this.pointerEvents.filter((event) => event.type === 'pointerdown').length > 1;

    if (!multitouch) {
      const endEvent = this.pointerEvents[0];
      const startEvent = this.pointerEvents[this.pointerEvents.length - 1];
      const startX = startEvent.pageX;
      const startY = startEvent.pageY;

      const inputType = startEvent.pointerType === 'touch' ? InputType.Direct : InputType.Stylus;
      const swipeTolerance = this.stylusSwipeTolerance;

      const endX = endEvent.pageX;
      const endY = endEvent.pageY;

      const xShift = Math.abs(startX - endX);
      const yShift = Math.abs(startY - endY);

      if (xShift > swipeTolerance || yShift > swipeTolerance) {
        const direction = xShift >= yShift
          ? (startX - endX > 0 ? SwipeDirection.Left : SwipeDirection.Right)
          : (startY - endY > 0 ? SwipeDirection.Up : SwipeDirection.Down);
        this.swipeEvent.emit({
          inputType,
          direction,
          startEvent,
          endEvent,
        });
      }
    }
    this.pointerEvents = [];
  }

  @HostListener('window:pointerdown', ['$event'])
  @HostListener('window:pointerover', ['$event'])
  @HostListener('window:pointerout', ['$event'])
  public pointerEventListener(event: PointerEvent) {
    if (inViewport(this.elem.nativeElement)) {
      if (event.pointerType !== 'mouse' && !this.touchEnabled) {
        if (this.pointerEvents.length === 0) {
          this.handlePointerTimer = setTimeout(() => this.handlePointerEvents(), 600);
        }
        this.pointerEvents.push(event);
      }
    }
  }

  @HostListener('window:touchstart', ['$event'])
  @HostListener('window:touchmove', ['$event'])
  @HostListener('window:touchend', ['$event'])
  public touchEventListener(event: TouchEvent) {
    if (inViewport(this.elem.nativeElement)) {
      if (event.type === 'touchstart') {
        this.touchEnabled = true;
        this.multitouch = event.touches.length === 2;
        this.lastTouchStartEvent = event;
      } else if (event.type === 'touchend') {
        if (!this.multitouch) {
          const startX = this.lastTouchStartEvent.touches[0].screenX;
          const startY = this.lastTouchStartEvent.touches[0].screenY;

          const inputType = this.lastTouchStartEvent.touches[0].touchType === InputType.Stylus ? InputType.Stylus : InputType.Direct;
          const swipeTolerance = inputType === InputType.Stylus ? this.stylusSwipeTolerance : this.directSwipeTolerance;

          const endX = event.changedTouches[0].screenX;
          const endY = event.changedTouches[0].screenY;

          const xShift = Math.abs(startX - endX);
          const yShift = Math.abs(startY - endY);

          if (xShift > swipeTolerance || yShift > swipeTolerance) {
            const direction = xShift >= yShift
              ? (startX - endX > 0 ? SwipeDirection.Left : SwipeDirection.Right)
              : (startY - endY > 0 ? SwipeDirection.Up : SwipeDirection.Down);
            this.swipeEvent.emit({
              inputType,
              direction,
              startEvent: this.lastTouchStartEvent,
              endEvent: event,
            });
          }
        }
        this.lastTouchStartEvent = undefined;
        this.multitouch = undefined;
      }
    }
  }
}
