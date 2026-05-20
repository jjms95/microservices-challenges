import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { ZipkinExporter } from '@opentelemetry/exporter-zipkin';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const zipkinUrl = process.env.ZIPKIN_ENDPOINT || 'http://zipkin:9411/api/v2/spans';

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [SemanticResourceAttributes.SERVICE_NAME]: 'profiles-service',
  }),
  traceExporter: new ZipkinExporter({
    url: zipkinUrl,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
