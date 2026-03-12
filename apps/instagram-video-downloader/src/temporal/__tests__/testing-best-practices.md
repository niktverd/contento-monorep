# Temporal Testing Best Practices

Документация по лучшим практикам тестирования Temporal workflows и activities согласно официальной документации.

## 1. Deterministic Mocking для Workflow Тестов

### Принципы детерминизма

Workflow должны быть детерминистичными - при повторном выполнении с теми же входными данными они должны принимать те же решения.

```typescript
// ✅ ПРАВИЛЬНО: Детерминистичный workflow
export async function videoProcessingWorkflow(
  input: VideoWorkflowInput,
): Promise<VideoWorkflowResult> {
  // Используем proxyActivities для детерминизма
  const activities = proxyActivities<typeof activityTypes>({
    startToCloseTimeout: '5m',
  });

  // Workflow logic остается детерминистичным
  const downloadResult = await activities.downloadVideo(input);
  if (!downloadResult.success) {
    return {success: false, error: downloadResult.error, step: 'download'};
  }

  // Детерминистичное ветвление
  const processResult = await activities.processVideo({
    firebaseUrl: downloadResult.firebaseUrl!,
    scenarioId: input.scenarioId,
    accountId: input.accountId,
    sourceId: input.sourceId,
  });

  return processResult;
}

// ❌ НЕПРАВИЛЬНО: Недетерминистичный workflow
export async function badWorkflow() {
  // Math.random() недетерминистичен!
  const randomDelay = Math.random() * 1000;

  // Date.now() недетерминистичен!
  const timestamp = Date.now();

  // setTimeout недетерминистичен!
  setTimeout(() => {}, 1000);
}
```

### Тестирование с детерминистичными моками

```typescript
// src/temporal/workflows/__tests__/deterministic.test.ts
import {TestWorkflowEnvironment} from '@temporalio/testing';
import {Worker} from '@temporalio/worker';
import {videoProcessingWorkflow} from '../video-processing.workflow';

describe('Deterministic Workflow Tests', () => {
  let testEnv: TestWorkflowEnvironment;

  beforeAll(async () => {
    testEnv = await TestWorkflowEnvironment.createTimeSkipping();
  });

  afterAll(async () => {
    await testEnv?.teardown();
  });

  it('should produce same result on replay', async () => {
    const {client, nativeConnection} = testEnv;

    // Создаем worker с мокированными activities
    const worker = await Worker.create({
      connection: nativeConnection,
      taskQueue: 'test-deterministic',
      workflowsPath: require.resolve('../video-processing.workflow'),
      activities: {
        // Детерминистичные моки
        downloadVideo: async () => ({
          success: true,
          firebaseUrl: 'https://test.com/video.mp4',
        }),
        processVideo: async () => ({
          success: true,
          processedUrl: 'https://test.com/processed.mp4',
        }),
        createInstagramContainer: async () => ({
          success: true,
          mediaContainerId: 'container_123',
        }),
        publishInstagramPost: async () => ({
          success: true,
          postId: 'post_123',
          permalinkUrl: 'https://instagram.com/p/post_123',
        }),
      },
    });

    const runPromise = worker.run();

    // Первый запуск
    const handle1 = await client.workflow.start(videoProcessingWorkflow, {
      args: [{sourceId: 123, accountId: 456, scenarioId: 789}],
      taskQueue: 'test-deterministic',
      workflowId: 'deterministic-test-1',
    });

    const result1 = await handle1.result();

    // Второй запуск с теми же данными
    const handle2 = await client.workflow.start(videoProcessingWorkflow, {
      args: [{sourceId: 123, accountId: 456, scenarioId: 789}],
      taskQueue: 'test-deterministic',
      workflowId: 'deterministic-test-2',
    });

    const result2 = await handle2.result();

    // Результаты должны быть идентичными
    expect(result1).toEqual(result2);

    worker.shutdown();
    await runPromise;
  });
});
```

## 2. Activity Isolation с Context Mocking

### Правильное использование Activity Context

```typescript
// src/temporal/activities/__tests__/activity-isolation.test.ts
import {Context} from '@temporalio/activity';
import {downloadVideo} from '../download.activity';

// Мокируем Context для изоляции тестов
jest.mock('@temporalio/activity', () => ({
  Context: {
    current: jest.fn(),
  },
}));

describe('Activity Isolation Tests', () => {
  const mockContext = {
    heartbeat: jest.fn(),
    cancelled: false,
    info: {
      activityId: 'test-activity-123',
      workflowExecution: {
        workflowId: 'test-workflow-123',
        runId: 'test-run-123',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (Context.current as jest.Mock).mockReturnValue(mockContext);
  });

  it('should call heartbeat during long operations', async () => {
    // Мокируем fetch для контроля над timing
    global.fetch = jest.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
              headers: {get: () => 'video/mp4'},
            });
          }, 100);
        }),
    );

    const input = {
      sourceId: 123,
      accountId: 456,
      scenarioId: 789,
      firebaseUrl: 'https://test.com/video.mp4',
    };

    await downloadVideo(input);

    // Проверяем что heartbeat был вызван
    expect(mockContext.heartbeat).toHaveBeenCalledWith('Fetching source data');
    expect(mockContext.heartbeat).toHaveBeenCalledWith('Downloading video from source URL');
  });

  it('should handle activity cancellation', async () => {
    // Симулируем отмену activity
    mockContext.cancelled = true;

    const input = {
      sourceId: 123,
      accountId: 456,
      scenarioId: 789,
    };

    const result = await downloadVideo(input);

    // Activity должна корректно обработать отмену
    expect(result.success).toBe(false);
    expect(result.error).toContain('cancelled');
  });
});
```

