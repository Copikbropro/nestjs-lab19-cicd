import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      application: 'NestJS Lab 17-19 (Auth, Docker Multi-Stage, CI/CD)',
      status: 'running',
      environment: process.env.NODE_ENV || 'development',
      port: parseInt(process.env.PORT, 10) || 3000,
    };
  }

  getHealth() {
    return {
      status: 'ok',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
