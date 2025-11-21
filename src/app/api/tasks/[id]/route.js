import { NextResponse } from "next/server";
import { findTaskIndex, tasks, persistData } from "../data";

export async function PUT(request, { params }) {
  const { id } = params;
  const payload = await request.json();

  const index = findTaskIndex(id);
  if (index === -1) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  const current = tasks[index];
  const updated = {
    ...current,
    ...payload,
    title: payload.title?.trim() ?? current.title,
    description: payload.description?.trim() ?? current.description,
  };

  tasks[index] = updated;
  persistData();
  return NextResponse.json({ task: updated });
}

export async function PATCH(request, { params }) {
  const { id } = params;
  const payload = await request.json();

  const index = findTaskIndex(id);
  if (index === -1) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  const current = tasks[index];
  const status = payload.status ?? current.status;

  tasks[index] = { ...current, status };
  persistData();
  return NextResponse.json({ task: tasks[index] });
}

export async function DELETE(_, { params }) {
  const { id } = params;
  const index = findTaskIndex(id);

  if (index === -1) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  const removed = tasks.splice(index, 1)[0];
  persistData();
  return NextResponse.json({ task: removed });
}
