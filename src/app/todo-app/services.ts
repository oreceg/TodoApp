import { Injectable, signal, computed } from '@angular/core';

export interface Todo {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  createdAt: Date;
  updatedAt?: Date;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  dueDate?: Date;
}

export interface TodoStats {
  total: number;
  completed: number;
  active: number;
  overdue: number;
}

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  // Private signals for internal state management
  private todosSignal = signal<Todo[]>([]);
  private filterSignal = signal<'all' | 'active' | 'completed' | 'overdue'>('all');
  private searchTermSignal = signal<string>('');

  // Public readonly signals
  todos = this.todosSignal.asReadonly();
  filter = this.filterSignal.asReadonly();
  searchTerm = this.searchTermSignal.asReadonly();

  // Computed signals for derived state
  stats = computed<TodoStats>(() => {
    const todos = this.todosSignal();
    const now = new Date();

    return {
      total: todos.length,
      completed: todos.filter(t => t.completed).length,
      active: todos.filter(t => !t.completed).length,
      overdue: todos.filter(t =>
        !t.completed &&
        t.dueDate &&
        new Date(t.dueDate) < now
      ).length
    };
  });

  filteredTodos = computed(() => {
    const todos = this.todosSignal();
    const filter = this.filterSignal();
    const searchTerm = this.searchTermSignal().toLowerCase();
    const now = new Date();

    let filtered = todos;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(todo =>
        todo.title.toLowerCase().includes(searchTerm) ||
        todo.description.toLowerCase().includes(searchTerm) ||
        todo.category?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply status filter
    switch (filter) {
      case 'active':
        return filtered.filter(todo => !todo.completed);
      case 'completed':
        return filtered.filter(todo => todo.completed);
      case 'overdue':
        return filtered.filter(todo =>
          !todo.completed &&
          todo.dueDate &&
          new Date(todo.dueDate) < now
        );
      default:
        return filtered;
    }
  });

  todosByPriority = computed(() => {
    const todos = this.filteredTodos();
    return {
      high: todos.filter(t => t.priority === 'high'),
      medium: todos.filter(t => t.priority === 'medium'),
      low: todos.filter(t => t.priority === 'low')
    };
  });

  categories = computed(() => {
    const todos = this.todosSignal();
    const categorySet = new Set(
      todos
        .map(t => t.category)
        .filter(c => c && c.trim() !== '')
    );
    return Array.from(categorySet).sort();
  });

  constructor() {
    this.loadInitialData();
  }

  // CRUD Operations
  addTodo(todoData: Omit<Todo, 'id' | 'createdAt' | 'completed'>): Todo {
    const newTodo: Todo = {
      id: this.generateId(),
      ...todoData,
      completed: false,
      createdAt: new Date()
    };

    this.todosSignal.update(todos => [...todos, newTodo]);
    this.saveToStorage();
    return newTodo;
  }

  updateTodo(id: number, updates: Partial<Todo>): boolean {
    const updated = this.todosSignal().find(t => t.id === id);
    if (!updated) return false;

    this.todosSignal.update(todos =>
      todos.map(todo =>
        todo.id === id
          ? { ...todo, ...updates, updatedAt: new Date() }
          : todo
      )
    );

    this.saveToStorage();
    return true;
  }

  deleteTodo(id: number): boolean {
    const todoExists = this.todosSignal().some(t => t.id === id);
    if (!todoExists) return false;

    this.todosSignal.update(todos => todos.filter(t => t.id !== id));
    this.saveToStorage();
    return true;
  }

  toggleTodo(id: number): boolean {
    const todo = this.todosSignal().find(t => t.id === id);
    if (!todo) return false;

    return this.updateTodo(id, { completed: !todo.completed });
  }

  getTodoById(id: number): Todo | undefined {
    return this.todosSignal().find(t => t.id === id);
  }

  // Bulk operations
  markAllCompleted(): void {
    this.todosSignal.update(todos =>
      todos.map(todo => ({ ...todo, completed: true, updatedAt: new Date() }))
    );
    this.saveToStorage();
  }

  clearCompleted(): void {
    this.todosSignal.update(todos => todos.filter(t => !t.completed));
    this.saveToStorage();
  }

  duplicateTodo(id: number): Todo | null {
    const originalTodo = this.getTodoById(id);
    if (!originalTodo) return null;

    const duplicatedTodo = this.addTodo({
      title: `${originalTodo.title} (másolat)`,
      description: originalTodo.description,
      priority: originalTodo.priority,
      category: originalTodo.category,
      dueDate: originalTodo.dueDate
    });

    return duplicatedTodo;
  }

  // Filter and search operations
  setFilter(filter: 'all' | 'active' | 'completed' | 'overdue'): void {
    this.filterSignal.set(filter);
  }

  setSearchTerm(term: string): void {
    this.searchTermSignal.set(term);
  }

  clearSearch(): void {
    this.searchTermSignal.set('');
  }

  // Sorting operations
  sortTodos(criteria: 'title' | 'priority' | 'createdAt' | 'dueDate', order: 'asc' | 'desc' = 'asc'): void {
    this.todosSignal.update(todos => {
      const sorted = [...todos].sort((a, b) => {
        let comparison = 0;

        switch (criteria) {
          case 'title':
            comparison = a.title.localeCompare(b.title);
            break;
          case 'priority':
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
            break;
          case 'createdAt':
            comparison = a.createdAt.getTime() - b.createdAt.getTime();
            break;
          case 'dueDate':
            const aDate = a.dueDate?.getTime() || Infinity;
            const bDate = b.dueDate?.getTime() || Infinity;
            comparison = aDate - bDate;
            break;
        }

        return order === 'desc' ? -comparison : comparison;
      });

      return sorted;
    });

    this.saveToStorage();
  }

  // Data persistence
  private saveToStorage(): void {
    try {
      // Note: localStorage is not available in Claude artifacts
      // This would work in a real browser environment
      // localStorage.setItem('todos', JSON.stringify(this.todosSignal()));
      console.log('Todos saved:', this.todosSignal());
    } catch (error) {
      console.error('Error saving todos:', error);
    }
  }

  private loadFromStorage(): Todo[] {
    try {
      // Note: localStorage is not available in Claude artifacts
      // This would work in a real browser environment
      // const stored = localStorage.getItem('todos');
      // return stored ? JSON.parse(stored) : [];
      return [];
    } catch (error) {
      console.error('Error loading todos:', error);
      return [];
    }
  }

  private loadInitialData(): void {
    const storedTodos = this.loadFromStorage();

    if (storedTodos.length === 0) {
      // Load sample data if no stored data
      const sampleTodos: Todo[] = [
        {
          id: 1,
          title: 'Angular 20 tanulása',
          description: 'Az új funkciók és változások megismerése, különös tekintettel a signals API-ra',
          completed: false,
          createdAt: new Date(),
          priority: 'high',
          category: 'Tanulás',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
        },
        {
          id: 2,
          title: 'Modal rendszer implementálása',
          description: 'Felugró ablakok készítése adatbevitelhez modern UX alapelvekkel',
          completed: true,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          updatedAt: new Date(),
          priority: 'medium',
          category: 'Fejlesztés'
        },
        {
          id: 3,
          title: 'Responsive design tesztelése',
          description: 'Az alkalmazás tesztelése különböző képernyőméreteken',
          completed: false,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          priority: 'low',
          category: 'Tesztelés',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
        }
      ];

      this.todosSignal.set(sampleTodos);
    } else {
      // Convert date strings back to Date objects
      const todosWithDates = storedTodos.map(todo => ({
        ...todo,
        createdAt: new Date(todo.createdAt),
        updatedAt: todo.updatedAt ? new Date(todo.updatedAt) : undefined,
        dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined
      }));

      this.todosSignal.set(todosWithDates);
    }
  }

  private generateId(): number {
    const todos = this.todosSignal();
    return todos.length > 0 ? Math.max(...todos.map(t => t.id)) + 1 : 1;
  }

  // Export/Import functionality
  exportTodos(): string {
    return JSON.stringify(this.todosSignal(), null, 2);
  }

  importTodos(jsonData: string): boolean {
    try {
      const todos = JSON.parse(jsonData) as Todo[];

      // Validate the imported data
      if (!Array.isArray(todos)) {
        throw new Error('Invalid data format');
      }

      // Convert date strings to Date objects and validate structure
      const validatedTodos = todos.map(todo => {
        if (!todo.id || !todo.title || !todo.createdAt) {
          throw new Error('Invalid todo structure');
        }

        return {
          ...todo,
          createdAt: new Date(todo.createdAt),
          updatedAt: todo.updatedAt ? new Date(todo.updatedAt) : undefined,
          dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined
        };
      });

      this.todosSignal.set(validatedTodos);
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Error importing todos:', error);
      return false;
    }
  }

  // Analytics and insights
  getProductivityInsights() {
    const todos = this.todosSignal();
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      completedThisWeek: todos.filter(t =>
        t.completed &&
        t.updatedAt &&
        t.updatedAt >= oneWeekAgo
      ).length,
      averageCompletionTime: this.calculateAverageCompletionTime(todos),
      mostProductiveDay: this.getMostProductiveDay(todos),
      priorityDistribution: {
        high: todos.filter(t => t.priority === 'high').length,
        medium: todos.filter(t => t.priority === 'medium').length,
        low: todos.filter(t => t.priority === 'low').length
      }
    };
  }

  private calculateAverageCompletionTime(todos: Todo[]): number {
    const completedTodos = todos.filter(t => t.completed && t.updatedAt);
    if (completedTodos.length === 0) return 0;

    const totalTime = completedTodos.reduce((sum, todo) => {
      const completionTime = todo.updatedAt!.getTime() - todo.createdAt.getTime();
      return sum + completionTime;
    }, 0);

    return Math.round(totalTime / completedTodos.length / (1000 * 60 * 60 * 24)); // days
  }

  private getMostProductiveDay(todos: Todo[]): string {
    const completedTodos = todos.filter(t => t.completed && t.updatedAt);
    const dayCount: { [key: string]: number } = {};

    completedTodos.forEach(todo => {
      const day = todo.updatedAt!.toLocaleDateString('hu-HU', { weekday: 'long' });
      dayCount[day] = (dayCount[day] || 0) + 1;
    });

    return Object.entries(dayCount).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0])[0] || 'Nincs adat';
  }
}


modal\modal.ts