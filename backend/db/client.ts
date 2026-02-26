const DB_ENDPOINT = process.env.EXPO_PUBLIC_RORK_DB_ENDPOINT || "";
const DB_NAMESPACE = process.env.EXPO_PUBLIC_RORK_DB_NAMESPACE || "";
const DB_TOKEN = process.env.EXPO_PUBLIC_RORK_DB_TOKEN || "";

interface DbRecord {
  id: string;
  [key: string]: unknown;
}

class DatabaseClient {
  private baseUrl: string;
  private namespace: string;
  private token: string;

  constructor() {
    this.baseUrl = DB_ENDPOINT;
    this.namespace = DB_NAMESPACE;
    this.token = DB_TOKEN;
  }

  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.token}`,
    };
  }

  private getCollectionUrl(collection: string): string {
    return `${this.baseUrl}/${this.namespace}/${collection}`;
  }

  async create<T extends DbRecord>(collection: string, data: T): Promise<T> {
    console.log(`[DB] Creating record in ${collection}:`, data.id);
    const response = await fetch(this.getCollectionUrl(collection), {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[DB] Create failed for ${collection}:`, errorText);
      throw new Error(`Failed to create record in ${collection}: ${errorText}`);
    }
    return response.json();
  }

  async getById<T extends DbRecord>(collection: string, id: string): Promise<T | null> {
    console.log(`[DB] Getting record from ${collection}:`, id);
    const response = await fetch(`${this.getCollectionUrl(collection)}/${id}`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    if (response.status === 404) return null;
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[DB] Get failed for ${collection}/${id}:`, errorText);
      throw new Error(`Failed to get record from ${collection}: ${errorText}`);
    }
    return response.json();
  }

  async query<T extends DbRecord>(
    collection: string,
    filters?: Record<string, unknown>,
    options?: { limit?: number; offset?: number; orderBy?: string; order?: "asc" | "desc" }
  ): Promise<T[]> {
    console.log(`[DB] Querying ${collection} with filters:`, filters);
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    if (options?.limit) params.append("limit", String(options.limit));
    if (options?.offset) params.append("offset", String(options.offset));
    if (options?.orderBy) params.append("orderBy", options.orderBy);
    if (options?.order) params.append("order", options.order);

    const url = `${this.getCollectionUrl(collection)}?${params.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[DB] Query failed for ${collection}:`, errorText);
      throw new Error(`Failed to query ${collection}: ${errorText}`);
    }
    const result = await response.json();
    return Array.isArray(result) ? result : result.data || [];
  }

  async update<T extends DbRecord>(collection: string, id: string, data: Partial<T>): Promise<T> {
    console.log(`[DB] Updating record in ${collection}:`, id);
    const response = await fetch(`${this.getCollectionUrl(collection)}/${id}`, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[DB] Update failed for ${collection}/${id}:`, errorText);
      throw new Error(`Failed to update record in ${collection}: ${errorText}`);
    }
    return response.json();
  }

  async delete(collection: string, id: string): Promise<void> {
    console.log(`[DB] Deleting record from ${collection}:`, id);
    const response = await fetch(`${this.getCollectionUrl(collection)}/${id}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[DB] Delete failed for ${collection}/${id}:`, errorText);
      throw new Error(`Failed to delete record from ${collection}: ${errorText}`);
    }
  }

  async count(collection: string, filters?: Record<string, unknown>): Promise<number> {
    const records = await this.query(collection, filters);
    return records.length;
  }
}

export const db = new DatabaseClient();
