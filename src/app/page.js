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

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

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
  const [teammateId, setTeammateId] = useState("");
  const [teammateName, setTeammateName] = useState("");
  const [teammateRole, setTeammateRole] = useState("");
  const [editingTeammateId, setEditingTeammateId] = useState(null);
  const [teamLoading, setTeamLoading] = useState(false);
  const [dueFilter, setDueFilter] = useState("all");
  const [showTeamPanel, setShowTeamPanel] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data.tasks);
      setTeam(data.teamMembers);
    }

    bootstrap();
  }, []);

  useEffect(() => {
    if (!editingTeammateId && teammateName && !teammateId) {
      setTeammateId(slugify(teammateName));
    }
  }, [editingTeammateId, teammateId, teammateName]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
    setAssignees([]);
    setEditingTaskId(null);
  };

  const resetTeamForm = () => {
    setTeammateId("");
    setTeammateName("");
    setTeammateRole("");
    setEditingTeammateId(null);
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

  async function saveTeammate(event) {
    event.preventDefault();
    if (!teammateName.trim()) return;
    if (!editingTeammateId && !teammateId.trim()) return;
    setTeamLoading(true);

    const payload = { name: teammateName.trim(), role: teammateRole.trim() };

    try {
      if (editingTeammateId) {
        const res = await fetch(`/api/team/${editingTeammateId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        setTeam((prev) => prev.map((member) => (member.id === data.member.id ? data.member : member)));
      } else {
        const res = await fetch("/api/team", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: teammateId.trim(), ...payload }),
        });
        const data = await res.json();
        setTeam((prev) => [...prev, data.member]);
      }
      resetTeamForm();
    } finally {
      setTeamLoading(false);
    }
  }

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

  function startTeamEdit(member) {
    setTeammateId(member.id);
    setTeammateName(member.name);
    setTeammateRole(member.role);
    setEditingTeammateId(member.id);
    setShowTeamPanel(true);
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

  const filteredTasks = useMemo(() => {
    if (dueFilter === "all") return tasks;

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    const startOfDayAfter = new Date(startOfTomorrow);
    startOfDayAfter.setDate(startOfDayAfter.getDate() + 1);

    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const date = new Date(task.dueDate);
      if (Number.isNaN(date.getTime())) return false;
      const taskDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      if (dueFilter === "today") return taskDay >= startOfToday && taskDay < startOfTomorrow;
      if (dueFilter === "tomorrow") return taskDay >= startOfTomorrow && taskDay < startOfDayAfter;
      if (dueFilter === "overdue") return taskDay < startOfToday;
      return true;
    });
  }, [dueFilter, tasks]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 pb-16 pt-10 text-slate-900 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 rounded-3xl bg-white/70 p-6 shadow-sm ring-1 ring-slate-200 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Task manager</p>
            <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Plan, assign, and finish fast</h1>
            <p className="max-w-2xl text-sm text-slate-600">
              Capture tasks quickly, keep ownership clear, and track status from any device. A refreshed layout keeps controls thumb-friendly on mobile and spacious on desktop.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            {pill("Create")}
            {pill("Assign")}
            {pill("Complete")}
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          <form
            onSubmit={saveTask}
            className="lg:col-span-2 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Quick task</p>
                <h2 className="text-xl font-semibold text-slate-900">
                  {editingTaskId ? "Update task" : "Create a task"}
                </h2>
                <p className="text-sm text-slate-600">Designed for single-hand use on phones and clear scanning on widescreens.</p>
              </div>
              {editingTaskId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="self-start text-sm font-medium text-slate-500 underline underline-offset-4"
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 shadow-inner transition focus:border-blue-400 focus:bg-white focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Due date</span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 shadow-inner transition focus:border-blue-400 focus:bg-white focus:outline-none"
                />
              </label>
              <label className="md:col-span-2 flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Description</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Context, requirements, or quick acceptance criteria."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 shadow-inner transition focus:border-blue-400 focus:bg-white focus:outline-none"
                />
              </label>
            </div>

            <div className="mt-6 grid gap-3">
              <p className="text-sm font-medium text-slate-700">Assign teammates</p>
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                <button
                  type="button"
                  onClick={() => {
                    resetTeamForm();
                    setShowTeamPanel(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 shadow-sm transition hover:border-slate-300"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Show teammates
                </button>
                <span className="flex items-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  Add, edit, or assign from the team directory.
                </span>
              </div>
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
              <span className="text-xs text-slate-500">Tasks save instantly and stay finger-friendly on mobile.</span>
            </div>
          </form>

          <div className="grid gap-6 lg:col-span-1">
            <div className="rounded-3xl bg-slate-900 text-white shadow-lg">
              <div className="flex flex-col gap-3 border-b border-white/10 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Pulse</p>
                  <h3 className="text-lg font-semibold">Live status</h3>
                </div>
                <div className="flex gap-2 overflow-x-auto py-1">
                  {Object.entries(groupedTasks).map(([key, list]) => (
                    <div key={key} className="rounded-full bg-white/10 px-3 py-1 text-xs whitespace-nowrap">
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

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Team</p>
                  <h3 className="text-lg font-semibold text-slate-900">Roster & access</h3>
                  <p className="text-sm text-slate-600">Add new teammates or update their roles without leaving the page.</p>
                </div>
                {editingTeammateId && (
                  <button
                    type="button"
                    onClick={resetTeamForm}
                    className="text-xs font-semibold text-slate-500 underline underline-offset-4"
                  >
                    Cancel edit
                  </button>
                )}
              </div>

              <form onSubmit={saveTeammate} className="mt-4 grid gap-3">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Full name</span>
                  <input
                    value={teammateName}
                    onChange={(e) => setTeammateName(e.target.value)}
                    placeholder="Ex: Priya Singh"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 shadow-inner transition focus:border-blue-400 focus:bg-white focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Role</span>
                  <input
                    value={teammateRole}
                    onChange={(e) => setTeammateRole(e.target.value)}
                    placeholder="Ex: Engineering"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 shadow-inner transition focus:border-blue-400 focus:bg-white focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Teammate ID (used for assignments)</span>
                  <input
                    value={teammateId}
                    onChange={(e) => setTeammateId(e.target.value)}
                    placeholder="priya-singh"
                    required={!editingTeammateId}
                    disabled={Boolean(editingTeammateId)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 shadow-inner transition focus:border-blue-400 focus:bg-white focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50"
                  />
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={teamLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-500/20 transition hover:from-emerald-500 hover:to-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {teamLoading ? "Saving..." : editingTeammateId ? "Save teammate" : "Add teammate"}
                  </button>
                  <p className="text-xs text-slate-500">IDs stay stable so existing tasks keep their assignees.</p>
                </div>
              </form>

              <div className="mt-5 divide-y divide-slate-100">
                {team.map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{member.name}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {member.role || "Teammate"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">ID: {member.id}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => startTeamEdit(member)}
                      className="self-start rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300"
                    >
                      Edit
                    </button>
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
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
              <span className="text-sm text-slate-500">Tap to update status or edit details.</span>
              <div className="flex flex-wrap gap-2">
                {["all", "today", "tomorrow", "overdue"].map((option) => {
                  const active = dueFilter === option;
                  const labels = {
                    all: "All", 
                    today: "Today", 
                    tomorrow: "Tomorrow", 
                    overdue: "Overdue",
                  };
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setDueFilter(option)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? "border-blue-500 bg-blue-50 text-blue-800 shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {labels[option]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            {filteredTasks.map((task) => (
              <article
                key={task.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-gradient-to-r from-white to-slate-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:flex-row sm:items-start sm:justify-between"
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

            {!filteredTasks.length && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center text-sm text-slate-500">
                No tasks match this view. Adjust filters or create a new task to get started.
              </div>
            )}
          </div>
        </section>
      </div>

      {showTeamPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            aria-hidden
            onClick={() => {
              resetTeamForm();
              setShowTeamPanel(false);
            }}
          />
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Team directory</p>
                <h3 className="text-xl font-semibold text-slate-900">All teammates</h3>
                <p className="text-sm text-slate-600">
                  Browse everyone, add a new teammate, or edit details before assigning.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {editingTeammateId && (
                  <button
                    type="button"
                    onClick={resetTeamForm}
                    className="text-xs font-semibold text-slate-500 underline underline-offset-4"
                  >
                    Cancel edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    resetTeamForm();
                    setShowTeamPanel(false);
                  }}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300"
                >
                  Close
                </button>
              </div>
            </div>

            <form onSubmit={saveTeammate} className="mt-4 grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Full name</span>
                  <input
                    value={teammateName}
                    onChange={(e) => setTeammateName(e.target.value)}
                    placeholder="Ex: Priya Singh"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 shadow-inner transition focus:border-blue-400 focus:bg-white focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Role</span>
                  <input
                    value={teammateRole}
                    onChange={(e) => setTeammateRole(e.target.value)}
                    placeholder="Ex: Engineering"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 shadow-inner transition focus:border-blue-400 focus:bg-white focus:outline-none"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Teammate ID</span>
                <input
                  value={teammateId}
                  onChange={(e) => setTeammateId(e.target.value)}
                  placeholder="priya-singh"
                  required={!editingTeammateId}
                  disabled={Boolean(editingTeammateId)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 shadow-inner transition focus:border-blue-400 focus:bg-white focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50"
                />
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={teamLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-500/20 transition hover:from-emerald-500 hover:to-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {teamLoading ? "Saving..." : editingTeammateId ? "Save teammate" : "Add teammate"}
                </button>
                <p className="text-xs text-slate-500">Changes sync instantly with assignments.</p>
              </div>
            </form>

            <div className="mt-6 max-h-64 space-y-2 overflow-y-auto pr-1">
              {team.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{member.name}</span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                        {member.role || "Teammate"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">ID: {member.id}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => startTeamEdit(member)}
                    className="self-start rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300"
                  >
                    Edit
                  </button>
                </div>
              ))}
              {!team.length && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-500">
                  No teammates yet. Add someone above to start assigning.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
