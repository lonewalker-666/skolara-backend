import { FastifyInstance } from "fastify";


export type UploadResult = {
  path: string;
  signedUrl: string | null;
};

export async function uploadBufferToBucket(
  app: FastifyInstance,
  bucket: string,
  path: string,
  buffer: Buffer,
  contentType?: string,
): Promise<UploadResult> {
  console.log("Uploading to bucket", bucket, path);

  const { data, error } = await app.supabase.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType,
      upsert: true, // overwrite if same path; flip to false if you want failures on duplicates
    });

  if (error) {
    throw error;
  }

  // Optionally create a short-lived signed URL to return immediately
  const signed = await getSignedUrl(app, bucket, data.path, 60 * 60); // 1 hour
  return { path: data.path, signedUrl: signed };
}

export async function getSignedUrl(
  app: FastifyInstance,
  bucket: string,
  path: string,
  expiresInSeconds = 3600,
): Promise<string | null> {
  const { data, error } = await app.supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);

  if (error) {
    // If the object doesn't exist or bucket is misconfigured, bubble up
    throw error;
  }
  return data?.signedUrl ?? null;
}
