// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import {
  Message
} from 'phosphor-messaging';

import {
  PanelLayout
} from 'phosphor-panel';

import {
  Widget
} from 'phosphor-widget';

/**
 * The class name added to tooltip widgets.
 */
const TOOLTIP_CLASS = 'jp-ConsoleTooltip';


/**
 * A tooltip widget for a console.
 */
export
class ConsoleTooltip extends Widget {
  /**
   * Construct a console tooltip widget.
   */
  constructor(rect: ClientRect) {
    super();
    this.addClass(TOOLTIP_CLASS);
    this.rect = rect;
    this.layout = new PanelLayout();
    this.hide();
  }

  /**
   * The dimenions of the tooltip.
   *
   * #### Notes
   * `bottom` and `right` values are ignored as it is sufficient to provide
   * `top`, `left`, `width`, and `height` values.
   */
  get rect(): ClientRect {
    return this._rect;
  }
  set rect(newValue: ClientRect) {
    if (Private.matchClientRects(this._rect, newValue)) {
      return;
    }
    this._rect = newValue;
    if (this.isVisible) {
      this.update();
    }
  }

  /**
   * The semantic parent of the tooltip, its reference widget.
   */
  get reference(): Widget {
    return this._reference;
  }
  set reference(widget: Widget) {
    this._reference = widget;
  }

  /**
   * The text of the tooltip.
   */
  get content(): Widget {
    return this._content;
  }
  set content(newValue: Widget) {
    if (newValue === this._content) {
      return;
    }
    if (this._content) {
      this._content.dispose();
    }
    this._content = newValue;
    if (this._content) {
      let layout = this.layout as PanelLayout;
      layout.addChild(this._content);
      this.update();
    }
  }

  /**
   * Handle the DOM events for the widget.
   *
   * @param event - The DOM event sent to the widget.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the dock panel's node. It should
   * not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
    case 'keydown':
      this._evtKeydown(event as KeyboardEvent);
      break;
    case 'mousedown':
      this._evtMousedown(event as MouseEvent);
      break;
    case 'scroll':
      this._evtScroll(event as MouseEvent);
      break;
    default:
      break;
    }
  }

  /**
   * Handle `after_attach` messages for the widget.
   *
   * #### Notes
   * Captures window events in capture phase to dismiss the tooltip widget.
   *
   * Because its parent (reference) widgets use window listeners instead of
   * document listeners, the tooltip widget must also use window listeners
   * in the capture phase.
   */
  protected onAfterAttach(msg: Message): void {
    window.addEventListener('keydown', this, true);
    window.addEventListener('mousedown', this, true);
    window.addEventListener('scroll', this, true);
  }

  /**
   * Handle `before_detach` messages for the widget.
   */
  protected onBeforeDetach(msg: Message): void {
    window.removeEventListener('keydown', this);
    window.removeEventListener('mousedown', this);
    window.removeEventListener('scroll', this);
  }

  /**
   * Handle `update_request` messages.
   */
  protected onUpdateRequest(msg: Message): void {
    this.show();
    // Set the dimensions of the tooltip widget.
    Private.setBoundingClientRect(this.node, this._rect);
  }

  /**
   * Handle keydown events for the widget.
   *
   * #### Notes
   * Hides the tooltip if a keydown happens anywhere on the document outside
   * of either the tooltip or its parent.
   */
  private _evtKeydown(event: KeyboardEvent) {
    let target = event.target as HTMLElement;

    if (!this._reference) {
      this.hide();
      return;
    }

    if (this.isHidden) {
      return;
    }

    while (target !== document.documentElement) {
      if (target === this._reference.node) {
        if (event.keyCode === 27) { // Escape key
          this.hide();
        }
        return;
      }
      target = target.parentElement;
    }
    this.hide();
  }

  /**
   * Handle mousedown events for the widget.
   *
   * #### Notes
   * Hides the tooltip if a mousedown happens anywhere outside the tooltip.
   */
  private _evtMousedown(event: MouseEvent) {
    let target = event.target as HTMLElement;
    while (target !== document.documentElement) {
      if (target === this.node) {
        return;
      }
      target = target.parentElement;
    }
    this.hide();
  }

  /**
   * Handle scroll events for the widget
   */
  private _evtScroll(event: MouseEvent) {
    if (!this._reference || this.isHidden) {
      this.hide();
      return;
    }

    let target = event.target as HTMLElement;
    while (target !== document.documentElement) {
      // If the scroll event happened in the tooltip widget, allow it.
      if (target === this.node) {
        return;
      }
      target = target.parentElement;
    }
    this.hide();
  }

  private _rect: ClientRect = null;
  private _reference: Widget = null;
  private _content: Widget = null;
}


/**
 * A namespace for ConsoleTooltip widget private data.
 */
namespace Private {
  /**
   * Compare two client rectangles.
   *
   * @param r1 - The first client rectangle.
   *
   * @param r2 - The second client rectangle.
   *
   * @returns `true` if the two rectangles have the same dimensions.
   *
   * #### Notes
   * `bottom` and `right` values are ignored as it is sufficient to provide
   * `top`, `left`, `width`, and `height` values.
   * This function is *not* for general-purpose use; it is specific to tooltip
   * widget because it ignores `bottom` and `right`.
   */
  export
  function matchClientRects(r1: ClientRect, r2: ClientRect): boolean {
    // Check identity in case both items are null or undefined.
    if (r1 === r2 || !r1 && !r2) {
      return true;
    }
    // If one item is null or undefined, items don't match.
    if (!r1 || !r2) {
      return false;
    }
    return (r1.top === r2.top &&
            r1.left === r2.left &&
            r1.right === r2.right &&
            r1.width === r2.width &&
            r1.height === r2.height);
  }
  /**
   * Set the dimensions of an element.
   *
   * @param elem - The element of interest.
   *
   * @param rect - The dimensions of the element.
   *
   * #### Notes
   * Any `rect` members whose values are not numbers (i.e., `undefined` or
   * `null`) will be set to `'auto'`.
   */
  export
  function setBoundingClientRect(elem: HTMLElement, rect: ClientRect): void {
    let { top, left, bottom, right, width, height } = rect;
    elem.style.top = typeof top !== 'number' ? 'auto' : `${top}px`;
    elem.style.left = typeof left !== 'number' ? 'auto' : `${left}px`;
    elem.style.bottom = typeof bottom !== 'number' ? 'auto' : `${bottom}px`;
    elem.style.right = typeof right !== 'number' ? 'auto' : `${right}px`;
    elem.style.width = typeof width !== 'number' ? 'auto' : `${width}px`;
    elem.style.height = typeof height !== 'number' ? 'auto' : `${height}px`;
  }
}
