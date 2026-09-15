import { getCurrentUser } from "@/lib/auth";
import { cloudinary } from "@/lib/cloudinary";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // --------------------------------------------------
    // Read multipart/form-data
    // --------------------------------------------------

    const formData = await request.formData();

    const file = formData.get("file");

    // --------------------------------------------------
    // Validate file exists
    // --------------------------------------------------

    if (!(file instanceof File)) {
      return Response.json(
        { error: "Image file is required" },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // Validate file type
    // --------------------------------------------------

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      return Response.json(
        {
          error:
            "Invalid image type. Only JPEG, PNG, and WebP images are allowed.",
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // Validate file size
    // --------------------------------------------------

    const maxFileSize = 5 * 1024 * 1024; // 5 MB

    if (file.size > maxFileSize) {
      return Response.json(
        {
          error: "Image is too large. Maximum file size is 5 MB.",
        },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();

    const buffer = Buffer.from(bytes);

    const result = await new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "market-place/products",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              reject(error);
              return;
            }

            if (!result) {
              reject(new Error("Cloudinary returned no result"));
              return;
            }

            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
            });
          },
        )
        .end(buffer);
    });

    // --------------------------------------------------
    // Response
    // --------------------------------------------------

    return Response.json(
      {
        message: "Image uploaded successfully",
        url: result.secure_url,
        publicId: result.public_id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Cloudinary upload error:", error);

    return Response.json(
      {
        error: "Failed to upload image",
      },
      { status: 500 },
    );
  }
}
