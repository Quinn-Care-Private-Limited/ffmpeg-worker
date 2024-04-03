export type CreateTag = {
  name: string;
  tagKeyId: string;
};

export type ListTagFilter = {
  pageSize?: number;
  currentPage?: number;
  search?: string;
};

export type TagType = {
  id: string;
  displayValue: string;
  environmentId: string;
  keyId: string;
  createdAt: string;
  updatedAt: string;
};
export type TagListResponse = {
  data: TagType[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
};
