describe('EmailService - sendInvitationEmail', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should send an invitation email successfully', async () => {
    const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-message-id' });
    jest.doMock('nodemailer', () => ({
      createTransport: jest.fn(() => ({ sendMail: mockSendMail })),
    }));

    process.env.NODE_ENV = 'production';
    process.env.SMTP_USER = 'test@example.com';
    process.env.SMTP_PASS = 'secret';

    const { sendInvitationEmail } = await import('../../src/services/email.service');

    await sendInvitationEmail('guest@example.com', 'Test Event', 'http://localhost/join');

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'guest@example.com',
        subject: expect.stringContaining('Test Event'),
        html: expect.stringContaining('http://localhost/join'),
      })
    );
  });

  it('should skip sending when in production without SMTP credentials', async () => {
    const mockSendMail = jest.fn();
    jest.doMock('nodemailer', () => ({
      createTransport: jest.fn(() => ({ sendMail: mockSendMail })),
    }));

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    process.env.NODE_ENV = 'production';
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    const { sendInvitationEmail } = await import('../../src/services/email.service');

    await sendInvitationEmail('guest@example.com', 'Test Event', 'http://localhost/join');

    expect(mockSendMail).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('should handle sendMail error gracefully in dev mode', async () => {
    const failingSendMail = jest.fn().mockRejectedValue(new Error('SMTP connection failed'));
    jest.doMock('nodemailer', () => ({
      createTransport: jest.fn(() => ({ sendMail: failingSendMail })),
    }));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    process.env.NODE_ENV = 'development';
    process.env.SMTP_USER = 'test@example.com';
    process.env.SMTP_PASS = 'secret';

    const { sendInvitationEmail } = await import('../../src/services/email.service');

    await expect(
      sendInvitationEmail('guest@example.com', 'Test Event', 'http://localhost/join')
    ).resolves.toBeUndefined();

    consoleSpy.mockRestore();
    warnSpy.mockRestore();
    logSpy.mockRestore();
  });
});
