import { getCurrentUser } from "@/lib/auth";
import { cloudinary, deleteCloudinaryImage } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json(
        { error: "Image file is required" },
        { status: 400 },
      );
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      return Response.json(
        {
          error: "Only JPEG, PNG, and WebP images are allowed.",
        },
        { status: 400 },
      );
    }

    const maxFileSize = 5 * 1024 * 1024;

    if (file.size > maxFileSize) {
      return Response.json(
        {
          error: "Image is too large. Maximum size is 5 MB.",
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
            folder: "market-place/profiles",
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

    const oldPublicId = user.profileImagePublicId;

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        profileImage: result.secure_url,
        profileImagePublicId: result.public_id,
      },
    });

    // Delete the previous image only after the database
    // has successfully stored the new image.
    if (oldPublicId) {
      await deleteCloudinaryImage(oldPublicId);
    }

    return Response.json({
      message: "Profile picture updated successfully",
      profileImage: result.secure_url,
    });
  } catch (error) {
    console.error("Profile image upload error:", error);

    return Response.json(
      {
        error: "Failed to upload profile picture",
      },
      { status: 500 },
    );
  }
}
