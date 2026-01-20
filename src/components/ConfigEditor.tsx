import React, { ChangeEvent } from 'react';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { DataSourceHttpSettings, InlineField, Input } from '@grafana/ui';

import { MyDataSourceOptions, MySecureJsonData } from '../types';

type Props = DataSourcePluginOptionsEditorProps<MyDataSourceOptions, MySecureJsonData>;

export function ConfigEditor({ options, onOptionsChange }: Props) {
  const jsonData = options.jsonData;

  const onPathChange = (e: ChangeEvent<HTMLInputElement>) => {
    const path = e.target.value;
    onOptionsChange({
      ...options,
      jsonData: {
        ...jsonData,
        path,
      },
    });
  };

  return (
    <>
      {/* URL/Access ayarları burada çıkacak */}
      <DataSourceHttpSettings
        defaultUrl="https://api.coindesk.com"
        dataSourceConfig={options}
        onChange={onOptionsChange}
      />

      <InlineField label="Path" labelWidth={12} tooltip="Example: /v1/bpi/currentprice.json">
        <Input
          width={40}
          value={jsonData.path ?? '/v1/bpi/currentprice.json'}
          onChange={onPathChange}
          placeholder="/v1/bpi/currentprice.json"
        />
      </InlineField>
    </>
  );
}
