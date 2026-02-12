import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

/**
 * Uploads an image buffer to Cloudinary and returns both full and thumbnail URLs.
 * Requirements:
 * - Accepts file from multipart/form-data (multer memoryStorage)
 * - Generates thumbnail automatically (Cloudinary eager transform)
 * - Returns imageUrl + thumbnailUrl
 */
export async function uploadArtworkImageToCloudinary(
  file,
  { folder = "artworks" } = {}
) {
  if (!file?.buffer) {
    const err = new Error("Missing file buffer");
    err.statusCode = 400;
    throw err;
  }

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        eager: [
          {
            width: 400,
            height: 400,
            crop: "fill",
            quality: "auto",
            fetch_format: "auto",
          },
        ],
        eager_async: false,
      },
      (error, uploadResult) => {
        if (error) return reject(error);
        resolve(uploadResult);
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });

  const thumbnailUrl = result?.eager?.[0]?.secure_url || result?.secure_url;

  return {
    imageUrl: result.secure_url,
    thumbnailUrl,
    publicId: result.public_id,
  };
}

export async function deleteArtworkFromCloudinary(publicId) {
  if (!publicId) return { ok: true, deleted: false };
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });
  return { ok: true, deleted: result?.result === "ok", result };
}
