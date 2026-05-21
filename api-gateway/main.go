package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/zipkin"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.24.0"
)

type HealthCheck struct {
	Status  string            `json:"status"`
	Service string            `json:"service"`
	Checks  map[string]string `json:"checks"`
}

func initTracer() *sdktrace.TracerProvider {
	zipkinURL := os.Getenv("OTEL_EXPORTER_ZIPKIN_ENDPOINT")
	if zipkinURL == "" {
		zipkinURL = "http://zipkin:9411/api/v2/spans" // Default for local docker-compose
	}
	exporter, err := zipkin.New(zipkinURL)
	if err != nil {
		slog.Error("Failed to create Zipkin exporter", "error", err)
		return nil
	}
	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(resource.NewWithAttributes(
			semconv.SchemaURL,
			semconv.ServiceName("api-gateway"),
		)),
	)
	otel.SetTracerProvider(tp)
	otel.SetTextMapPropagator(propagation.TraceContext{})
	return tp
}

func proxy(target string) http.Handler {
	url, _ := url.Parse(target)
	proxy := httputil.NewSingleHostReverseProxy(url)
	return otelhttp.NewHandler(proxy, "proxy-"+url.Host)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	health := HealthCheck{
		Status:  "UP",
		Service: "api-gateway",
		Checks:  map[string]string{},
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(health)
}

func main() {
	// Configure slog to output JSON to stdout
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	tp := initTracer()
	if tp != nil {
		defer func() {
			if err := tp.Shutdown(context.Background()); err != nil {
				slog.Error("Error shutting down tracer provider", "error", err)
			}
		}()
	}

	mux := http.NewServeMux()

	// Routes
	mux.Handle("/empleados/", http.StripPrefix("/empleados", proxy("http://employees-service:8080")))
	mux.Handle("/departamentos/", http.StripPrefix("/departamentos", proxy("http://departments-service:8081")))
	mux.Handle("/perfiles/", http.StripPrefix("/perfiles", proxy("http://profiles-service:8083")))
	mux.Handle("/notificaciones/", http.StripPrefix("/notificaciones", proxy("http://notifications-service:8084")))
	mux.Handle("/auth/", http.StripPrefix("/auth", proxy("http://auth-service:8085")))

	// Observability
	mux.HandleFunc("/health", healthHandler)
	mux.Handle("/metrics", promhttp.Handler())

	// Metrics
	inFlightGauge := prometheus.NewGauge(prometheus.GaugeOpts{
		Name: "http_requests_in_flight",
		Help: "A gauge of requests currently being served.",
	})
	counter := prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "A counter for requests to the wrapped handler.",
		},
		[]string{"code", "method"},
	)
	duration := prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "A histogram of latencies for requests.",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"code", "method"},
	)
	prometheus.MustRegister(inFlightGauge, counter, duration)

	// Wrap root with OTel and Prometheus
	handler := otelhttp.NewHandler(mux, "api-gateway")
	handler = promhttp.InstrumentHandlerInFlight(inFlightGauge,
		promhttp.InstrumentHandlerDuration(duration,
			promhttp.InstrumentHandlerCounter(counter, handler),
		),
	)

	port := ":8000"
	slog.Info("API Gateway listening", "port", port, "service", "api-gateway")
	if err := http.ListenAndServe(port, handler); err != nil {
		slog.Error("Server failed", "error", err)
		os.Exit(1)
	}
}
