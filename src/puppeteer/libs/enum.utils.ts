import { RendererConfigurationException } from '../../exceptions';

/** @throws RendererConfigurationException when `value` is not a member of `enumObject`. */
export function toEnumMember<E extends Record<string, string>>(
  enumObject: E,
  value: string,
  label: string,
): E[keyof E] {
  const members = Object.values(enumObject);
  const isMember = (candidate: string): candidate is E[keyof E] =>
    candidate === value;

  const member = members.find(isMember);
  if (member === undefined) {
    throw new RendererConfigurationException(
      `Unsupported ${label} '${value}': expected one of ${members
        .map((m) => `'${m}'`)
        .join(', ')}`,
    );
  }
  return member;
}
