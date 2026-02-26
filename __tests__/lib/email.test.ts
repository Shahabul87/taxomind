const sendMock = jest.fn();
const resendConstructorMock = jest.fn().mockImplementation(() => ({
  emails: {
    send: sendMock,
  },
}));

jest.mock('resend', () => ({
  Resend: resendConstructorMock,
}));

describe('lib/email', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns configuration error when RESEND_API_KEY is missing', async () => {
    const { sendEmail } = await import('@/lib/email');

    const result = await sendEmail({
      to: 'user@example.com',
      subject: 'Test',
      text: 'hello',
      html: '<p>hello</p>',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Email service not configured');
  });

  it('sends email successfully when configured', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.EMAIL_FROM = 'noreply@example.com';
    sendMock.mockResolvedValue({ data: { id: 'email-1' }, error: null });

    const { sendEmail } = await import('@/lib/email');
    const result = await sendEmail({
      to: 'user@example.com',
      subject: 'Subject',
      text: 'Body',
      html: '<p>Body</p>',
    });

    expect(result.success).toBe(true);
    expect(resendConstructorMock).toHaveBeenCalledWith('re_test_key');
    expect(sendMock).toHaveBeenCalledWith({
      from: 'noreply@example.com',
      to: 'user@example.com',
      subject: 'Subject',
      text: 'Body',
      html: '<p>Body</p>',
    });
  });

  it('returns provider error response when resend returns error', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    sendMock.mockResolvedValue({ data: null, error: { message: 'provider failure' } });

    const { sendEmail } = await import('@/lib/email');
    const result = await sendEmail({
      to: 'user@example.com',
      subject: 'Subject',
      text: 'Body',
      html: '<p>Body</p>',
    });

    expect(result.success).toBe(false);
    expect(result.error).toEqual({ message: 'provider failure' });
  });

  it('returns exception message when send throws', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    sendMock.mockRejectedValue(new Error('network down'));

    const { sendEmail } = await import('@/lib/email');
    const result = await sendEmail({
      to: 'user@example.com',
      subject: 'Subject',
      text: 'Body',
      html: '<p>Body</p>',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('network down');
  });
});
