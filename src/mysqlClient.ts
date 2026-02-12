// MySQL Database API Service
// This file replaces supabaseClient.ts and provides MySQL connectivity

import axios, { AxiosInstance } from 'axios';

// API Base URL - Update this to match your backend server URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response type for database operations
interface DBResponse<T> {
  data: T | null;
  error: Error | null;
  count?: number;
}

// Query builder class to mimic Supabase's query pattern
class QueryBuilder<T> {
  private tableName: string;
  private selectFields: string = '*';
  private whereConditions: Array<{ field: string; operator: string; value: any }> = [];
  private orConditions: string[] = [];
  private orderByField: string | null = null;
  private orderDirection: 'asc' | 'desc' = 'asc';
  private limitValue: number | null = null;
  private offsetValue: number = 0;
  private isSingle: boolean = false;
  private inConditions: Array<{ field: string; values: any[] }> = [];

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(fields: string = '*'): this {
    this.selectFields = fields;
    return this;
  }

  eq(field: string, value: any): this {
    this.whereConditions.push({ field, operator: '=', value });
    return this;
  }

  neq(field: string, value: any): this {
    this.whereConditions.push({ field, operator: '!=', value });
    return this;
  }

  gt(field: string, value: any): this {
    this.whereConditions.push({ field, operator: '>', value });
    return this;
  }

  gte(field: string, value: any): this {
    this.whereConditions.push({ field, operator: '>=', value });
    return this;
  }

  lt(field: string, value: any): this {
    this.whereConditions.push({ field, operator: '<', value });
    return this;
  }

  lte(field: string, value: any): this {
    this.whereConditions.push({ field, operator: '<=', value });
    return this;
  }

  like(field: string, pattern: string): this {
    this.whereConditions.push({ field, operator: 'LIKE', value: pattern });
    return this;
  }

  ilike(field: string, pattern: string): this {
    // MySQL's LIKE is case-insensitive by default with utf8mb4_unicode_ci collation
    this.whereConditions.push({ field, operator: 'LIKE', value: pattern });
    return this;
  }

  in(field: string, values: any[]): this {
    this.inConditions.push({ field, values });
    return this;
  }

  or(condition: string): this {
    this.orConditions.push(condition);
    return this;
  }

  order(field: string, options?: { ascending?: boolean }): this {
    this.orderByField = field;
    this.orderDirection = options?.ascending === false ? 'desc' : 'asc';
    return this;
  }

  limit(count: number): this {
    this.limitValue = count;
    return this;
  }

  range(from: number, to: number): this {
    this.offsetValue = from;
    this.limitValue = to - from + 1;
    return this;
  }

  single(): this {
    this.isSingle = true;
    this.limitValue = 1;
    return this;
  }

  // Build query parameters object
  private buildQueryParams() {
    return {
      table: this.tableName,
      select: this.selectFields,
      where: this.whereConditions,
      or: this.orConditions,
      in: this.inConditions,
      orderBy: this.orderByField,
      orderDirection: this.orderDirection,
      limit: this.limitValue,
      offset: this.offsetValue,
      single: this.isSingle,
    };
  }

  // Execute SELECT query
  async execute(): Promise<DBResponse<T>> {
    try {
      const response = await apiClient.post('/query', this.buildQueryParams());
      
      if (this.isSingle && response.data.data) {
        return {
          data: response.data.data[0] || null,
          error: null,
          count: response.data.count,
        };
      }
      
      return {
        data: response.data.data || [],
        error: null,
        count: response.data.count,
      };
    } catch (error: any) {
      console.error('Query execution error:', error);
      return {
        data: null,
        error: error.response?.data?.error || error.message || error,
      };
    }
  }

  // Make it thenable so it can be awaited like a promise
  then<TResult1 = DBResponse<T>, TResult2 = never>(
    onfulfilled?: ((value: DBResponse<T>) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
  ): PromiseLike<DBResponse<T> | TResult> {
    return this.execute().catch(onrejected);
  }
}

// Insert builder class
class InsertBuilder<T> {
  private tableName: string;
  private records: any[];

  constructor(tableName: string, records: any | any[]) {
    this.tableName = tableName;
    this.records = Array.isArray(records) ? records : [records];
  }

  async execute(): Promise<DBResponse<T>> {
    try {
      const response = await apiClient.post('/insert', {
        table: this.tableName,
        records: this.records,
      });

      return {
        data: response.data.data,
        error: null,
      };
    } catch (error: any) {
      console.error('Insert error:', error);
      return {
        data: null,
        error: error.response?.data?.error || error.message || error,
      };
    }
  }

  then<TResult1 = DBResponse<T>, TResult2 = never>(
    onfulfilled?: ((value: DBResponse<T>) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
  ): PromiseLike<DBResponse<T> | TResult> {
    return this.execute().catch(onrejected);
  }
}

// Update builder class
class UpdateBuilder<T> {
  private tableName: string;
  private updates: any;
  private whereConditions: Array<{ field: string; operator: string; value: any }> = [];
  private inConditions: Array<{ field: string; values: any[] }> = [];

  constructor(tableName: string, updates: any) {
    this.tableName = tableName;
    this.updates = updates;
  }

  eq(field: string, value: any): this {
    this.whereConditions.push({ field, operator: '=', value });
    return this;
  }

  in(field: string, values: any[]): this {
    this.inConditions.push({ field, values });
    return this;
  }

  async execute(): Promise<DBResponse<T>> {
    try {
      const response = await apiClient.post('/update', {
        table: this.tableName,
        updates: this.updates,
        where: this.whereConditions,
        in: this.inConditions,
      });

      return {
        data: response.data.data,
        error: null,
      };
    } catch (error: any) {
      console.error('Update error:', error);
      return {
        data: null,
        error: error.response?.data?.error || error.message || error,
      };
    }
  }

  then<TResult1 = DBResponse<T>, TResult2 = never>(
    onfulfilled?: ((value: DBResponse<T>) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
  ): PromiseLike<DBResponse<T> | TResult> {
    return this.execute().catch(onrejected);
  }
}

// Delete builder class
class DeleteBuilder {
  private tableName: string;
  private whereConditions: Array<{ field: string; operator: string; value: any }> = [];

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  eq(field: string, value: any): this {
    this.whereConditions.push({ field, operator: '=', value });
    return this;
  }

  async execute(): Promise<DBResponse<any>> {
    try {
      const response = await apiClient.post('/delete', {
        table: this.tableName,
        where: this.whereConditions,
      });

      return {
        data: response.data.data,
        error: null,
      };
    } catch (error: any) {
      console.error('Delete error:', error);
      return {
        data: null,
        error: error.response?.data?.error || error.message || error,
      };
    }
  }

  then<TResult1 = DBResponse<any>, TResult2 = never>(
    onfulfilled?: ((value: DBResponse<any>) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
  ): PromiseLike<DBResponse<any> | TResult> {
    return this.execute().catch(onrejected);
  }
}

// Main database client object (mimics Supabase client)
export const db = {
  from<T = any>(tableName: string) {
    return {
      select: (fields: string = '*') => {
        const query = new QueryBuilder<T>(tableName);
        query.select(fields);
        return query;
      },
      insert: (records: any | any[]) => {
        const builder = new InsertBuilder<T>(tableName, records);
        return builder;
      },
      update: (updates: any) => {
        return new UpdateBuilder<T>(tableName, updates);
      },
      delete: () => {
        return new DeleteBuilder(tableName);
      },
    };
  },
};

// Export the db client as the default export
export default db;
