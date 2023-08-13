export type Reference = {
  name: string;
  version: string;
  resolved?: string;
  source: string;
  type: string;
};

export type Release = {
  name: string;
  version: string;
  engines: Partial<Record<string, string>> & {
    node?: string;
  };
  references: Reference[];
  packages: Reference[];
};
