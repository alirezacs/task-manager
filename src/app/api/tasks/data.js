import crypto from "crypto";
import fs from "fs";
import path from "path";

export const makeId = () => crypto.randomUUID();

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "task-data.json");

const seedTeam = [
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

const ensureDataFile = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify({ tasks: seedTasks, teamMembers: seedTeam }, null, 2)
    );
  }
};

const loadData = () => {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      teamMembers: Array.isArray(parsed.teamMembers) ? parsed.teamMembers : [],
    };
  } catch (error) {
    console.error("Failed to load data file, falling back to seeds", error);
    return { tasks: seedTasks, teamMembers: seedTeam };
  }
};

const initialData = loadData();

export let tasks = initialData.tasks.length ? initialData.tasks : [...seedTasks];
export let teamMembers = initialData.teamMembers.length ? initialData.teamMembers : [...seedTeam];

export const persistData = () => {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify({ tasks, teamMembers }, null, 2));
};

export function findTaskIndex(taskId) {
  return tasks.findIndex((task) => task.id === taskId);
}

export function findTeamIndex(teamId) {
  return teamMembers.findIndex((member) => member.id === teamId);
}
