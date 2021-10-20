FROM daystram/go-builder:1.16 as builder
ARG VERSION=v0.0.0-development
WORKDIR /build
COPY fableous-be fableous-be
COPY proto proto
COPY Makefile .
RUN make be
WORKDIR /build/fableous-be
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-X 'main.version=${VERSION}'" -a -installsuffix nocgo -o app .

FROM alpine:latest
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /build/fableous-be/app ./
ENTRYPOINT ["/app"]
