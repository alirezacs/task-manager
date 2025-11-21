"use client";

import { useEffect, useMemo, useState } from "react";

const statusStyles = {
  todo: "bg-amber-100 text-amber-800 ring-amber-200",
  "in-progress": "bg-blue-100 text-blue-800 ring-blue-200",
  done: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  cancelled: "bg-rose-100 text-rose-800 ring-rose-200",
};

const statusLabels = {
  todo: "To do",
  "in-progress": "In progress",
  done: "Done",
  cancelled: "Cancelled",
};

const pill = (label) => (
  <span className="rounded-full bg-white/60 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-white/40">
    {label}
  </span>
);

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignees, setAssignees] = useState([]);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    async function bootstrap() {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data.tasks);
      setTeam(data.teamMembers);
    }

    bootstrap();
  }, []);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
    setAssignees([]);
    setEditingTaskId(null);
  };

  const selectedLabel = useMemo(() => {
    if (!assignees.length) return "No one yet";
    const names = team
      .filter((member) => assignees.includes(member.id))
      .map((m) => m.name);
    return names.join(", ");
  }, [assignees, team]);

  const toggleAssignee = (id) => {
    setAssignees((current) =>
      current.includes(id)
        ? current.filter((member) => member !== id)
        : [...current, id]
    );
  };

  async function saveTask(event) {
    event.preventDefault();
    setLoading(true);

    const payload = {
      title,
      description,
      dueDate: dueDate || null,
      assignees,
    };

    try {
      if (editingTaskId) {
        const res = await fetch(`/api/tasks/${editingTaskId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        setTasks((prev) => prev.map((task) => (task.id === data.task.id ? data.task : task)));
      } else {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        setTasks((prev) => [data.task, ...prev]);
      }
      resetForm();
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, status) {
    setBusyId(id);
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    setTasks((prev) => prev.map((task) => (task.id === id ? data.task : task)));
    setBusyId(null);
  }

  async function removeTask(id) {
    setBusyId(id);
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((task) => task.id !== id));
    setBusyId(null);
  }

  function startEdit(task) {
    setTitle(task.title);
    setDescription(task.description);
    setDueDate(task.dueDate ?? "");
    setAssignees(task.assignees ?? []);
    setEditingTaskId(task.id);
  }

  const groupedTasks = useMemo(() => {
    return tasks.reduce(
      (acc, task) => {
        acc[task.status]?.push(task);
        return acc;
      },
      { todo: [], "in-progress": [], done: [], cancelled: [] }
    );
  }, [tasks]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-10 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Task manager</p>
            <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Plan, assign, and finish fast</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Capture tasks quickly, keep ownership clear, and track status from any device.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 shadow-sm ring-1 ring-slate-200">
            {pill("Create")}
            {pill("Assign")}
            {pill("Complete")}
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <form onSubmit={saveTask} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Quick task</p>
                <h2 className="text-xl font-semibold text-slate-900">
                  {editingTaskId ? "Update task" : "Create a task"}
                </h2>
              </div>
              {editingTaskId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-sm font-medium text-slate-500 underline underline-offset-4"
                >
                  Cancel edit
                </button>
              )}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Title</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Draft onboarding flow"
                  required
                  className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 shadow-inner transition focus:border-blue-400 focus:bg-white focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Due date</span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 shadow-inner transition focus:border-blue-400 focus:bg-white focus:outline-none"
                />
              </label>
              <label className="md:col-span-2 flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Description</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Context, requirements, or quick acceptance criteria."
                  className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 shadow-inner transition focus:border-blue-400 focus:bg-white focus:outline-none"
                />
              </label>
            </div>

            <div className="mt-6 grid gap-3">
              <p className="text-sm font-medium text-slate-700">Assign teammates</p>
              <div className="flex flex-wrap gap-2">
                {team.map((member) => {
                  const active = assignees.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleAssignee(member.id)}
                      className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                        active
                          ? "border-blue-500 bg-blue-50 text-blue-800 shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <span className="inline-block h-2 w-2 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500" />
                      <span className="font-medium">{member.name}</span>
                      <span className="text-xs text-slate-500">{member.role}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500">Selected: {selectedLabel}</p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Saving..." : editingTaskId ? "Save changes" : "Create task"}
              </button>
              <span className="text-xs text-slate-500">
                Tasks save instantly so your team can stay aligned on mobile or desktop.
              </span>
            </div>
          </form>

          <div className="rounded-3xl bg-slate-900 text-white shadow-lg">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Pulse</p>
                <h3 className="text-lg font-semibold">Live status</h3>
              </div>
              <div className="flex gap-2">
                {Object.entries(groupedTasks).map(([key, list]) => (
                  <div key={key} className="rounded-full bg-white/10 px-3 py-1 text-xs">
                    {statusLabels[key]} <span className="font-semibold">{list.length}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4 px-6 py-5">
              <p className="text-sm text-slate-300">
                A quick snapshot of where work sits today. Tap a status to shift momentum.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(groupedTasks).map(([key, list]) => (
                  <div key={key} className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">{statusLabels[key]}</span>
                      <span className="text-xs text-slate-400">{list.length} task(s)</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {list.slice(0, 3).map((task) => (
                        <span
                          key={task.id}
                          className="rounded-full bg-white/10 px-3 py-1 text-xs text-white"
                        >
                          {task.title}
                        </span>
                      ))}
                      {!list.length && (
                        <span className="text-xs text-slate-500">Nothing here yet</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Task list</p>
              <h2 className="text-xl font-semibold text-slate-900">All tasks</h2>
            </div>
            <span className="text-sm text-slate-500">Tap to update status or edit details.</span>
          </div>

          <div className="mt-5 grid gap-4">
            {tasks.map((task) => (
              <article
                key={task.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-gradient-to-r from-white to-slate-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-col gap-2 sm:max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-900">{task.title}</h3>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusStyles[task.status]}`}
                    >
                      {statusLabels[task.status]}
                    </span>
                    {task.dueDate && (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
                        Due {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {task.description && (
                    <p className="text-sm text-slate-600">{task.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {task.assignees?.length ? (
                      task.assignees.map((memberId) => {
                        const member = team.find((m) => m.id === memberId);
                        return (
                          <span
                            key={memberId}
                            className="flex items-center gap-2 rounded-full bg-slate-900/90 px-3 py-1 text-xs font-medium text-white"
                          >
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            {member?.name || memberId}
                          </span>
                        );
                      })
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
                        Unassigned
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(task)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(task.id, "done")}
                    disabled={busyId === task.id}
                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 transition hover:border-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Done
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(task.id, "cancelled")}
                    disabled={busyId === task.id}
                    className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => removeTask(task.id)}
                    disabled={busyId === task.id}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-500 transition hover:border-rose-200 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}

            {!tasks.length && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center text-sm text-slate-500">
                No tasks yet. Create your first task to get started.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
