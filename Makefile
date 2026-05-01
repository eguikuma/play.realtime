COMPOSE := docker compose -f containers/compose.yml

.DEFAULT_GOAL := dev

.PHONY: dev down test verify help

dev: node_modules  ## ローカル環境を一括起動して frontend dev をフォアグラウンド実行
	@$(COMPOSE) up -d --build
	@echo ""
	@echo "  Frontend   http://localhost:3000"
	@echo "  Backend A  http://localhost:4001"
	@echo "  Backend B  http://localhost:4002"
	@echo "  Nginx      http://localhost:4000"
	@echo "  Redis      redis://localhost:6379"
	@echo ""
	@pnpm -F frontend dev

down:  ## docker compose を停止
	@$(COMPOSE) down

test:  ## テスト一括実行
	@pnpm run test

verify:  ## 型検査
	@pnpm run verify

help:  ## タスク一覧
	@grep -E '^[a-zA-Z][a-zA-Z0-9_-]*:.*## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "} {printf "  \033[36m%-8s\033[0m %s\n", $$1, $$2}'

node_modules: pnpm-lock.yaml
	@pnpm install
	@touch node_modules
