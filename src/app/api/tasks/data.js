import crypto from "crypto";

export const makeId = () => crypto.randomUUID();

export let teamMembers = [
  { id: "alex", name: "Alex Rivera", role: "Product" },
  { id: "mia", name: "Mia Wong", role: "Design" },
  { id: "sam", name: "Sam Patel", role: "Engineering" },
  { id: "zoe", name: "Zoe Miller", role: "QA" },
  { id: "ivan", name: "Ivan Duarte", role: "Data" },
];

const seedTasks = [
  {
    id: makeId(),
    title: "Design mobile-first task cards",
    description:
      "Draft a responsive card layout for the new task manager and align colors with the brand palette.",
    status: "in-progress",
    assignees: ["alex", "mia"],
    dueDate: "2024-11-08",
  },
  {
    id: makeId(),
    title: "Set up API routes",
    description: "Create CRUD endpoints for tasks so the UI can stay fully reactive.",
    status: "todo",
    assignees: ["sam"],
    dueDate: "2024-11-12",
  },
];

export let tasks = [...seedTasks];

export function findTaskIndex(taskId) {
  return tasks.findIndex((task) => task.id === taskId);
}

export function findTeamIndex(teamId) {
  return teamMembers.findIndex((member) => member.id === teamId);
}
