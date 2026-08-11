import registryData from "../registry.json" with { type: "json" };

export interface RegistryFile {
  source: string;
  target: string;
}

export interface RegistryEntry {
  name: string;
  type: "ui" | "lib" | "style" | "block" | "template";
  description: string;
  files: RegistryFile[];
  dependencies: string[];
  registryDependencies: string[];
  access: "free" | "pro";
}

interface RegistryData {
  libs: Record<string, RegistryEntry>;
  components: Record<string, RegistryEntry>;
  styles: Record<string, RegistryEntry>;
}

const registry = registryData as RegistryData;

export function getComponent(name: string): RegistryEntry | undefined {
  return registry.components[name];
}

export function getLib(name: string): RegistryEntry | undefined {
  return registry.libs[name];
}

export function getStyle(name: string): RegistryEntry | undefined {
  return registry.styles[name];
}

export function getAllComponents(): RegistryEntry[] {
  return Object.values(registry.components);
}

export function getAllLibs(): RegistryEntry[] {
  return Object.values(registry.libs);
}

/**
 * Resolve a component and all its registry dependencies (libs and other components).
 * Returns a flat list of all entries that need to be installed, in dependency order.
 */
export function resolveWithDependencies(
  componentNames: string[]
): {
  components: RegistryEntry[];
  libs: RegistryEntry[];
  styles: RegistryEntry[];
  npmDependencies: string[];
} {
  const resolvedComponents = new Map<string, RegistryEntry>();
  const resolvedLibs = new Map<string, RegistryEntry>();
  const resolvedStyles = new Map<string, RegistryEntry>();
  const npmDeps = new Set<string>();

  function resolveEntry(name: string): void {
    // Check if it's a component
    const component = getComponent(name);
    if (component) {
      if (resolvedComponents.has(name)) return;
      resolvedComponents.set(name, component);

      for (const dep of component.dependencies) {
        npmDeps.add(dep);
      }
      for (const regDep of component.registryDependencies) {
        resolveEntry(regDep);
      }
      return;
    }

    // Check if it's a lib
    const lib = getLib(name);
    if (lib) {
      if (resolvedLibs.has(name)) return;
      resolvedLibs.set(name, lib);

      for (const dep of lib.dependencies) {
        npmDeps.add(dep);
      }
      for (const regDep of lib.registryDependencies) {
        resolveEntry(regDep);
      }
      return;
    }

    // Check if it's a style
    const style = getStyle(name);
    if (style) {
      if (resolvedStyles.has(name)) return;
      resolvedStyles.set(name, style);

      for (const dep of style.dependencies) {
        npmDeps.add(dep);
      }
      for (const regDep of style.registryDependencies) {
        resolveEntry(regDep);
      }
    }
  }

  for (const name of componentNames) {
    resolveEntry(name);
  }

  return {
    components: Array.from(resolvedComponents.values()),
    libs: Array.from(resolvedLibs.values()),
    styles: Array.from(resolvedStyles.values()),
    npmDependencies: Array.from(npmDeps),
  };
}
