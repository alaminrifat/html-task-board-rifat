# html-taskboard - Claude Context

## Quick Stack Reference

- **Backend**: nestjs
- **Frontend**: react
- **Database**: PostgreSQL
- **Deployment**: Docker

## Project Structure

```
html-taskboard/
├── backend/                    # nestjs API (port 3000)
├── frontend/                   # React Web (port 5173)
├── dashboard/                  # Admin Dashboard (port 5174)
├── .claude/                    # Framework-specific skills & agents
└── docker-compose.yml          # Service orchestration
```

## Core BASH Tools (MANDATORY)

**Pattern Search - USE 'rg' ONLY:**
```bash
rg -n "pattern" --glob '!node_modules/*'  # Search with line numbers
rg -l "pattern"                            # List matching files
rg -t py "pattern"                         # Search Python files only
```

**File Finding - USE 'fd' ONLY:**
```bash
fd filename                  # Find by name
fd -e py                     # Find Python files
fd -H .env                   # Include hidden files
```

**Bulk Operations - ONE command > many edits:**
```bash
rg -l "old" | xargs sed -i '' 's/old/new/g'
```

**Preview - USE 'bat':**
```bash
bat -n filepath              # With line numbers
bat -r 10:50 file            # Lines 10-50
```

**JSON - USE 'jq':**
```bash
jq '.dependencies | keys[]' package.json
```

## Essential Commands

| Category | Command | Purpose |
|----------|---------|---------|
| **Git** | /commit | Commit main project, create PR to dev |
| | /commit-all | Commit all including submodules |
| | /pull | Pull latest from dev |
| **Dev** | /new-project | Create new project with boilerplate |
| | /fix-ticket | Analyze and fix Notion ticket |
| | /fullstack | Run autonomous dev loops |
| **Design** | /prd-to-design-prompts | Convert PRD to Aura prompts |
| | /prompts-to-aura | Execute prompts on Aura.build |

## Active Agents

| Agent | Location | Trigger Condition |
|-------|----------|-------------------|
| backend-developer | .claude/nestjs/agents/ | Backend code changes |
| frontend-developer | .claude/react/agents/ | Frontend code changes |
| database-designer | .claude/agents/ | Schema design needed |
| design-qa-agent | .claude/react/agents/ | UI component work |

## Documentation Reference

| Document | Path | Purpose |
|----------|------|---------|
| Knowledge | .claude-project/docs/PROJECT_KNOWLEDGE.md | Full architecture & tech stack |
| API | .claude-project/docs/PROJECT_API.md | Endpoint specifications |
| Database | .claude-project/docs/PROJECT_DATABASE.md | Schema & ERD |
| Integration | .claude-project/docs/PROJECT_API_INTEGRATION.md | Frontend-API mapping |
| Design System | .claude-project/docs/PROJECT_DESIGN_GUIDELINES.md | Component styling |
| PRD | .claude-project/prd/prd.pdf | Original requirements |
| HTML Screens | .claude-project/resources/HTML/ | Prototype screens |

## Framework Resources

| Framework | Path | Description |
|-----------|------|-------------|
| nestjs | .claude/nestjs/guides/ | 20+ development guides |
| React | .claude/react/guides/ | 22 React guides |

---

**Last Updated:** 2026-02-16
