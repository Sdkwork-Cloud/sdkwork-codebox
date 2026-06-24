# SDKWork Codebox Technical Architecture

Status: active
Owner: SDKWork maintainers
Updated: 2026-06-24
Specs: ARCHITECTURE_DECISION_SPEC.md, DOCUMENTATION_SPEC.md

## Document Map

- [TECH-1-add-2.md](TECH-1-add-2.md)
- [TECH-1-add-3.md](TECH-1-add-3.md)
- [TECH-1-add.md](TECH-1-add.md)
- [TECH-1-config-files-2.md](TECH-1-config-files-2.md)
- [TECH-1-config-files-3.md](TECH-1-config-files-3.md)
- [TECH-1-config-files.md](TECH-1-config-files.md)
- [TECH-1-introduction-2.md](TECH-1-introduction-2.md)
- [TECH-1-introduction-3.md](TECH-1-introduction-3.md)
- [TECH-1-introduction.md](TECH-1-introduction.md)
- [TECH-1-mcp-2.md](TECH-1-mcp-2.md)
- [TECH-1-mcp-3.md](TECH-1-mcp-3.md)
- [TECH-1-mcp.md](TECH-1-mcp.md)
- [TECH-1-service-2.md](TECH-1-service-2.md)
- [TECH-1-service-3.md](TECH-1-service-3.md)
- [TECH-1-service.md](TECH-1-service.md)
- [TECH-2-installation-2.md](TECH-2-installation-2.md)
- [TECH-2-installation-3.md](TECH-2-installation-3.md)
- [TECH-2-installation.md](TECH-2-installation.md)
- [TECH-2-prompts-2.md](TECH-2-prompts-2.md)
- [TECH-2-prompts-3.md](TECH-2-prompts-3.md)
- [TECH-2-prompts.md](TECH-2-prompts.md)
- [TECH-2-questions-2.md](TECH-2-questions-2.md)
- [TECH-2-questions-3.md](TECH-2-questions-3.md)
- [TECH-2-questions.md](TECH-2-questions.md)
- [TECH-2-switch-2.md](TECH-2-switch-2.md)
- [TECH-2-switch-3.md](TECH-2-switch-3.md)
- [TECH-2-switch.md](TECH-2-switch.md)
- [TECH-2-takeover-2.md](TECH-2-takeover-2.md)
- [TECH-2-takeover-3.md](TECH-2-takeover-3.md)
- [TECH-2-takeover.md](TECH-2-takeover.md)
- [TECH-2026-03-14-codebox-config-dir-strategy.md](TECH-2026-03-14-codebox-config-dir-strategy.md)
- [TECH-2026-03-14-control-console-redesign-design.md](TECH-2026-03-14-control-console-redesign-design.md)
- [TECH-2026-03-14-control-console-redesign.md](TECH-2026-03-14-control-console-redesign.md)
- [TECH-2026-03-15-debug-console-mode.md](TECH-2026-03-15-debug-console-mode.md)
- [TECH-3-deeplink-2.md](TECH-3-deeplink-2.md)
- [TECH-3-deeplink-3.md](TECH-3-deeplink-3.md)
- [TECH-3-deeplink.md](TECH-3-deeplink.md)
- [TECH-3-edit-2.md](TECH-3-edit-2.md)
- [TECH-3-edit-3.md](TECH-3-edit-3.md)
- [TECH-3-edit.md](TECH-3-edit.md)
- [TECH-3-failover-2.md](TECH-3-failover-2.md)
- [TECH-3-failover-3.md](TECH-3-failover-3.md)
- [TECH-3-failover.md](TECH-3-failover.md)
- [TECH-3-interface-2.md](TECH-3-interface-2.md)
- [TECH-3-interface-3.md](TECH-3-interface-3.md)
- [TECH-3-interface.md](TECH-3-interface.md)
- [TECH-3-skills-2.md](TECH-3-skills-2.md)
- [TECH-3-skills-3.md](TECH-3-skills-3.md)
- [TECH-3-skills.md](TECH-3-skills.md)
- [TECH-4-env-conflict-2.md](TECH-4-env-conflict-2.md)
- [TECH-4-env-conflict-3.md](TECH-4-env-conflict-3.md)
- [TECH-4-env-conflict.md](TECH-4-env-conflict.md)
- [TECH-4-quickstart-2.md](TECH-4-quickstart-2.md)
- [TECH-4-quickstart-3.md](TECH-4-quickstart-3.md)
- [TECH-4-quickstart.md](TECH-4-quickstart.md)
- [TECH-4-sort-duplicate-2.md](TECH-4-sort-duplicate-2.md)
- [TECH-4-sort-duplicate-3.md](TECH-4-sort-duplicate-3.md)
- [TECH-4-sort-duplicate.md](TECH-4-sort-duplicate.md)
- [TECH-4-usage-2.md](TECH-4-usage-2.md)
- [TECH-4-usage-3.md](TECH-4-usage-3.md)
- [TECH-4-usage.md](TECH-4-usage.md)
- [TECH-5-model-test-2.md](TECH-5-model-test-2.md)
- [TECH-5-model-test-3.md](TECH-5-model-test-3.md)
- [TECH-5-model-test.md](TECH-5-model-test.md)
- [TECH-5-settings-2.md](TECH-5-settings-2.md)
- [TECH-5-settings-3.md](TECH-5-settings-3.md)
- [TECH-5-settings.md](TECH-5-settings.md)
- [TECH-5-usage-query-2.md](TECH-5-usage-query-2.md)
- [TECH-5-usage-query-3.md](TECH-5-usage-query-3.md)
- [TECH-5-usage-query.md](TECH-5-usage-query.md)
- [TECH-proxy-guide-zh.md](TECH-proxy-guide-zh.md)
- [TECH-releasing.md](TECH-releasing.md)
- [TECH-v3-10-0-en.md](TECH-v3-10-0-en.md)
- [TECH-v3-10-0-ja.md](TECH-v3-10-0-ja.md)
- [TECH-v3-10-0-zh.md](TECH-v3-10-0-zh.md)
- [TECH-v3-11-0-en.md](TECH-v3-11-0-en.md)
- [TECH-v3-11-0-ja.md](TECH-v3-11-0-ja.md)
- [TECH-v3-11-0-zh.md](TECH-v3-11-0-zh.md)
- [TECH-v3-11-1-en.md](TECH-v3-11-1-en.md)
- [TECH-v3-11-1-ja.md](TECH-v3-11-1-ja.md)
- [TECH-v3-11-1-zh.md](TECH-v3-11-1-zh.md)
- [TECH-v3-12-0-en.md](TECH-v3-12-0-en.md)
- [TECH-v3-12-0-ja.md](TECH-v3-12-0-ja.md)
- [TECH-v3-12-0-zh.md](TECH-v3-12-0-zh.md)
- [TECH-v3-12-1-en.md](TECH-v3-12-1-en.md)
- [TECH-v3-12-1-ja.md](TECH-v3-12-1-ja.md)
- [TECH-v3-12-1-zh.md](TECH-v3-12-1-zh.md)
- [TECH-v3-6-0-en.md](TECH-v3-6-0-en.md)
- [TECH-v3-6-0-zh.md](TECH-v3-6-0-zh.md)
- [TECH-v3-6-1-en.md](TECH-v3-6-1-en.md)
- [TECH-v3-6-1-zh.md](TECH-v3-6-1-zh.md)
- [TECH-v3-7-0-en.md](TECH-v3-7-0-en.md)
- [TECH-v3-7-0-zh.md](TECH-v3-7-0-zh.md)
- [TECH-v3-7-1-en.md](TECH-v3-7-1-en.md)
- [TECH-v3-7-1-zh.md](TECH-v3-7-1-zh.md)
- [TECH-v3-8-0-en.md](TECH-v3-8-0-en.md)
- [TECH-v3-8-0-ja.md](TECH-v3-8-0-ja.md)
- [TECH-v3-8-0-zh.md](TECH-v3-8-0-zh.md)
- [TECH-v3-9-0-en.md](TECH-v3-9-0-en.md)
- [TECH-v3-9-0-ja.md](TECH-v3-9-0-ja.md)
- [TECH-v3-9-0-zh.md](TECH-v3-9-0-zh.md)

## 1. Architecture Overview

Architecture detail lives in the linked TECH shards below.


## 2. Technology Choices

## 3. System Boundaries And Modules

## 4. Directory And Package Layout

## 5. API, SDK, And Data Ownership

## 6. Security, Privacy, And Observability

## 7. Deployment And Runtime Topology

## 8. Architecture Decision Index

## 9. Verification
