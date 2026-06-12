import {
  signAppMediaStreamPayload,
  verifyAppMediaStreamSignature,
} from './sign-app-media-stream.helper';

describe('signAppMediaStreamPayload', () => {
  const secret = 'test-secret';

  it('verifies a valid signature before expiry', () => {
    expect.assertions(1);
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const sig = signAppMediaStreamPayload('videos/demo.mp4', exp, secret);
    expect(
      verifyAppMediaStreamSignature('videos/demo.mp4', exp, sig, secret),
    ).toBe(true);
  });

  it('rejects expired signatures', () => {
    expect.assertions(1);
    const exp = Math.floor(Date.now() / 1000) - 10;
    const sig = signAppMediaStreamPayload('videos/demo.mp4', exp, secret);
    expect(
      verifyAppMediaStreamSignature('videos/demo.mp4', exp, sig, secret),
    ).toBe(false);
  });
});
