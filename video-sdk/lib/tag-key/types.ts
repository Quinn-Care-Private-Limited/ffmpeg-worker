export type CreateTagKey = {
  name: string;
  dataType: "STRING" | "NUMBER" | "BOOLEAN" | "DATE";
};

export type UpdateTagKey = {
  tagKeyId: string;
  name: string;
};

export type ListTagKey = {
  pageSize?: number;
  currentPage?: number;
  search?: string;
};

export type TagKey = {
  id: string;
  name: string;
  dataType: "STRING" | "NUMBER" | "BOOLEAN" | "DATE";
  environmentId: string;
};

export type TagKeyListResponse = {
  data: TagKey[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
};
