import { HttpError, updatePass } from "@/lib/pass-service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { return Response.json(await updatePass((await params).id, await request.json())); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unexpected server error." }, { status: error instanceof HttpError ? error.status : 502 }); }
}
