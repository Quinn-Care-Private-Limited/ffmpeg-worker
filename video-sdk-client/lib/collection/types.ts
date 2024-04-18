export type SearchCollectionParams = {
  currentPage?: number;
  pageSize?: number;
} & ({ tagKey: string } | { tagValue: string } | { tagId: string });
