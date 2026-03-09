import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { EmailService } from './email.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>('BREVO_SMTP_HOST', 'smtp-relay.brevo.com'),
          port: config.get<number>('BREVO_SMTP_PORT', 587),
          secure: false, // TLS via STARTTLS na porta 587
          auth: {
            user: config.get<string>('BREVO_SMTP_USER'),
            pass: config.get<string>('BREVO_SMTP_PASS'),
          },
        },
        defaults: {
          from: `"${config.get<string>('BREVO_SENDER_NAME', 'TalentForge')}" <${config.get<string>('BREVO_SENDER_EMAIL', 'noreply@talentforge.com.br')}>`,
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: { strict: true },
        },
      }),
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
