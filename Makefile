.PHONY: all build_proto clean

all: build_proto

build_proto:
	@echo "Building protobufs..."
	@protoc --go_out=. proto/*.proto --go_opt=paths=source_relative

clean:
	rm -f proto/*.go
