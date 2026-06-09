const categories = [
  { id: 1, userId: 1, name: 'Food', icon: '🍽️' },
  { id: 2, userId: 1, name: 'Transport', icon: '🚗' },
  { id: 3, userId: 1, name: 'Utilities', icon: '💡' },
  { id: 4, userId: 1, name: 'Shopping', icon: '🛍️' },
];

let expenses = [
  { id: 1, userId: 1, amount: 18.75, categoryId: 1, date: '2026-06-04', note: 'Lunch and coffee' },
  { id: 2, userId: 1, amount: 45.0, categoryId: 2, date: '2026-06-03', note: 'Bus pass' },
  { id: 3, userId: 1, amount: 75.2, categoryId: 3, date: '2026-06-02', note: 'Internet bill' },
];

let nextExpenseId = 4;
let nextCategoryId = 5;

function addExpense(userId, amount, categoryId, date, note) {
  const expense = {
    id: nextExpenseId++,
    userId,
    amount: Number(amount),
    categoryId: Number(categoryId),
    date,
    note,
  };
  expenses.unshift(expense);
  return Promise.resolve(expense);
}

function getExpenses(userId, filters = {}) {
  let result = expenses.filter((expense) => expense.userId === userId);

  if (filters.categoryId) {
    result = result.filter((expense) => expense.categoryId === Number(filters.categoryId));
  }

  if (filters.date) {
    result = result.filter((expense) => expense.date === filters.date);
  }

  result = result.sort((a, b) => (a.date < b.date ? 1 : -1));

  return Promise.resolve(result);
}

function updateExpense(id, data) {
  const expense = expenses.find((entry) => entry.id === Number(id));
  if (!expense) {
    return Promise.reject(new Error('Expense not found'));
  }

  expense.amount = Number(data.amount);
  expense.categoryId = Number(data.categoryId);
  expense.date = data.date;
  expense.note = data.note;

  return Promise.resolve(expense);
}

function deleteExpense(id) {
  expenses = expenses.filter((entry) => entry.id !== Number(id));
  return Promise.resolve();
}

function getCategories(userId) {
  return Promise.resolve(categories.filter((category) => category.userId === userId));
}

function createCategory(name, icon) {
  const category = {
    id: nextCategoryId++,
    userId: 1,
    name,
    icon,
  };
  categories.push(category);
  return Promise.resolve(category);
}

export { addExpense, getExpenses, updateExpense, deleteExpense, getCategories, createCategory };