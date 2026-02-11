export class PushNotification {
  constructor(
    public readonly title: string,
    public readonly body: string,
    public readonly imageUrl: string | null,
    public readonly payload: Record<string, string>,
  ) {
    if (!title.trim()) {
      throw new Error('Push notification title cannot be empty');
    }
    if (!body.trim()) {
      throw new Error('Push notification body cannot be empty');
    }
  }
}
