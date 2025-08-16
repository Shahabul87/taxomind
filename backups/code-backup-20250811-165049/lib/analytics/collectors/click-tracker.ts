// Click Event Tracking Collector

import { EventTracker } from '../event-tracker';

interface ClickData {
  element: {
    tagName: string;
    className: string;
    id: string;
    text: string;
    href?: string;
    dataAttributes: Record<string, string>;
  };
  position: {
    x: number;
    y: number;
    screenX: number;
    screenY: number;
  };
  meta: {
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    metaKey: boolean;
  };
}

export class ClickTracker {
  private tracker: EventTracker;
  private clickCounts: Map<string, number> = new Map();
  private lastClickTime: number = 0;
  private clickVelocity: number = 0;

  constructor(tracker: EventTracker) {
    this.tracker = tracker;
    this.initialize();
  }

  private initialize(): void {
    // Use capture phase to catch all clicks
    document.addEventListener('click', this.handleClick.bind(this), true);
    
    // Track right clicks (context menu)
    document.addEventListener('contextmenu', this.handleRightClick.bind(this), true);
    
    // Track double clicks separately
    document.addEventListener('dblclick', this.handleDoubleClick.bind(this), true);
  }

  private handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target) return;

    // Calculate click velocity
    const currentTime = Date.now();
    if (this.lastClickTime > 0) {
      this.clickVelocity = 1000 / (currentTime - this.lastClickTime);
    }
    this.lastClickTime = currentTime;

    // Get element identifier
    const elementId = this.getElementIdentifier(target);
    const clickCount = (this.clickCounts.get(elementId) || 0) + 1;
    this.clickCounts.set(elementId, clickCount);

    const clickData: ClickData = {
      element: {
        tagName: target.tagName,
        className: target.className,
        id: target.id,
        text: this.getElementText(target),
        href: (target as HTMLAnchorElement).href,
        dataAttributes: this.getDataAttributes(target)
      },
      position: {
        x: event.clientX,
        y: event.clientY,
        screenX: event.screenX,
        screenY: event.screenY
      },
      meta: {
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey
      }
    };

    // Track the click
    this.tracker.track({
      eventType: 'click',
      eventName: 'element_click',
      properties: {
        ...clickData,
        clickCount,
        clickVelocity: this.clickVelocity,
        timestamp: currentTime,
        path: this.getElementPath(target)
      }
    });

    // Track specific UI elements
    this.trackSpecialElements(target, event);
  }

  private handleRightClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    
    this.tracker.track({
      eventType: 'click',
      eventName: 'context_menu',
      properties: {
        element: this.getElementIdentifier(target),
        position: { x: event.clientX, y: event.clientY }
      }
    });
  }

  private handleDoubleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    
    this.tracker.track({
      eventType: 'click',
      eventName: 'double_click',
      properties: {
        element: this.getElementIdentifier(target),
        position: { x: event.clientX, y: event.clientY }
      }
    });
  }

  private trackSpecialElements(target: HTMLElement, event: MouseEvent): void {
    // Track button clicks with additional context
    if (target.tagName === 'BUTTON' || target.getAttribute('role') === 'button') {
      const buttonType = (target as HTMLButtonElement).type || 'button';
      const isSubmit = buttonType === 'submit';
      const form = target.closest('form');
      
      this.tracker.track({
        eventType: 'click',
        eventName: 'button_click',
        properties: {
          buttonText: this.getElementText(target),
          buttonType,
          isSubmit,
          formId: form?.id,
          formAction: form?.action
        }
      });
    }

    // Track link clicks
    if (target.tagName === 'A' || target.closest('a')) {
      const link = (target.tagName === 'A' ? target : target.closest('a')) as HTMLAnchorElement;
      const isExternal = link.hostname !== window.location.hostname;
      
      this.tracker.track({
        eventType: 'click',
        eventName: 'link_click',
        properties: {
          href: link.href,
          text: this.getElementText(link),
          isExternal,
          target: link.target,
          isDownload: link.hasAttribute('download')
        }
      });
    }

    // Track video controls
    if (target.closest('video') || target.closest('.video-player')) {
      const videoElement = target.closest('video');
      if (videoElement) {
        this.tracker.track({
          eventType: 'click',
          eventName: 'video_control_click',
          properties: {
            control: this.identifyVideoControl(target),
            videoId: videoElement.id || videoElement.dataset.videoId,
            currentTime: (videoElement as HTMLVideoElement).currentTime
          }
        });
      }
    }

    // Track quiz/exam interactions
    if (target.closest('[data-quiz-id]') || target.closest('.quiz-container')) {
      const quizContainer = target.closest('[data-quiz-id]');
      if (quizContainer) {
        this.tracker.track({
          eventType: 'click',
          eventName: 'quiz_interaction',
          properties: {
            quizId: quizContainer.getAttribute('data-quiz-id'),
            elementType: this.identifyQuizElement(target),
            questionId: target.closest('[data-question-id]')?.getAttribute('data-question-id')
          }
        });
      }
    }
  }

  private getElementIdentifier(element: HTMLElement): string {
    // Create a unique identifier for the element
    const id = element.id ? `#${element.id}` : '';
    const classes = element.className ? `.${element.className.split(' ').join('.')}` : '';
    const tag = element.tagName.toLowerCase();
    return `${tag}${id}${classes}`;
  }

  private getElementText(element: HTMLElement): string {
    // Get clean text content, limited to 100 characters
    const text = element.textContent?.trim().substring(0, 100) || '';
    return text.replace(/\s+/g, ' ');
  }

  private getDataAttributes(element: HTMLElement): Record<string, string> {
    const attrs: Record<string, string> = {};
    Array.from(element.attributes).forEach(attr => {
      if (attr.name.startsWith('data-')) {
        attrs[attr.name] = attr.value;
      }
    });
    return attrs;
  }

  private getElementPath(element: HTMLElement): string {
    // Get the DOM path to the element
    const path: string[] = [];
    let current: HTMLElement | null = element;
    
    while (current && current !== document.body) {
      const selector = current.id 
        ? `#${current.id}` 
        : `${current.tagName.toLowerCase()}:nth-child(${Array.from(current.parentElement?.children || []).indexOf(current) + 1})`;
      path.unshift(selector);
      current = current.parentElement;
    }
    
    return path.join(' > ');
  }

  private identifyVideoControl(element: HTMLElement): string {
    // Identify which video control was clicked
    const classList = element.classList.toString();
    if (classList.includes('play')) return 'play';
    if (classList.includes('pause')) return 'pause';
    if (classList.includes('volume')) return 'volume';
    if (classList.includes('fullscreen')) return 'fullscreen';
    if (classList.includes('seek')) return 'seek';
    return 'unknown';
  }

  private identifyQuizElement(element: HTMLElement): string {
    // Identify which quiz element was clicked
    if (element.tagName === 'INPUT') return 'answer_input';
    if (element.tagName === 'BUTTON') return 'button';
    if (element.closest('.option')) return 'answer_option';
    if (element.closest('.hint')) return 'hint';
    return 'other';
  }

  // Get click statistics
  getClickStats(): { totalClicks: number; uniqueElements: number; topClicked: string[] } {
    const totalClicks = Array.from(this.clickCounts.values()).reduce((a, b) => a + b, 0);
    const uniqueElements = this.clickCounts.size;
    const topClicked = Array.from(this.clickCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([element]) => element);

    return { totalClicks, uniqueElements, topClicked };
  }

  // Clean up
  destroy(): void {
    document.removeEventListener('click', this.handleClick.bind(this), true);
    document.removeEventListener('contextmenu', this.handleRightClick.bind(this), true);
    document.removeEventListener('dblclick', this.handleDoubleClick.bind(this), true);
  }
}