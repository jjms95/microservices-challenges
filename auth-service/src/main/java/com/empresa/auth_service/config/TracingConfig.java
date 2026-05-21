package com.empresa.auth_service.config;

import io.opentelemetry.exporter.zipkin.ZipkinSpanExporter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TracingConfig {

    @Value("${management.zipkin.tracing.endpoint:http://zipkin:9411/api/v2/spans}")
    private String zipkinEndpoint;

    @Bean
    public ZipkinSpanExporter zipkinSpanExporter() {
        return ZipkinSpanExporter.builder()
                .setEndpoint(zipkinEndpoint)
                .build();
    }

    @Bean
    public io.opentelemetry.sdk.OpenTelemetrySdk openTelemetry(ZipkinSpanExporter zipkinSpanExporter, @org.springframework.beans.factory.annotation.Value("${spring.application.name:auth-service}") String appName) {
        io.opentelemetry.sdk.resources.Resource resource = io.opentelemetry.sdk.resources.Resource.getDefault().merge(io.opentelemetry.sdk.resources.Resource.create(io.opentelemetry.api.common.Attributes.of(io.opentelemetry.api.common.AttributeKey.stringKey("service.name"), appName)));
        
        io.opentelemetry.sdk.trace.SdkTracerProvider sdkTracerProvider = io.opentelemetry.sdk.trace.SdkTracerProvider.builder()
                .setResource(resource)
                .setSampler(io.opentelemetry.sdk.trace.samplers.Sampler.alwaysOn())
                .addSpanProcessor(io.opentelemetry.sdk.trace.export.BatchSpanProcessor.builder(zipkinSpanExporter).build())
                .build();

        return io.opentelemetry.sdk.OpenTelemetrySdk.builder()
                .setTracerProvider(sdkTracerProvider)
                .setPropagators(io.opentelemetry.context.propagation.ContextPropagators.create(io.opentelemetry.api.trace.propagation.W3CTraceContextPropagator.getInstance()))
                .build();
    }
    @Bean
    public io.opentelemetry.api.trace.Tracer otelTracer(io.opentelemetry.sdk.OpenTelemetrySdk openTelemetry, @org.springframework.beans.factory.annotation.Value("${spring.application.name:auth-service}") String appName) {
        return openTelemetry.getTracer(appName);
    }

    @Bean
    public io.micrometer.tracing.Tracer micrometerTracer(io.opentelemetry.api.trace.Tracer otelTracer) {
        io.micrometer.tracing.otel.bridge.OtelCurrentTraceContext otelCurrentTraceContext = new io.micrometer.tracing.otel.bridge.OtelCurrentTraceContext();
        io.micrometer.tracing.otel.bridge.OtelBaggageManager otelBaggageManager = new io.micrometer.tracing.otel.bridge.OtelBaggageManager(otelCurrentTraceContext, java.util.Collections.emptyList(), java.util.Collections.emptyList());
        return new io.micrometer.tracing.otel.bridge.OtelTracer(otelTracer, otelCurrentTraceContext, event -> {}, otelBaggageManager);
    }
    @Bean
    public io.micrometer.tracing.handler.DefaultTracingObservationHandler defaultTracingObservationHandler(io.micrometer.tracing.Tracer tracer) {
        return new io.micrometer.tracing.handler.DefaultTracingObservationHandler(tracer);
    }

    @Bean
    public io.micrometer.tracing.handler.PropagatingSenderTracingObservationHandler propagatingSenderTracingObservationHandler(io.micrometer.tracing.Tracer tracer, io.micrometer.tracing.propagation.Propagator propagator) {
        return new io.micrometer.tracing.handler.PropagatingSenderTracingObservationHandler(tracer, propagator);
    }

    @Bean
    public io.micrometer.tracing.handler.PropagatingReceiverTracingObservationHandler propagatingReceiverTracingObservationHandler(io.micrometer.tracing.Tracer tracer, io.micrometer.tracing.propagation.Propagator propagator) {
        return new io.micrometer.tracing.handler.PropagatingReceiverTracingObservationHandler(tracer, propagator);
    }

    @Bean
    public io.micrometer.tracing.propagation.Propagator propagator(io.opentelemetry.api.trace.Tracer otelTracer) {
        return new io.micrometer.tracing.otel.bridge.OtelPropagator(io.opentelemetry.context.propagation.ContextPropagators.create(io.opentelemetry.api.trace.propagation.W3CTraceContextPropagator.getInstance()), otelTracer);
    }
}
