import { IsString, MinLength, validateSync } from 'class-validator';
import { MatchProperty } from './match-property.decorator.helper';

class PasswordPairDto {
  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MatchProperty('password')
  passwordConfirm!: string;
}

describe('MatchProperty', () => {
  const minPasswordLen = 8;

  it('passes when values match', () => {
    expect.assertions(1);
    const password = 'a'.repeat(minPasswordLen);
    const dto = new PasswordPairDto();
    dto.password = password;
    dto.passwordConfirm = password;
    const errors = validateSync(dto);
    expect(errors.length).toBe(0);
  });

  it('fails when values differ', () => {
    expect.assertions(1);
    const dto = new PasswordPairDto();
    const len = minPasswordLen;
    dto.password = 'a'.repeat(len);
    dto.passwordConfirm = 'b'.repeat(len);
    const errors = validateSync(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
