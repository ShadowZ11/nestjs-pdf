import { EngineNotAvailableException } from '../../exceptions';

export function requireService<T>(service: T | undefined, name: string): T {
  if (!service) {
    throw new EngineNotAvailableException(name);
  }

  return service;
}
