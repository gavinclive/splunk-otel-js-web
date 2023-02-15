/*
Copyright 2020 Splunk Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { TracerProvider, Tracer } from '@opentelemetry/api';
import { hrTime } from '@opentelemetry/core';
import { onCLS, onLCP, onFID, MetricWithAttribution } from 'web-vitals/attribution';
const reported = {};

function report(tracer: Tracer, name: string, metric: MetricWithAttribution): void {
  if (reported[name]) {
    return;
  }
  reported[name] = true;

  const value = metric.value;
  const attribution = metric.attribution;
  const now = hrTime();

  const span = tracer.startSpan('webvitals', { startTime: now });
  span.setAttribute(name, value);

  if (attribution.element) {
    span.setAttribute(`${name}.element`, attribution.element as string);
  }
  if (attribution.url) {
    span.setAttribute(`${name}.url`, attribution.url as string);
  }
  if (attribution.largestShiftTarget) {
    span.setAttribute(`${name}.target`, attribution.largestShiftTarget as string);
  }

  span.end(now);
}

export function initWebVitals(provider: TracerProvider): void {
  const tracer = provider.getTracer('webvitals');
  // CLS is defined as being sent more than once, easier to just ensure that everything is sent just on the first occurence.
  onFID((metric) => {
    report(tracer, 'fid', metric);
  });
  onCLS((metric) => {
    report(tracer, 'cls', metric);
  });
  onLCP((metric) => {
    report(tracer, 'lcp', metric);
  });
}
