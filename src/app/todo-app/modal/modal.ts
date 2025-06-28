import {Component, Input, Output, EventEmitter, signal, effect, ElementRef, ViewChild, AfterViewInit, OnDestroy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { todo } from 'node:test';

export interface ModalConfig {
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  customClass?: string;
  animation?: 'fade' | 'slide' | 'zoom';
}

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="modal-overlay"
      [class]="'modal-overlay-' + config().animation"
      [class.active]="isVisible()"
      (click)="onBackdropClick()"
      #overlay>
      <div
        class="modal-container"
        [class]="getModalClasses()"
        [class.active]="isVisible()"
        (click)="$event.stopPropagation()"
        #modalContainer
        role="dialog"
        [attr.aria-labelledby]="config().title ? 'modal-title' : null"
        aria-modal="true">

        <!-- Modal Header -->
        @if (config().title || config().showCloseButton) {
          <div class="modal-header">
            @if (config().title) {
              <h2 id="modal-title" class="modal-title">{{ config().title }}</h2>
            }
            @if (config().showCloseButton) {
              <button
                class="modal-close-btn"
                (click)="close()"
                aria-label="Modal bezárása"
                type="button">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            }
          </div>
        }

        <!-- Modal Body -->
        <div class="modal-body">
          <ng-content></ng-content>
        </div>

        <!-- Modal Footer (if provided) -->
        @if (hasFooterContent) {
          <div class="modal-footer">
            <ng-content select="[slot=footer]"></ng-content>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .modal-overlay.active {
      opacity: 1;
      visibility: visible;
    }

    .modal-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-height: 90vh;
      overflow-y: auto;
      transform: scale(0.7) translateY(100px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      margin: 20px;
    }

    .modal-container.active {
      transform: scale(1) translateY(0);
    }

    /* Size variants */
    .modal-small {
      width: 100%;
      max-width: 400px;
    }

    .modal-medium {
      width: 100%;
      max-width: 600px;
    }

    .modal-large {
      width: 100%;
      max-width: 900px;
    }

    .modal-fullscreen {
      width: 95vw;
      height: 95vh;
      max-width: none;
      max-height: none;
      margin: 2.5vh 2.5vw;
    }

    /* Animation variants */
    .modal-overlay-fade .modal-container {
      transform: scale(0.9);
    }

    .modal-overlay-fade .modal-container.active {
      transform: scale(1);
    }

    .modal-overlay-slide .modal-container {
      transform: translateY(100%);
    }

    .modal-overlay-slide .modal-container.active {
      transform: translateY(0);
    }

    .modal-overlay-zoom .modal-container {
      transform: scale(0.3);
    }

    .modal-overlay-zoom .modal-container.active {
      transform: scale(1);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 24px 12px 24px;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #1f2937;
      flex: 1;
    }

    .modal-close-btn {
      background: none;
      border: none;
      padding: 8px;
      cursor: pointer;
      color: #6b7280;
      border-radius: 6px;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-close-btn:hover {
      background-color: #f3f4f6;
      color: #374151;
    }

    .modal-body {
      padding: 24px;
    }

    .modal-footer {
      padding: 0 24px 24px 24px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 12px;
      padding-top: 20px;
    }

    /* Responsive design */
    @media (max-width: 640px) {
      .modal-container {
        margin: 10px;
        max-height: 95vh;
      }

      .modal-fullscreen {
        width: 100vw;
        height: 100vh;
        margin: 0;
        border-radius: 0;
      }

      .modal-header {
        padding: 16px 16px 8px 16px;
      }

      .modal-body {
        padding: 16px;
      }

      .modal-footer {
        padding: 0 16px 16px 16px;
      }
    }
  `]
})
export class ModalComponent implements AfterViewInit, OnDestroy {
  @Input() isOpen = signal(false);
  @Input() config = signal<ModalConfig>({
    size: 'medium',
    closeOnBackdropClick: true,
    closeOnEscape: true,
    showCloseButton: true,
    animation: 'fade'
  });

  @Output() closeModal = new EventEmitter<void>();
  @Output() opened = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  @ViewChild('overlay') overlay!: ElementRef<HTMLDivElement>;
  @ViewChild('modalContainer') modalContainer!: ElementRef<HTMLDivElement>;

  isVisible = signal(false);
  hasFooterContent = false;

  private keydownListener?: (event: KeyboardEvent) => void;
  private focusableElements: HTMLElement[] = [];
  private previousActiveElement: HTMLElement | null = null;

  constructor(private elementRef: ElementRef) {
    // Watch for isOpen changes
    effect(() => {
      if (this.isOpen()) {
        this.open();
      } else {
        this.close();
      }
    });
  }

  ngAfterViewInit() {
    // Check if footer content is provided
    const footerSlot = this.elementRef.nativeElement.querySelector('[slot="footer"]');
    this.hasFooterContent = !!footerSlot;
  }

  ngOnDestroy() {
    this.removeKeydownListener();
    this.restoreFocus();
  }

  private open(): void {
    if (this.isVisible()) return;

    this.previousActiveElement = document.activeElement as HTMLElement;

    setTimeout(() => {
      this.isVisible.set(true);
      this.setupFocusManagement();
      this.addKeydownListener();
      document.body.style.overflow = 'hidden';
      this.opened.emit();
    }, 10);
  }

  close(): void {
    if (!this.isVisible()) return;

    this.isVisible.set(false);
    this.removeKeydownListener();
    document.body.style.overflow = '';

    setTimeout(() => {
      this.restoreFocus();
      this.closed.emit();
      this.closeModal.emit();
    }, 300);
  }

  onBackdropClick(): void {
    if (this.config().closeOnBackdropClick) {
      this.close();
    }
  }

  getModalClasses(): string {
    const config = this.config();
    const classes = [`modal-${config.size}`];

    if (config.customClass) {
      classes.push(config.customClass);
    }

    return classes.join(' ');
  }

  private setupFocusManagement(): void {
    if (!this.modalContainer) return;

    // Find all focusable elements within the modal
    this.focusableElements = Array.from(
      this.modalContainer.nativeElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => !el.hasAttribute('disabled')) as HTMLElement[];

    // Focus the first focusable element
    if (this.focusableElements.length > 0) {
      this.focusableElements[0].focus();
    }
  }

  private addKeydownListener(): void {
    this.keydownListener = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && this.config().closeOnEscape) {
        this.close();
        return;
      }

      if (event.key === 'Tab') {
        this.handleTabKey(event);
      }
    };

    document.addEventListener('keydown', this.keydownListener);
  }

  private removeKeydownListener(): void {
    if (this.keydownListener) {
      document.removeEventListener('keydown', this.keydownListener);
      this.keydownListener = undefined;
    }
  }

  private handleTabKey(event: KeyboardEvent): void {
    if (this.focusableElements.length === 0) return;

    const currentIndex = this.focusableElements.indexOf(document.activeElement as HTMLElement);

    if (event.shiftKey) {
      // Shift + Tab (backward)
      const nextIndex = currentIndex <= 0 ? this.focusableElements.length - 1 : currentIndex - 1;
      this.focusableElements[nextIndex].focus();
    } else {
      // Tab (forward)
      const nextIndex = currentIndex >= this.focusableElements.length - 1 ? 0 : currentIndex + 1;
      this.focusableElements[nextIndex].focus();
    }

    event.preventDefault();
  }

  private restoreFocus(): void {
    if (this.previousActiveElement && document.contains(this.previousActiveElement)) {
      this.previousActiveElement.focus();
    }
  }
}

"todo-form"/"todo-form.ts"
