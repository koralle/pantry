---
description: Asks Claude Code for coding assistance.
mode: subagent
model: zai-coding-plan/glm-5
tools:
  bash: true
  read: true
  glob: true
  grep: true
---

# Ask Claude Code

Executes the local Claude Code (`claude`) to get coding assistance.

## Quickstart

```bash
claude -p "Your question or task here" \
  --append-system-prompt "あなたは優秀なシニアエンジニアです。OpenCodeからの質問や相談に乗ってあげてください。" \
  --alloedTools "Bash,Read,Edit"
```
