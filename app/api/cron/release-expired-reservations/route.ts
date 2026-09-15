import { releaseExpiredReservations } from "@/lib/orders/releaseExpiredReservations";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");

  if (authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json(
      {
        error: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const releasedCount = await releaseExpiredReservations();

    return Response.json({
      success: true,
      releasedCount,
    });
  } catch (error) {
    console.error("Reservation cleanup failed:", error);

    return Response.json(
      {
        error: "Reservation cleanup failed",
      },
      {
        status: 500,
      },
    );
  }
}
