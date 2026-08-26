import assert from "node:assert/strict";
import { test } from "node:test";
import { cloudinaryFolder, isCloudinaryConfigured } from "./storage-config";

test("isCloudinaryConfigured requires all three credentials", () => {
  assert.equal(isCloudinaryConfigured({}), false);
  assert.equal(
    isCloudinaryConfigured({
      CLOUDINARY_CLOUD_NAME: "demo",
      CLOUDINARY_API_KEY: "key",
    }),
    false,
  );
  assert.equal(
    isCloudinaryConfigured({
      CLOUDINARY_CLOUD_NAME: "demo",
      CLOUDINARY_API_KEY: "key",
      CLOUDINARY_API_SECRET: "secret",
    }),
    true,
  );
  assert.equal(
    isCloudinaryConfigured({
      CLOUDINARY_CLOUD_NAME: "  ",
      CLOUDINARY_API_KEY: "key",
      CLOUDINARY_API_SECRET: "secret",
    }),
    false,
  );
});

test("cloudinaryFolder defaults to votia", () => {
  assert.equal(cloudinaryFolder({}), "votia");
  assert.equal(cloudinaryFolder({ CLOUDINARY_FOLDER: " events " }), "events");
});
