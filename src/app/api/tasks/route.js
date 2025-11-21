import { NextResponse } from "next/server";
import { makeId, tasks, teamMembers, persistData } from "./data";

export async function GET() {
  return NextResponse.json({ tasks, teamMembers });
}

export async function POST(request) {
  const payload = await request.json();
  const { title, description = "", assignees = [], dueDate = null } = payload;

  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  const newTask = {
    id: makeId(),
    title: title.trim(),
    description: description.trim(),
    assignees,
    dueDate,
    status: "todo",
  };

  tasks.unshift(newTask);
  persistData();

  return NextResponse.json({ task: newTask }, { status: 201 });
}
