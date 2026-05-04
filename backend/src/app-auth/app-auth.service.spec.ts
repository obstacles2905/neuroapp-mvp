import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AppUserRepository } from '../analytics/app-user.repository';
import { AppAuthService } from './app-auth.service';

const bcryptCompare = jest.fn();
const bcryptHash = jest.fn().mockResolvedValue('hashed');
jest.mock('bcrypt', () => ({
  __esModule: true,
  compare: (a: string, b: string) => bcryptCompare(a, b),
  hash: (p: string, r: number) => bcryptHash(p, r),
}));

describe('AppAuthService', () => {
  const userId = 'a0000000-0000-4000-8000-000000000001';
  const userEmail = 'u@example.com';
  const accessToken = 'test-access';

  const mockRepo = {
    findByEmail: jest.fn(),
    findByEmailForAuth: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const mockJwt = {
    signAsync: jest.fn().mockResolvedValue(accessToken),
  };

  let service: AppAuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    bcryptCompare.mockResolvedValue(true);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppAuthService,
        { provide: AppUserRepository, useValue: mockRepo },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();
    service = module.get<AppAuthService>(AppAuthService);
  });

  it('register creates user and returns token', async () => {
    expect.assertions(3);
    const displayName = 'Test User';
    const plainPassword = 'password1';
    mockRepo.findByEmail.mockResolvedValue(null);
    mockRepo.create.mockReturnValue({ email: userEmail });
    mockRepo.save.mockResolvedValue({ id: userId, email: userEmail });
    const result = await service.register({
      email: userEmail,
      password: plainPassword,
      passwordConfirm: plainPassword,
      displayName,
    });
    expect(result.accessToken).toBe(accessToken);
    expect(result.tokenType).toBe('Bearer');
    expect(mockJwt.signAsync).toHaveBeenCalled();
  });

  it('register throws on duplicate email', async () => {
    expect.assertions(1);
    const plainPassword = 'password1';
    mockRepo.findByEmail.mockResolvedValue({ id: userId });
    await expect(
      service.register({
        email: userEmail,
        password: plainPassword,
        passwordConfirm: plainPassword,
        displayName: 'Dup',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('login returns token when credentials match', async () => {
    expect.assertions(1);
    mockRepo.findByEmailForAuth.mockResolvedValue({
      id: userId,
      email: userEmail,
      passwordHash: 'hash',
    });
    const result = await service.login(userEmail, 'password1');
    expect(result.accessToken).toBe(accessToken);
  });

  it('login throws when user missing', async () => {
    expect.assertions(1);
    mockRepo.findByEmailForAuth.mockResolvedValue(null);
    await expect(service.login(userEmail, 'password1')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
