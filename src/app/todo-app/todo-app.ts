import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TodoService, Todo } from './services';
import { ModalComponent, ModalConfig } from './modal/modal';
import { TodoFormComponent, TodoFormData } from './todo-form/todo-form';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, TodoFormComponent],
  template: `
    <div class="app-container">
      <!-- Header -->
      <header class="app-header">
        <div class="header-content">
          <h1 class="app-title">📝 Todo App</h1>
          <div class="header-actions">
            <div class="search-container">
              <input
                type="text"
                placeholder="Keresés..."
                class="search-input"
                [value]="todoService.searchTerm()"
                (input)="onSearchChange($event)">
              @if (todoService.searchTerm()) {
                <button
                  class="search-clear-btn"
                  (click)="clearSearch()"
                  title="Keresés törlése">
                  ✕
                </button>
              }
            </div>
            <button class="btn btn-primary" (click)="openAddModal()">
              ➕ Új feladat
            </button>
          </div>
        </div>
      </header>

      <!-- Stats Cards -->
      <div class="stats-container">
        <div class="stat-card">
          <div class="stat-number">{{ todoService.stats().total }}</div>
          <div class="stat-label">Összes</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ todoService.stats().active }}</div>
          <div class="stat-label">Aktív</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ todoService.stats().completed }}</div>
          <div class="stat-label">Befejezett</div>
        </div>
        <div class="stat-card overdue">
          <div class="stat-number">{{ todoService.stats().overdue }}</div>
          <div class="stat-label">Lejárt</div>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="filter-tabs">
        <button
          class="filter-tab"
          [class.active]="todoService.filter() === 'all'"
          (click)="setFilter('all')">
          Összes ({{ todoService.stats().total }})
        </button>
        <button
          class="filter-tab"
          [class.active]="todoService.filter() === 'active'"
          (click)="setFilter('active')">
          Aktív ({{ todoService.stats().active }})
        </button>
        <button
          class="filter-tab"
          [class.active]="todoService.filter() === 'completed'"
          (click)="setFilter('completed')">
          Befejezett ({{ todoService.stats().completed }})
        </button>
        <button
          class="filter-tab"
          [class.active]="todoService.filter() === 'overdue'"
          (click)="setFilter('overdue')">
          Lejárt ({{ todoService.stats().overdue }})
        </button>
      </div>

      <!-- Sorting Controls -->
      <div class="sorting-controls">
        <label for="sortBy">Rendezés:</label>
        <select id="sortBy" (change)="onSortChange($event)">
          <option value="createdAt-desc">Létrehozás (újabb először)</option>
          <option value="createdAt-asc">Létrehozás (régebbi először)</option>
          <option value="title-asc">Cím (A-Z)</option>
          <option value="title-desc">Cím (Z-A)</option>
          <option value="priority-desc">Prioritás (magas-alacsony)</option>
          <option value="priority-asc">Prioritás (alacsony-magas)</option>
          <option value="dueDate-asc">Határidő (legkorábbi először)</option>
        </select>
      </div>

      <!-- Main Content -->
      <main class="main-content">
        @if (todoService.filteredTodos().length === 0) {
          <div class="empty-state">
            @if (todoService.searchTerm()) {
              <div class="empty-icon">🔍</div>
              <h3>Nincs találat</h3>
              <p>Nem található feladat a "{{ todoService.searchTerm() }}" keresésre.</p>
              <button class="btn btn-secondary" (click)="clearSearch()">
                Keresés törlése
              </button>
            } @else {
              <div class="empty-icon">✅</div>
              <h3>{{ getEmptyStateTitle() }}</h3>
              <p>{{ getEmptyStateMessage() }}</p>
              @if (todoService.filter() === 'all') {
                <button class="btn btn-primary" (click)="openAddModal()">
                  Első feladat hozzáadása
                </button>
              }
            }
          </div>
        } @else {
          <div class="todos-container">
            @for (todo of todoService.filteredTodos(); track todo.id) {
              <div class="todo-item" [class.completed]="todo.completed">
                <div class="todo-checkbox">
                  <input
                    type="checkbox"
                    [checked]="todo.completed"
                    (change)="toggleTodo(todo.id)"
                    [id]="'todo-' + todo.id">
                  <label [for]="'todo-' + todo.id" class="checkbox-label"></label>
                </div>

                <div class="todo-content" (click)="openEditModal(todo)">
                  <div class="todo-header">
                    <h3 class="todo-title">{{ todo.title }}</h3>
                    <div class="todo-meta">
                      <span class="priority-badge" [class]="'priority-' + todo.priority">
                        {{ getPriorityLabel(todo.priority) }}
                      </span>
                      @if (todo.category) {
                        <span class="category-badge">{{ todo.category }}</span>
                      }
                    </div>
                  </div>

                  @if (todo.description) {
                    <p class="todo-description">{{ todo.description }}</p>
                  }

                  <div class="todo-footer">
                    <div class="todo-dates">
                      <span class="created-date">{{ formatDate(todo.createdAt) }}</span>
                      @if (todo.dueDate) {
                        <span class="due-date" [class.overdue]="isDueDateOverdue(todo)">
                          📅 {{ formatDueDate(todo.dueDate) }}
                        </span>
                      }
                    </div>
                  </div>
                </div>

                <div class="todo-actions">
                  <button
                    class="action-btn edit-btn"
                    (click)="openEditModal(todo)"
                    title="Szerkesztés">
                    ✏️
                  </button>
                  <button
                    class="action-btn duplicate-btn"
                    (click)="duplicateTodo(todo.id)"
                    title="Másolás">
                    📋
                  </button>
                  <button
                    class="action-btn delete-btn"
                    (click)="openDeleteConfirmModal(todo)"
                    title="Törlés">
                    🗑️
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </main>

      <!-- Bulk Actions -->
      @if (todoService.stats().total > 0) {
        <div class="bulk-actions">
          <button
            class="btn btn-secondary"
            (click)="markAllCompleted()"
            [disabled]="todoService.stats().active === 0">
            Összes befejezése
          </button>
          <button
            class="btn btn-secondary"
            (click)="clearCompleted()"
            [disabled]="todoService.stats().completed === 0">
            Befejezett törlése ({{ todoService.stats().completed }})
          </button>
        </div>
      }
    </div>

    <!-- Add/Edit Modal -->
    <app-modal
      [isOpen]="isModalOpen"
      [config]="modalConfig()"
      (closeModal)="closeModal()">

      <app-todo-form
        [todo]="editingTodo"
        [availableCategories]="todoService.categories"
        [isEditing]="isEditMode"
        (formSubmit)="onFormSubmit($event)"
        (formCancel)="closeModal()">
      </app-todo-form>
    </app-modal>

    <!-- Delete Confirmation Modal -->
    <app-modal
      [isOpen]="isDeleteModalOpen"
      [config]="deleteModalConfig()"
      (closeModal)="closeDeleteModal()">

      <div class="delete-confirmation">
        <div class="delete-icon">⚠️</div>
        <h3>Feladat törlése</h3>
        <p>
          Biztosan törölni szeretnéd a
          <strong>"{{ todoToDelete()?.title }}"</strong> feladatot?
        </p>
        <p class="delete-warning">Ez a művelet nem vonható vissza.</p>
      </div>

      <div slot="footer">
        <button class="btn btn-secondary" (click)="closeDeleteModal()">
          Mégse
        </button>
        <button class="btn btn-danger" (click)="confirmDelete()">
          Törlés
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .app-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .app-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 24px;
      border-radius: 16px;
      margin-bottom: 24px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
    }

    .app-title {
      margin: 0;
      font-size: 2rem;
      font-weight: 700;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .search-container {
      position: relative;
    }

    .search-input {
      padding: 10px 40px 10px 16px;
      border: none;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.9);
      font-size: 1rem;
      width: 250px;
      transition: all 0.2s ease;
    }

    .search-input:focus {
      outline: none;
      background: white;
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
    }

    .search-clear-btn {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #666;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
    }

    .search-clear-btn:hover {
      background: rgba(0, 0, 0, 0.1);
    }

    .stats-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
    }

    .stat-card.overdue {
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
      color: white;
    }

    .stat-number {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .stat-label {
      font-size: 0.9rem;
      opacity: 0.8;
      font-weight: 500;
    }

    .filter-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
      background: white;
      padding: 8px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .filter-tab {
      flex: 1;
      padding: 12px 16px;
      border: none;
      background: transparent;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;
      color: #64748b;
    }

    .filter-tab:hover {
      background: #f1f5f9;
    }

    .filter-tab.active {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
    }

    .sorting-controls {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      padding: 16px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .sorting-controls label {
      font-weight: 600;
      color: #374151;
    }

    .sorting-controls select {
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      cursor: pointer;
    }

    .main-content {
      min-height: 400px;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 20px;
    }

    .empty-state h3 {
      margin: 0 0 12px 0;
      color: #374151;
      font-size: 1.5rem;
    }

    .empty-state p {
      color: #6b7280;
      margin-bottom: 24px;
    }

    .todos-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .todo-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
      border-left: 4px solid transparent;
    }

    .todo-item:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }

    .todo-item.completed {
      opacity: 0.7;
      border-left-color: #10b981;
    }

    .todo-checkbox {
      position: relative;
      margin-top: 4px;
    }

    .todo-checkbox input[type="checkbox"] {
      opacity: 0;
      position: absolute;
    }

    .checkbox-label {
      display: block;
      width: 20px;
      height: 20px;
      border: 2px solid #d1d5db;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    }

    .todo-checkbox input:checked + .checkbox-label {
      background: #10b981;
      border-color: #10b981;
    }

    .todo-checkbox input:checked + .checkbox-label::after {
      content: '✓';
      position: absolute;
      top: -2px;
      left: 3px;
      color: white;
      font-size: 14px;
      font-weight: bold;
    }

    .todo-content {
      flex: 1;
      cursor: pointer;
    }

    .todo-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
      gap: 12px;
    }

    .todo-title {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #1f2937;
      flex: 1;
    }

    .todo-item.completed .todo-title {
      text-decoration: line-through;
      color: #6b7280;
    }

    .todo-meta {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }

    .priority-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .priority-high {
      background: #fee2e2;
      color: #dc2626;
    }

    .priority-medium {
      background: #fef3c7;
      color: #d97706;
    }

    .priority-low {
      background: #dcfce7;
      color: #16a34a;
    }

    .category-badge {
      padding: 4px 8px;
      background: #e0e7ff;
      color: #3730a3;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .todo-description {
      color: #6b7280;
      margin: 8px 0;
      line-height: 1.5;
    }

    .todo-footer {
      margin-top: 12px;
    }

    .todo-dates {
      display: flex;
      gap: 16px;
      font-size: 0.8rem;
      color: #9ca3af;
    }

    .due-date {
      font-weight: 500;
    }

    .due-date.overdue {
      color: #dc2626;
      font-weight: 600;
    }

    .todo-actions {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      background: none;
      border: none;
      padding: 8px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 1.1rem;
    }

    .action-btn:hover {
      background: #f3f4f6;
      transform: scale(1.1);
    }

    .delete-btn:hover {
      background: #fee2e2;
    }

    .bulk-actions {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-top: 32px;
      padding: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.9rem;
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

    .btn-secondary:hover:not(:disabled) {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }

    .btn-danger {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
    }

    .btn-danger:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
    }

    .delete-confirmation {
      text-align: center;
      padding: 20px;
    }

    .delete-icon {
      font-size: 3rem;
      margin-bottom: 16px;
    }

    .delete-confirmation h3 {
      margin: 0 0 16px 0;
      color: #374151;
    }

    .delete-confirmation p {
      color: #6b7280;
      margin-bottom: 8px;
    }

    .delete-warning {
      color: #dc2626;
      font-weight: 500;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .app-container {
        padding: 16px;
      }

      .header-content {
        flex-direction: column;
        gap: 16px;
      }

      .header-actions {
        width: 100%;
        justify-content: space-between;
      }

      .search-input {
        width: 200px;
      }

      .stats-container {
        grid-template-columns: repeat(2, 1fr);
      }

      .filter-tabs {
        flex-wrap: wrap;
      }

      .todo-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .bulk-actions {
        flex-direction: column;
      }
    }

    @media (max-width: 480px) {
      .stats-container {
        grid-template-columns: 1fr;
      }

      .todo-item {
        padding: 16px;
      }

      .search-input {
        width: 150px;
      }

      .header-actions {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `]
})
export class AppComponent {
  // Modal state
  isModalOpen = signal(false);
  isEditMode = signal(false);
  editingTodo = signal<Todo | null>(null);

