import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType,
  LoadingState,
  dateTime,
} from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';

import { MyDataSourceOptions, MyQuery } from './types';

type CoindeskCurrent = {
  time: { updatedISO: string };
  bpi: Record<string, { rate_float: number }>;
};

type CoindeskHistorical = {
  bpi: Record<string, number>; // "YYYY-MM-DD": price
};

export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {
  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
  }

  private getBaseUrl(): string {
    // DataSourceHttpSettings bunu doldurur
    return (this.instanceSettings.url ?? '').trim();
  }

  private getPath(): string {
    return (this.instanceSettings.jsonData?.path ?? '/v1/bpi/currentprice.json').trim();
  }

  async testDatasource() {
    const baseUrl = this.getBaseUrl();
    if (!baseUrl) {
      return { status: 'error', message: 'URL is empty. Set URL in datasource settings (e.g. https://api.coindesk.com)' };
    }

    try {
      // küçük bir ping: current endpoint
      await getBackendSrv().datasourceRequest({
        method: 'GET',
        url: `${baseUrl}${this.getPath()}`,
      });

      return { status: 'success', message: 'Success! API reachable.' };
    } catch (err: any) {
      return { status: 'error', message: `API not reachable: ${err?.message ?? 'unknown error'}` };
    }
  }

  async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
    const baseUrl = this.getBaseUrl();
    const path = this.getPath();

    const data = [];
    const notices: any[] = [];

    if (!baseUrl) {
      return {
        state: LoadingState.Error,
        data: [],
        error: { message: 'Datasource URL is empty. Please set it in datasource settings.' } as any,
      };
    }

    for (const target of options.targets) {
      if (target.hide) {
        continue;
      }

      const mode = target.mode ?? 'historical';
      const currency = target.currency ?? 'USD';
      const days = target.days ?? 14;

      try {
        if (mode === 'current') {
          const res = await getBackendSrv().datasourceRequest<CoindeskCurrent>({
            method: 'GET',
            url: `${baseUrl}${path}`,
          });

          const ts = dateTime(res.data.time.updatedISO).valueOf();
          const price = res.data.bpi?.[currency]?.rate_float;

          const frame = new MutableDataFrame({
            refId: target.refId,
            name: `BTC Current (${currency})`,
            fields: [
              { name: 'Time', type: FieldType.time },
              { name: 'Price', type: FieldType.number },
            ],
          });

          frame.add({ Time: ts, Price: price });
          data.push(frame);
        } else {
          // historical: /v1/bpi/historical/close.json?currency=USD&start=YYYY-MM-DD&end=YYYY-MM-DD
          const end = dateTime();
          const start = end.subtract(days, 'day');

          const startStr = start.format('YYYY-MM-DD');
          const endStr = end.format('YYYY-MM-DD');

          const url = `${baseUrl}/v1/bpi/historical/close.json?currency=${currency}&start=${startStr}&end=${endStr}`;

          const res = await getBackendSrv().datasourceRequest<CoindeskHistorical>({
            method: 'GET',
            url,
          });

          const frame = new MutableDataFrame({
            refId: target.refId,
            name: `BTC Historical (${currency})`,
            fields: [
              { name: 'Time', type: FieldType.time },
              { name: 'Price', type: FieldType.number },
            ],
          });

          const entries = Object.entries(res.data.bpi ?? {}).sort(([a], [b]) => a.localeCompare(b));
          for (const [day, price] of entries) {
            frame.add({ Time: dateTime(day).valueOf(), Price: price });
          }

          data.push(frame);
        }
      } catch (err: any) {
        // Bonus: error handling
        notices.push({
          severity: 'error',
          text: `Request failed (${target.refId}): ${err?.message ?? 'unknown error'}`,
        });
      }
    }

    // notices varsa bir “dummy” frame meta’sına koyup UI’da göstertebiliriz
    if (notices.length > 0) {
      const f = new MutableDataFrame({
        name: 'Errors',
        fields: [{ name: 'msg', type: FieldType.string }],
        meta: { notices },
      });
      f.add({ msg: 'See notices above' });
      data.push(f);
    }

    return { data };
  }
}
