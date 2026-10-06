export type NotificationSound = "general" | "error" | "paymentSuccess";

export const NOTIFICATION_SOUND_URLS: Record<NotificationSound, string> = {
  general: "/sounds/allnote.wav",
  error: "/sounds/error.mp3",
  paymentSuccess: "/sounds/success.wav",
};

export function getNotificationSound(
  title: string,
  message: string,
): NotificationSound {
  const text = `${title} ${message}`.toLowerCase();

  const isError =
    /\b(failed|failure|declined|unsuccessful|error|rejected)\b/.test(text);

  if (isError) return "error";

  const isSuccessfulPayment =
    /\b(payment|paid|transaction)\b/.test(text) &&
    /\b(success|successful|succeeded|confirmed|completed|received|paid)\b/.test(
      text,
    );

  if (isSuccessfulPayment) return "paymentSuccess";

  return "general";
}

export function playNotificationSound(sound: NotificationSound): void {
  if (typeof window === "undefined") return;

  const audio = new Audio(NOTIFICATION_SOUND_URLS[sound]);
  audio.volume = 0.65;

  void audio.play().catch((error: unknown) => {
    console.debug("Notification sound could not play:", error);
  });
}
