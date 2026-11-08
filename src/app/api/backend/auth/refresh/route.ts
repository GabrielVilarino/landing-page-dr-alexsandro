import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Rota indisponível para acesso direto." },
    { status: 404 },
  );
}
