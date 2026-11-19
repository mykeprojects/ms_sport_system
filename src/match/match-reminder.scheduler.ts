import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { MatchNotificationService } from './match-notification.service';

@Injectable()
export class MatchReminderScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MatchReminderScheduler.name);
  private readonly jobName = 'match-reminder-dispatch';
  private job?: CronJob;

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService,
    private readonly notifications: MatchNotificationService,
  ) {}

  onModuleInit() {
    const enabled = this.boolEnv('MATCH_REMINDER_ENABLED', true);
    if (!enabled) {
      this.logger.log('Match reminder scheduler is disabled (MATCH_REMINDER_ENABLED=false).');
      return;
    }

    const expression = (this.configService.get<string>('MATCH_REMINDER_CRON') || '0 * * * *').trim();
    try {
      this.job = new CronJob(expression, () => {
        void this.run();
      });
      this.schedulerRegistry.addCronJob(this.jobName, this.job);
      this.job.start();
      this.logger.log(`Match reminder scheduler started with cron "${expression}".`);
    } catch (error) {
      this.logger.error(
        `Could not start match reminder scheduler (cron="${expression}"): ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  onModuleDestroy() {
    try {
      if (this.job) {
        this.job.stop();
      }
      if (this.schedulerRegistry.doesExist('cron', this.jobName)) {
        this.schedulerRegistry.deleteCronJob(this.jobName);
      }
    } catch {
      // ignore cleanup errors
    }
  }

  private async run() {
    try {
      const summary = await this.notifications.notifyUpcomingReminders();
      if (summary.matches || summary.sent || summary.failed || summary.exhausted) {
        this.logger.log(`Match reminder run: ${JSON.stringify(summary)}`);
      }
    } catch (error) {
      this.logger.warn(
        `Match reminder run failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }

  private boolEnv(key: string, fallback: boolean): boolean {
    const raw = this.configService.get<string>(key);
    if (raw == null || raw === '') return fallback;
    return !['false', '0', 'no', 'off'].includes(String(raw).toLowerCase());
  }
}
