import { NextResponse } from "next/server";
import { canUploadEventMedia, validateImageUploadFile } from "@/lib/authz";
import { requireOrganizer } from "@/lib/session";
import { storePublicImage } from "@/lib/storage";

export async function POST(request: Request) {
  let organizer;
  try {
    organizer = await requireOrganizer();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user, organizer: profile } = organizer;
  if (
    !canUploadEventMedia({
      role: user.role,
      organizerStatus: profile?.status ?? null,
    })
  ) {
    return NextResponse.json(
      { error: "Organizer account must be approved before uploading images." },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const validation = validateImageUploadFile({
    size: file.size,
    type: file.type,
    name: file.name,
  });
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }

  const filename = `${Date.now()}-${crypto.randomUUID()}.${validation.ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    const stored = await storePublicImage({
      bytes,
      filename,
      contentType: file.type || `image/${validation.ext}`,
    });
    return NextResponse.json({ url: stored.url, provider: stored.provider });
  } catch (error) {
    console.error("Image upload failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to store image. Configure Cloudinary credentials.",
      },
      { status: 503 },
    );
  }
}
