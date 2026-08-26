import "server-only";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { cloudinaryFolder, isCloudinaryConfigured } from "@/lib/storage-config";

function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!.trim(),
    api_key: process.env.CLOUDINARY_API_KEY!.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET!.trim(),
    secure: true,
  });
}

/**
 * Persist a public image and return a durable HTTPS URL for Event.poster/banner
 * or Contestant.image.
 *
 * Primary: Cloudinary (CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET)
 * Local fallback only: public/uploads when Cloudinary is unset and not on Vercel
 */
export async function storePublicImage(input: {
  bytes: Buffer;
  filename: string;
  contentType: string;
}) {
  if (isCloudinaryConfigured()) {
    configureCloudinary();
    const publicId = input.filename.replace(/\.[^.]+$/, "");
    const dataUri = `data:${input.contentType};base64,${input.bytes.toString("base64")}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: cloudinaryFolder(),
      public_id: publicId,
      resource_type: "image",
      overwrite: false,
    });

    if (!result.secure_url) {
      throw new Error("Cloudinary did not return a secure image URL.");
    }

    return {
      url: result.secure_url,
      provider: "cloudinary" as const,
      publicId: result.public_id,
    };
  }

  const onVercel = Boolean(process.env.VERCEL);
  if (onVercel || process.env.NODE_ENV === "production") {
    throw new Error(
      "Image uploads require Cloudinary. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, input.filename), input.bytes);
  return {
    url: `/uploads/${input.filename}`,
    provider: "local-filesystem" as const,
  };
}

export { isCloudinaryConfigured };
