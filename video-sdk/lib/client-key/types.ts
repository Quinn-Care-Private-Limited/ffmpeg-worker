export type CreateClientKey = {
  name: string;
  envId: string;
};

export type DeleteClientKey = {
  id: string;
};
export type ClientKey = {
  id: string;
  environmentId: string;
  key: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};
