export function requireService<T>(service: T | undefined, name: string): T {
  if (!service) {
    throw new Error(
      `${name} service is not available. If the problem persists, open an issue in the repo.`,
    );
  }

  return service;
}
