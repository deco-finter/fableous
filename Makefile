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
		proto/*.proto
	@mkdir -p fableous-fe/src/proto
	@cd proto && npx pbjs -t static-module -w commonjs -o ../fableous-fe/src/proto/message_pb.js *.proto
	@cd proto && npx pbts -o ../fableous-fe/src/proto/message_pb.d.ts ../fableous-fe/src/proto/message_pb.js

clean:
	rm -f proto/*.go
	rm -f fableous-fe/src/proto/proto/*_pb.d.ts
	rm -f fableous-fe/src/proto/proto/*_pb.js
