import { TestLogger, createLogger } from '@sunscope/core';
import { DeepLabV3Classifier, MockSkyClassifier } from '../src/sky-classifier';
import { ObstructionType } from '../src/types';

describe('sky-classifier', () => {
  it('creates configurable synthetic pixel grids', async () => {
    const classifier = new MockSkyClassifier('half-and-half');
    const result = await classifier.classifyFrame(new Uint8Array(16), 4, 2);

    expect(result[0]?.[0]).toBe(ObstructionType.Sky);
    expect(result[0]?.[3]).toBe(ObstructionType.Building);
  });

  it('logs classification distributions', async () => {
    const sink = new TestLogger();
    const logger = createLogger({
      moduleName: 'sky-classifier',
      sink
    });
    const classifier = new MockSkyClassifier('all-sky', logger);

    await classifier.classifyFrame(new Uint8Array(4), 2, 2);

    expect(sink.entries).toContainEqual(
      expect.objectContaining({
        message: 'MockSkyClassifier.classifyFrame.exit',
        data: expect.objectContaining({
          distribution: expect.objectContaining({
            Sky: 1
          })
        })
      })
    );
  });

  it('throws a clear native-bridge error for the DeepLab stub', async () => {
    const classifier = new DeepLabV3Classifier();

    await expect(classifier.classifyFrame(new Uint8Array(1), 1, 1)).rejects.toThrow(
      'Not implemented: requires native CoreML bridge'
    );
  });
});
