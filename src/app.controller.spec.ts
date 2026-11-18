import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController (ЛР №19 — проверка работоспособности для CI/CD)', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('GET /', () => {
    it('должен возвращать информацию о запущенном приложении и порте', () => {
      const result = appController.getInfo();
      expect(result).toHaveProperty('status', 'running');
      expect(result).toHaveProperty('port');
    });
  });

  describe('GET /health', () => {
    it('должен возвращать статус ok для облачного health-check', () => {
      const result = appController.getHealth();
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
    });
  });
});
