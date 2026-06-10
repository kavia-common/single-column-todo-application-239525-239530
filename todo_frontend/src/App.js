import React, { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "singleColumnTodoApp.todos.v1";

function generateId() {
  // Reasonable unique id without additional deps.
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function safeParseTodos(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    // Minimal validation / normalization
    return parsed
      .filter((t) => t && typeof t === "object")
      .map((t) => ({
        id: typeof t.id === "string" ? t.id : generateId(),
        text: typeof t.text === "string" ? t.text : "",
        completed: Boolean(t.completed),
        createdAt:
          typeof t.createdAt === "number" ? t.createdAt : Date.now(),
      }))
      .filter((t) => t.text.trim().length > 0);
  } catch {
    return null;
  }
}

/**
 * PUBLIC_INTERFACE
 * Root app component for the single-column Todo app.
 */
export default function App() {
  const [todos, setTodos] = useState(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? safeParseTodos(raw) : null;
    return parsed ?? [];
  });

  const [filter, setFilter] = useState("all"); // all | active | completed
  const [text, setText] = useState("");
  const inputRef = useRef(null);

  // Persist to localStorage
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  const counts = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const active = total - completed;
    return { total, active, completed };
  }, [todos]);

  const filteredTodos = useMemo(() => {
    if (filter === "active") return todos.filter((t) => !t.completed);
    if (filter === "completed") return todos.filter((t) => t.completed);
    return todos;
  }, [todos, filter]);

  function addTodo() {
    const trimmed = text.trim();
    if (!trimmed) return;

    const newTodo = {
      id: generateId(),
      text: trimmed,
      completed: false,
      createdAt: Date.now(),
    };

    setTodos((prev) => [newTodo, ...prev]);
    setText("");
    inputRef.current?.focus();
  }

  function toggleTodo(id) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }

  function deleteTodo(id) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  function clearCompleted() {
    setTodos((prev) => prev.filter((t) => !t.completed));
  }

  function onSubmit(e) {
    e.preventDefault();
    addTodo();
  }

  const canClearCompleted = counts.completed > 0;

  return (
    <div className="appShell">
      <header className="header">
        <div className="brand">
          <div className="brandMark" aria-hidden="true" />
          <div>
            <h1 className="title">Todo</h1>
            <p className="subtitle">
              Single-column, minimal, with local persistence
            </p>
          </div>
        </div>
      </header>

      <main className="main">
        <section className="card" aria-label="Todo input and filters">
          <form className="composer" onSubmit={onSubmit}>
            <label className="srOnly" htmlFor="todoText">
              Add a new todo
            </label>
            <input
              id="todoText"
              ref={inputRef}
              className="input"
              type="text"
              placeholder="Add a task…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={200}
              autoComplete="off"
            />
            <button className="btnPrimary" type="submit" disabled={!text.trim()}>
              Add
            </button>
          </form>

          <div className="toolbar" role="toolbar" aria-label="Todo filters">
            <div className="filters" role="tablist" aria-label="Filter tabs">
              <button
                type="button"
                className={filter === "all" ? "chip chipActive" : "chip"}
                onClick={() => setFilter("all")}
                role="tab"
                aria-selected={filter === "all"}
              >
                All <span className="chipCount">{counts.total}</span>
              </button>
              <button
                type="button"
                className={filter === "active" ? "chip chipActive" : "chip"}
                onClick={() => setFilter("active")}
                role="tab"
                aria-selected={filter === "active"}
              >
                Active <span className="chipCount">{counts.active}</span>
              </button>
              <button
                type="button"
                className={
                  filter === "completed" ? "chip chipActive" : "chip"
                }
                onClick={() => setFilter("completed")}
                role="tab"
                aria-selected={filter === "completed"}
              >
                Completed <span className="chipCount">{counts.completed}</span>
              </button>
            </div>

            <button
              type="button"
              className={canClearCompleted ? "btnGhost" : "btnGhost btnDisabled"}
              onClick={clearCompleted}
              disabled={!canClearCompleted}
              title="Remove all completed todos"
            >
              Clear completed
            </button>
          </div>
        </section>

        <section className="card listCard" aria-label="Todo list">
          {filteredTodos.length === 0 ? (
            <div className="empty">
              <p className="emptyTitle">Nothing here.</p>
              <p className="emptyHint">
                {filter === "completed"
                  ? "No completed todos yet."
                  : filter === "active"
                    ? "You have no active todos."
                    : "Add your first todo above."}
              </p>
            </div>
          ) : (
            <ul className="list" aria-label="Todos">
              {filteredTodos.map((t) => {
                const checkboxId = `todo_${t.id}`;
                return (
                  <li key={t.id} className="row">
                    <div className="rowMain">
                      <input
                        id={checkboxId}
                        className="check"
                        type="checkbox"
                        checked={t.completed}
                        onChange={() => toggleTodo(t.id)}
                        aria-label={`Mark "${t.text}" as ${
                          t.completed ? "not completed" : "completed"
                        }`}
                      />
                      <label
                        htmlFor={checkboxId}
                        className={t.completed ? "text textDone" : "text"}
                        title={t.text}
                      >
                        {t.text}
                      </label>
                    </div>

                    <button
                      type="button"
                      className="btnDanger"
                      onClick={() => deleteTodo(t.id)}
                      aria-label={`Delete "${t.text}"`}
                      title="Delete"
                    >
                      Delete
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <footer className="footer">
          <p className="footerText">
            Stored locally in your browser (localStorage).
          </p>
        </footer>
      </main>
    </div>
  );
}
