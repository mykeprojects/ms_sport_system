import { Module } from '@nestjs/common';
import { notificationsProvider } from './http-notifications.client';

/**
 * Exposes the notifications port (NOTIFICATIONS_SERVICE) implemented by the
 * HTTP client of the external notifications microservice.
 */
@Module({
  providers: [notificationsProvider],
  exports: [notificationsProvider.provide],
})
export class NotificationsModule {}
