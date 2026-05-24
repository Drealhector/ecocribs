/**
 * Stub for `convex/_generated/dataModel.ts` — replaced by `convex dev`.
 */
export type Id<TableName extends string> = string & { __tableName: TableName };
export type Doc<TableName extends string> = Record<string, any> & {
  _id: Id<TableName>;
  _creationTime: number;
};
export type DataModel = Record<string, unknown>;
export type TableNames = string;
