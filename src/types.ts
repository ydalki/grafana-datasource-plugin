import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface MyQuery extends DataQuery {
  mode?: 'current' | 'historical';
  currency?: 'USD' | 'EUR' | 'GBP';
  days?: number; // historical için kaç gün
}

export const defaultQuery: Partial<MyQuery> = {
  mode: 'historical',
  currency: 'USD',
  days: 14,
};

export interface MyDataSourceOptions extends DataSourceJsonData {
  path?: string; // current price endpoint path
}

export interface MySecureJsonData {
  apiKey?: string;
}
