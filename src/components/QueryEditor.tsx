import React from 'react';
import { InlineField, InlineFieldRow, Input, Select } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';

import { DataSource } from '../datasource';
import { MyDataSourceOptions, MyQuery, defaultQuery } from '../types';

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

const modeOptions = [
  { label: 'Historical (time series)', value: 'historical' as const },
  { label: 'Current (table)', value: 'current' as const },
];

const currencyOptions = [
  { label: 'USD', value: 'USD' as const },
  { label: 'EUR', value: 'EUR' as const },
  { label: 'GBP', value: 'GBP' as const },
];

export function QueryEditor({ query, onChange, onRunQuery }: Props) {
  const q = { ...defaultQuery, ...query };

  return (
    <div>
      <div style={{ opacity: 0.8, marginBottom: 8 }}>Developed by Yaren Dalkiran (MIS 233)</div>

      <InlineFieldRow>
        <InlineField label="Mode" labelWidth={10}>
          <Select
            options={modeOptions}
            value={modeOptions.find(o => o.value === q.mode)}
            onChange={(v) => {
              onChange({ ...q, mode: v?.value });
              onRunQuery();
            }}
            width={26}
          />
        </InlineField>

        <InlineField label="Currency" labelWidth={10}>
          <Select
            options={currencyOptions}
            value={currencyOptions.find(o => o.value === q.currency)}
            onChange={(v) => {
              onChange({ ...q, currency: v?.value });
              onRunQuery();
            }}
            width={18}
          />
        </InlineField>

        {q.mode === 'historical' && (
          <InlineField label="Days" labelWidth={6}>
            <Input
              width={10}
              type="number"
              min={1}
              max={90}
              value={q.days ?? 14}
              onChange={(e) => {
                onChange({ ...q, days: Number(e.currentTarget.value) });
                onRunQuery();
              }}
            />
          </InlineField>
        )}
      </InlineFieldRow>
    </div>
  );
}
