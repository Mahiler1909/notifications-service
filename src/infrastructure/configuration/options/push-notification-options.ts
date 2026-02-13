import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PushNotificationOptions {
  constructor(private _configService: ConfigService) {}

  get projectId(): string {
    const id = this._configService.get<string>('FIREBASE_PROJECT_ID');
    if (!id) {
      throw new Error(
        'Missing push notification projectId configuration (FIREBASE_PROJECT_ID)',
      );
    }
    return id;
  }
}
