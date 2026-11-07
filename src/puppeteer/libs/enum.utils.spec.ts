import { RendererConfigurationException } from '../../exceptions';
import { toEnumMember } from './enum.utils';

enum Color {
  RED = 'red',
  BLUE = 'blue',
}

describe('toEnumMember', () => {
  it('should return the member matching the value', () => {
    const member: Color = toEnumMember(Color, 'blue', 'color');

    expect(member).toBe(Color.BLUE);
  });

  it('should throw a configuration error for a missing value', () => {
    expect(() => toEnumMember(Color, 'green', 'color')).toThrow(
      RendererConfigurationException,
    );
    expect(() => toEnumMember(Color, 'green', 'color')).toThrow(
      "Unsupported color 'green': expected one of 'red', 'blue'",
    );
  });

  it('should match values, not keys', () => {
    expect(() => toEnumMember(Color, 'RED', 'color')).toThrow(
      RendererConfigurationException,
    );
  });
});
