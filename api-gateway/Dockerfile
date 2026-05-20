FROM golang:1.22-alpine AS builder

WORKDIR /app

COPY go.mod ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o api-gateway main.go

FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/api-gateway .

EXPOSE 8000

CMD ["./api-gateway"]