  // Delete confirmation modal
  isDeleteModalOpen = signal(false);
  todoToDelete = signal<Todo | null>(null);

  modalConfig = signal<ModalConfig>({
    title: '',
    size: 'medium',
    closeOnBackdropClick: false,
    closeOnEscape: true,
    showCloseButton: true,
    animation: 'fade'
  });

  deleteModalConfig = signal<ModalConfig>({
    title: 'Feladat törlése',
    size: 'small',
    closeOnBackdropClick: false,
    closeOnEscape: true,
    showCloseButton: false,
    animation: 'zoom'
  });

  constructor(public todoService: TodoService) {}

  // Search functionality
  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.todoService.setSearchTerm(target.value);
  }

  clearSearch(): void {
    this.todoService.clearSearch();
  }

  // Filter functionality
  setFilter(filter: 'all' | 'active' | 'completed' | 'overdue'): void {
    this.todoService.setFilter(filter);
  }

  // Sort functionality
  onSortChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const [criteria, order] = target.value.split('-') as [
      'title' | 'priority' | 'createdAt' | 'dueDate',
      'asc' | 'desc'
    ];
    this.todoService.sortTodos(criteria, order);
  }

  // Modal functionality
  openAddModal(): void {
    this.isEditMode.set(false);
    this.editingTodo.set(null);
    this.modalConfig.update(config => ({
      ...config,
      title: '✨ Új feladat hozzáadása'
    }));
    this.isModalOpen.set(true);
  }

  openEditModal(todo: Todo): void {
    this.isEditMode.set(true);
    this.editingTodo.set(todo);
    this.modalConfig.update(config => ({
      ...config,
      title: '✏️ Feladat szerkesztése'
    }));
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    setTimeout(() => {
      this.editingTodo.set(null);
      this.isEditMode.set(false);
    }, 300);
  }

  onFormSubmit(formData: TodoFormData): void {
    if (this.isEditMode()) {
      const todo = this.editingTodo();
      if (todo) {
        this.todoService.updateTodo(todo.id, formData);
      }
    } else {
      this.todoService.addTodo(formData);
    }
    this.closeModal();
  }

  // Delete functionality
  openDeleteConfirmModal(todo: Todo): void {
    this.todoToDelete.set(todo);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    setTimeout(() => {
      this.todoToDelete.set(null);
    }, 300);
  }

  confirmDelete(): void {
    const todo = this.todoToDelete();
    if (todo) {
      this.todoService.deleteTodo(todo.id);
    }
    this.closeDeleteModal();
  }

  // Todo operations
  toggleTodo(id: number): void {
    this.todoService.toggleTodo(id);
  }

  duplicateTodo(id: number): void {
    this.todoService.duplicateTodo(id);
  }

  markAllCompleted(): void {
    this.todoService.markAllCompleted();
  }

  clearCompleted(): void {
    this.todoService.clearCompleted();
  }

  // Helper methods
  getPriorityLabel(priority: 'low' | 'medium' | 'high'): string {
    const labels = {
      low: '🟢 Alacsony',
      medium: '🟡 Közepes',
      high: '🔴 Magas'
    };
    return labels[priority];
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  }

  formatDueDate(date: Date): string {
    const now = new Date();
    const dueDate = new Date(date);
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Ma';
    if (diffDays === 1) return 'Holnap';
    if (diffDays === -1) return 'Tegnap';
    if (diffDays > 0) return `${diffDays} nap múlva`;
    return `${Math.abs(diffDays)} napja lejárt`;
  }

  isDueDateOverdue(todo: Todo): boolean {
    if (!todo.dueDate || todo.completed) return false;
    return new Date(todo.dueDate) < new Date();
  }

  getEmptyStateTitle(): string {
    const filter = this.todoService.filter();
    const titles = {
      all: 'Nincsenek feladatok',
      active: 'Nincsenek aktív feladatok',
      completed: 'Nincsenek befejezett feladatok',
      overdue: 'Nincsenek lejárt feladatok'
    };
    return titles[filter];
  }

  getEmptyStateMessage(): string {
    const filter = this.todoService.filter();
    const messages = {
      all: 'Kezdj el egy új feladattal a produktivitás növeléséhez!',
      active: 'Minden feladatod befejezett! 🎉',
      completed: 'Még nincs befejezett feladatod.',
      overdue: 'Minden feladatod időben van! 👏'
    };

../main
