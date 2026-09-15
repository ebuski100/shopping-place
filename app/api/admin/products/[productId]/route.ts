import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

import { deleteCloudinaryImage } from "@/lib/cloudinary";
import {
  productIdSchema,
  productUpdateSchema,
} from "@/lib/validations/product";
import { requireAdmin } from "@/lib/auth";
type RouteContext = {
  params: Promise<{
    productId: string;
  }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { productId } = await params;

    const result = productIdSchema.safeParse(productId);

    if (!result.success) {
      return Response.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const id = result.data;

    const product = await prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    return Response.json(product);
  } catch (error) {
    console.error("Get admin product error:", error);

    return Response.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

// export async function PATCH(request: Request, { params }: RouteContext) {
//   try {
//     const admin = await requireAdmin();

//     if (!admin) {
//       return Response.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     if (admin.role !== "ADMIN") {
//       return Response.json({ error: "Forbidden" }, { status: 403 });
//     }

//     const { productId } = await params;

//     const idResult = productIdSchema.safeParse(productId);

//     if (!idResult.success) {
//       return Response.json(
//         {
//           error: idResult.error.issues[0].message,
//         },
//         { status: 400 },
//       );
//     }

//     const id = idResult.data;

//     let body: unknown;

//     try {
//       body = await request.json();
//     } catch {
//       return Response.json({ error: "Invalid JSON body" }, { status: 400 });
//     }

//     const result = productUpdateSchema.safeParse(body);

//     if (!result.success) {
//       return Response.json(
//         {
//           error: result.error.issues[0].message,
//         },
//         { status: 400 },
//       );
//     }

//     const product = await prisma.product.findUnique({
//       where: { id },
//     });

//     if (!product) {
//       return Response.json({ error: "Product not found" }, { status: 404 });
//     }

//     const updatedProduct = await prisma.product.update({
//       where: { id },
//       data: result.data,
//     });

//     return Response.json({
//       message: "Product updated successfully",
//       product: updatedProduct,
//     });
//   } catch (error) {
//     console.error("Update product error:", error);

//     return Response.json(
//       { error: "Failed to update product" },
//       { status: 500 },
//     );
//   }
// }

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    // ------------------------------------------
    // Authentication
    // ------------------------------------------

    const admin = await requireAdmin();

    if (!admin) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (admin.role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // ------------------------------------------
    // Validate product ID
    // ------------------------------------------

    const { productId } = await params;

    const idResult = productIdSchema.safeParse(productId);

    if (!idResult.success) {
      return Response.json(
        {
          error: idResult.error.issues[0].message,
        },
        { status: 400 },
      );
    }

    const id = idResult.data;

    // ------------------------------------------
    // Parse JSON
    // ------------------------------------------

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // ------------------------------------------
    // Validate update data
    // ------------------------------------------

    const result = productUpdateSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        {
          error: result.error.issues[0].message,
        },
        { status: 400 },
      );
    }

    // ------------------------------------------
    // Find existing product
    // ------------------------------------------

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    // ------------------------------------------
    // Remember old Cloudinary image
    // ------------------------------------------

    const oldCloudinaryPublicId = product.cloudinaryPublicId;

    const newCloudinaryPublicId = result.data.cloudinaryPublicId;

    // ------------------------------------------
    // Update database
    // ------------------------------------------

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: result.data,
    });

    // ------------------------------------------
    // Delete old Cloudinary image
    // ------------------------------------------

    const imageWasReplaced =
      oldCloudinaryPublicId &&
      newCloudinaryPublicId &&
      oldCloudinaryPublicId !== newCloudinaryPublicId;

    if (imageWasReplaced) {
      await deleteCloudinaryImage(oldCloudinaryPublicId);
    }

    // ------------------------------------------
    // Response
    // ------------------------------------------

    return Response.json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update product error:", error);

    return Response.json(
      {
        error: "Failed to update product",
      },
      { status: 500 },
    );
  }
}
