import { Component, Input, Output, EventEmitter, signal, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Todo } from '../services';

export interface TodoFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  dueDate?: Date;
}

@Component({
  selector: 'app-todo-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="todoForm" (ngSubmit)="onSubmit()" class="todo-form">
      <!-- Title Field -->
      <div class="form-group">
        <label for="title" class="form-label">
          Cím <span class="required">*</span>
        </label>
        <input
          type="text"
          id="title"
          formControlName="title"
          class="form-input"
          [class.error]="isFieldInvalid('title')"
          placeholder="Feladat címe..."
          maxlength="100">
        @if (isFieldInvalid('title')) {
          <div class="error-message">
            @if (todoForm.get('title')?.errors?.['required']) {
              A cím megadása kötelező
            }
            @if (todoForm.get('title')?.errors?.['minlength']) {
              A cím legalább 3 karakter hosszú legyen
            }
          </div>
        }
        <div class="character-count">
          {{ todoForm.get('title')?.value?.length || 0 }}/100
        </div>
      </div>

      <!-- Description Field -->
      <div class="form-group">
        <label for="description" class="form-label">Leírás</label>
        <textarea
          id="description"
          formControlName="description"
          class="form-textarea"
          placeholder="Feladat részletes leírása..."
          rows="3"
          maxlength="500"></textarea>
        <div class="character-count">
          {{ todoForm.get('description')?.value?.length || 0 }}/500
        </div>
      </div>

      <!-- Priority and Category Row -->
      <div class="form-row">
        <!-- Priority Field -->
        <div class="form-group flex-1">
          <label for="priority" class="form-label">Prioritás</label>
          <select
            id="priority"
            formControlName="priority"
            class="form-select">
            <option value="low">🟢 Alacsony</option>
            <option value="medium">🟡 Közepes</option>
            <option value="high">🔴 Magas</option>
          </select>
        </div>

        <!-- Category Field -->
        <div class="form-group flex-1">
          <label for="category" class="form-label">Kategória</label>
          <div class="category-input-container">
            <input
              type="text"
              id="category"
              formControlName="category"
              class="form-input"
              placeholder="pl. Munka, Személyes..."
              list="categoryList"
              maxlength="50">
            <datalist id="categoryList">
              @for (category of availableCategories(); track category) {
                <option [value]="category">{{ category }}</option>
              }
            </datalist>
          </div>
        </div>
      </div>

      <!-- Due Date Field -->
      <div class="form-group">
        <label for="dueDate" class="form-label">Határidő</label>
        <div class="date-input-container">
          <input
            type="date"
            id="dueDate"
            formControlName="dueDate"
            class="form-input"
            [min]="minDate">
          @if (todoForm.get('dueDate')?.value) {
            <button
              type="button"
              class="clear-date-btn"
              (click)="clearDueDate()"
              title="Határidő törlése">
              ✕
            </button>
          }
        </div>
        @if (todoForm.get('dueDate')?.value) {
          <div class="date-info">
            Határidő: {{ formatDate(todoForm.get('dueDate')?.value) }}
            <span class="days-until">({{ getDaysUntilDue() }})</span>
          </div>
        }
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button
          type="button"
          class="btn btn-secondary"
          (click)="onCancel()">
          Mégse
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          [disabled]="todoForm.invalid || isSubmitting()">
          @if (isSubmitting()) {
            <span class="loading-spinner"></span>
          }
          {{ isEditing() ? 'Módosítás' : 'Hozzáadás' }}
        </button>
      </div>

      <!-- Form Debug (only in development) -->
      @if (showDebug) {
        <div class="form-debug">
          <h4>Form Debug Info:</h4>
          <p>Valid: {{ todoForm.valid }}</p>
          <p>Value: {{ todoForm.value | json }}</p>
          <p>Errors: {{ getFormErrors() | json }}</p>
        </div>
      }
    </form>
  `,
  styles: [`
    .todo-form {
      max-width: 100%;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
    }

    .flex-1 {
      flex: 1;
    }

    .form-label {
      display: block;
      margin-bottom: 6px;
      font-weight: 600;
      color: #374151;
      font-size: 0.9rem;
    }

    .required {
      color: #ef4444;
    }

    .form-input,
    .form-textarea,
    .form-select {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.2s ease;
      box-sizing: border-box;
      font-family: inherit;
    }

    .form-input:focus,
    .form-textarea:focus,
    .form-select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-input.error,
    .form-textarea.error,
    .form-select.error {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    .form-textarea {
      resize: vertical;
      min-height: 80px;
    }

    .category-input-container {
      position: relative;
    }

    .date-input-container {
      position: relative;
      display: flex;
      align-items: center;
    }

    .clear-date-btn {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      color: #6b7280;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      font-size: 14px;
      transition: all 0.2s ease;
    }

    .clear-date-btn:hover {
      background-color: #f3f4f6;
      color: #374151;
    }

    .character-count {
      font-size: 0.8rem;
      color: #6b7280;
      text-align: right;
      margin-top: 4px;
    }

    .error-message {
      color: #ef4444;
      font-size: 0.8rem;
      margin-top: 4px;
    }

    .date-info {
      font-size: 0.9rem;
      color: #374151;
      margin-top: 6px;
    }

    .days-until {
      color: #6b7280;
      font-weight: 500;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    }

    .btn-secondary {
      background: #f8fafc;
      color: #64748b;
      border: 1px solid #e2e8f0;
    }

    .btn-secondary:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }

    .loading-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .form-debug {
      margin-top: 20px;
      padding: 16px;
      background: #f3f4f6;
      border-radius: 8px;
      font-size: 0.8rem;
    }

    .form-debug h4 {
      margin: 0 0 8px 0;
      color: #374151;
    }

    .form-debug p {
      margin: 4px 0;
      font-family: 'Courier New', monospace;
    }

    /* Responsive design */
    @media (max-width: 640px) {
      .form-row {
        flex-direction: column;
        gap: 12px;
      }

      .form-actions {
        flex-direction: column-reverse;
      }

      .btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class TodoFormComponent implements OnInit {
  @Input() todo = signal<Todo | null>(null);
  @Input() availableCategories = signal<string[]>([]);
  @Input() isEditing = signal(false);
  @Input() showDebug = false;

  @Output() formSubmit = new EventEmitter<TodoFormData>();
  @Output() formCancel = new EventEmitter<void>();

  todoForm!: FormGroup;
  isSubmitting = signal(false);
  minDate = new Date().toISOString().split('T')[0];

  constructor(private fb: FormBuilder) {
    // Watch for todo changes to populate form
    effect(() => {
      const currentTodo = this.todo();
      if (currentTodo && this.todoForm) {
        this.populateForm(currentTodo);
      }
    });
  }

  ngOnInit() {
    this.initForm();
  }

  private initForm(): void {
    this.todoForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      priority: ['medium', Validators.required],
      category: [''],
      dueDate: ['']
    });

    // Populate form if editing
    const currentTodo = this.todo();
    if (currentTodo) {
      this.populateForm(currentTodo);
    }
  }

  private populateForm(todo: Todo): void {
    this.todoForm.patchValue({
      title: todo.title,
      description: todo.description,
      priority: todo.priority,
      category: todo.category || '',
      dueDate: todo.dueDate ? this.formatDateForInput(todo.dueDate) : ''
    });
  }

  private formatDateForInput(date: Date): string {
    return new Date(date).toISOString().split('T')[0];
  }

  onSubmit(): void {
    if (this.todoForm.valid && !this.isSubmitting()) {
      this.isSubmitting.set(true);

      const formValue = this.todoForm.value;
      const formData: TodoFormData = {
        title: formValue.title.trim(),
        description: formValue.description?.trim() || '',
        priority: formValue.priority,
        category: formValue.category?.trim() || undefined,
        dueDate: formValue.dueDate ? new Date(formValue.dueDate) : undefined
      };

      // Simulate async operation
      setTimeout(() => {
        this.formSubmit.emit(formData);
        this.isSubmitting.set(false);
      }, 500);
    }
  }

  onCancel(): void {
    this.formCancel.emit();
  }

  clearDueDate(): void {
    this.todoForm.patchValue({ dueDate: '' });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.todoForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    return new Intl.DateTimeFormat('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }).format(date);
  }

  getDaysUntilDue(): string {
    const dueDateValue = this.todoForm.get('dueDate')?.value;
    if (!dueDateValue) return '';

    const dueDate = new Date(dueDateValue);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'ma';
    if (diffDays === 1) return 'holnap';
    if (diffDays === -1) return 'tegnap';
    if (diffDays > 0) return `${diffDays} nap múlva`;
    return `${Math.abs(diffDays)} napja lejárt`;
  }

  getFormErrors(): any {
    const errors: any = {};
    Object.keys(this.todoForm.controls).forEach(key => {
      const control = this.todoForm.get(key);
      if (control && control.errors) {
        errors[key] = control.errors;
      }
    });
    return errors;
  }
}