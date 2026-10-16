import { HttpError, createPass } from "@/lib/pass-service";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try { return Response.json(await createPass(await request.json()), { status: 201 }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unexpected server error." }, { status: error instanceof HttpError ? error.status : 502 }); }
}