## 3. Replay Compatibility Testing

### Тестирование совместимости при изменениях workflow

```typescript
// src/temporal/workflows/__tests__/replay-compatibility.test.ts
import {TestWorkflowEnvironment} from '@temporalio/testing';
import {Worker} from '@temporalio/worker';

describe('Replay Compatibility Tests', () => {
  let testEnv: TestWorkflowEnvironment;

  beforeAll(async () => {
    testEnv = await TestWorkflowEnvironment.createTimeSkipping();
  });

  afterAll(async () => {
    await testEnv?.teardown();
  });

  it('should maintain compatibility after workflow changes', async () => {
    const {client, nativeConnection} = testEnv;

    // Старая версия workflow (сохраненная история)
    const oldWorkflowHistory = [
      // Здесь была бы реальная история workflow из Temporal Server
      // Для демонстрации используем упрощенный пример
    ];

    // Новая версия workflow
    const worker = await Worker.create({
      connection: nativeConnection,
      taskQueue: 'test-replay',
      workflowsPath: require.resolve('../video-processing.workflow'),
      activities: {
        downloadVideo: async () => ({success: true, firebaseUrl: 'test.mp4'}),
        processVideo: async () => ({success: true, processedUrl: 'processed.mp4'}),
        // Новая activity (должна быть совместимой)
        newOptionalActivity: async () => ({success: true, data: 'new-data'}),
      },
    });

    // Тест replay с новой версией workflow
    // В реальном тесте здесь был бы код для replay существующей истории
    expect(true).toBe(true); // Placeholder для демонстрации структуры
  });

  it('should handle version changes with workflow.getVersion', async () => {
    // Пример использования workflow.getVersion для безопасных изменений
    const workflowCode = `
            import { proxyActivities, getVersion } from '@temporalio/workflow';
            
            export async function versionedWorkflow() {
                const version = await getVersion('add-new-step', 1, 2);
                
                if (version === 1) {
                    // Старая логика
                    return await oldProcessing();
                } else {
                    // Новая логика
                    return await newProcessing();
                }
            }
        `;

    expect(workflowCode).toContain('getVersion');
  });
});
```

## 4. Coverage Reporting для Temporal Code

### Jest конфигурация для coverage

```javascript
// jest.temporal.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/temporal'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/temporal/**/*.ts',
    '!src/temporal/**/*.test.ts',
    '!src/temporal/**/__tests__/**',
    '!src/temporal/types/**',
  ],
  coverageDirectory: 'coverage/temporal',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    'src/temporal/activities/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    'src/temporal/workflows/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
};
```

### NPM scripts для coverage

```json
{
  "scripts": {
    "test:temporal:coverage": "jest --config jest.temporal.config.js --coverage",
    "test:temporal:coverage:watch": "jest --config jest.temporal.config.js --coverage --watch",
    "test:temporal:coverage:html": "jest --config jest.temporal.config.js --coverage && open coverage/temporal/lcov-report/index.html"
  }
}
```

## 5. Дополнительные Best Practices

### 5.1 Использование Time Skipping в тестах

```typescript
it('should handle long-running workflows with time skipping', async () => {
  const {client} = testEnv;

  const handle = await client.workflow.start(longRunningWorkflow, {
    args: [input],
    taskQueue: 'test-time-skip',
    workflowId: 'time-skip-test',
  });

  // Пропускаем время вместо реального ожидания
  await testEnv.sleep('1 hour');

  const result = await handle.result();
  expect(result).toBeDefined();
});
```

### 5.2 Тестирование Error Handling

```typescript
it('should handle activity failures with proper retry logic', async () => {
  let attemptCount = 0;

  const worker = await Worker.create({
    connection: nativeConnection,
    taskQueue: 'test-retry',
    activities: {
      flakyActivity: async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return {success: true};
      },
    },
  });

  // Тест что activity retry работает корректно
  const result = await client.workflow.execute(workflowWithRetry, {
    taskQueue: 'test-retry',
    workflowId: 'retry-test',
  });

  expect(attemptCount).toBe(3);
  expect(result.success).toBe(true);
});
```

### 5.3 Мониторинг производительности тестов

```typescript
describe('Performance Tests', () => {
  it('should complete workflow within acceptable time', async () => {
    const startTime = Date.now();

    const result = await client.workflow.execute(videoProcessingWorkflow, {
      args: [testInput],
      taskQueue: 'perf-test',
      workflowId: 'perf-test-1',
    });

    const duration = Date.now() - startTime;

    expect(result.success).toBe(true);
    expect(duration).toBeLessThan(30000); // 30 секунд максимум
  });
});
```

## Заключение

Эти best practices обеспечивают:

1. **Детерминизм** - предсказуемое поведение workflow
2. **Изоляцию** - независимое тестирование компонентов
3. **Совместимость** - безопасные изменения workflow
4. **Покрытие** - полное тестирование функциональности
5. **Производительность** - быстрые и эффективные тесты

Следование этим принципам гарантирует надежность и maintainability Temporal-based системы.
