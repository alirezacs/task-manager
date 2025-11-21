import { NextResponse } from "next/server";
import { findTeamIndex, teamMembers, persistData } from "../tasks/data";

export async function GET() {
  return NextResponse.json({ teamMembers });
}

export async function POST(request) {
  const payload = await request.json();
  const id = payload.id?.trim();
  const name = payload.name?.trim();
  const role = payload.role?.trim() || "Teammate";

  if (!id || !name) {
    return NextResponse.json({ error: "ID and name are required." }, { status: 400 });
  }

  if (findTeamIndex(id) !== -1) {
    return NextResponse.json({ error: "That teammate ID already exists." }, { status: 400 });
  }

  const member = { id, name, role };
  teamMembers.push(member);
  persistData();

  return NextResponse.json({ member }, { status: 201 });
}
