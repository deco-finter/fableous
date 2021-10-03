.PHONY: all build_proto clean

all: install_dependencies build_proto

install_dependencies:
	@echo "Installing dependencies..."
	@sudo apt install -y protobuf-compiler
	@go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.27
	@yarn --cwd proto

build_proto:
	@echo "Building protobufs..."
	@protoc \
		--go_out=. \
		--go_opt=paths=source_relative \
		--plugin=protoc-gen-ts=proto/node_modules/.bin/protoc-gen-ts \
		--js_out=import_style=commonjs,binary:. \
		--ts_out=. \
		proto/*.proto

clean:
	rm -f proto/*.go
	rm -f proto/*_pb.d.ts
	rm -f proto/*_pb.js
