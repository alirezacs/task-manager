import crypto from "crypto";

export const makeId = () => crypto.randomUUID();

export let teamMembers = [
  { id: "alex", name: "Alex Rivera", role: "Product" },
  { id: "mia", name: "Mia Wong", role: "Design" },
  { id: "sam", name: "Sam Patel", role: "Engineering" },
  { id: "zoe", name: "Zoe Miller", role: "QA" },
  { id: "ivan", name: "Ivan Duarte", role: "Data" },
];

const toDateString = (offsetDays) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

const seedTasks = [
  {
    id: makeId(),
    title: "Design mobile-first task cards",
    description:
      "Draft a responsive card layout for the new task manager and align colors with the brand palette.",
    status: "in-progress",
    assignees: ["alex", "mia"],
    dueDate: toDateString(0),
  },
  {
    id: makeId(),
    title: "Set up API routes",
    description: "Create CRUD endpoints for tasks so the UI can stay fully reactive.",
    status: "todo",
    assignees: ["sam"],
    dueDate: toDateString(1),
  },
  {
    id: makeId(),
    title: "Review acceptance criteria",
    description: "Clarify success measures with QA and product so the team can ship confidently.",
    status: "todo",
    assignees: ["zoe"],
    dueDate: toDateString(-1),
  },
];

export let tasks = [...seedTasks];

export function findTaskIndex(taskId) {
  return tasks.findIndex((task) => task.id === taskId);
}

export function findTeamIndex(teamId) {
  return teamMembers.findIndex((member) => member.id === teamId);
}
