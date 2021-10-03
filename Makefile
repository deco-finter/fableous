.PHONY: all be fe clean

all: be fe
be: be_install_dependencies be_build_proto
fe: fe_install_dependencies fe_build_proto
clean: be_clean fe_clean

be_install_dependencies:
	@echo "Installing dependencies for fableous-be proto building..."
	@sudo apt install -y protobuf-compiler
	@go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.27

be_build_proto:
	@echo "Building protos for fableous-be..."
	@mkdir -p fableous-be/protos
	@cd proto && protoc \
		--go_out=../fableous-be/protos \
		--go_opt=paths=source_relative \
		--go_opt=Mmessage.proto=github.com/deco-finter/fableous/fableous-be/protos \
		message.proto

fe_install_dependencies:
	@echo "Installing dependencies for fableous-fe proto building..."
	@yarn --cwd proto

fe_build_proto:
	@echo "Building protos for fableous-fe..."
	@mkdir -p fableous-fe/src/proto
	@cd proto && npx pbjs -t static-module -w commonjs -o ../fableous-fe/src/proto/message_pb.js message.proto
	@cd proto && npx pbts -o ../fableous-fe/src/proto/message_pb.d.ts ../fableous-fe/src/proto/message_pb.js

be_clean:
	rm -rf fableous-be/protos

fe_clean:
	rm -rf fableous-fe/src/proto
