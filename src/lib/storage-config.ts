/** Pure env helpers for Cloudinary — safe to unit-test outside Next. */

export function isCloudinaryConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return Boolean(
    env.CLOUDINARY_CLOUD_NAME?.trim() &&
      env.CLOUDINARY_API_KEY?.trim() &&
      env.CLOUDINARY_API_SECRET?.trim(),
  );
}

export function cloudinaryFolder(env: NodeJS.ProcessEnv = process.env): string {
  return env.CLOUDINARY_FOLDER?.trim() || "votia";
}
