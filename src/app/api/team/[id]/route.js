import { NextResponse } from "next/server";
import { findTeamIndex, teamMembers } from "../../tasks/data";

export async function PUT(request, { params }) {
  const { id } = params;
  const payload = await request.json();

  const index = findTeamIndex(id);
  if (index === -1) {
    return NextResponse.json({ error: "Teammate not found." }, { status: 404 });
  }

  const name = payload.name?.trim();
  const role = payload.role?.trim();

  if (!name && !role) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const existing = teamMembers[index];
  const updated = {
    ...existing,
    name: name ?? existing.name,
    role: role ?? existing.role,
  };

  teamMembers[index] = updated;
  return NextResponse.json({ member: updated });
}
