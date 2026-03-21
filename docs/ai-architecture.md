# AI Agent Architectural Guidelines

This document provides the architectural context and coding standards for AI agents assisting in the maintenance and development of this repository.

## 🏗️ Repository Structure
- **Root**: Backend logic (`main.py`) and project documentation.
- **doc-parser-ui/**: Next.js frontend application.
- **docs/**: Project-level architectural and maintenance guidelines.

## 📝 Coding Standards
- **AI-Maintainability**: Code should be modular and well-documented to assist in rapid feature iteration by both human and AI developers.
- **Modern Next.js**: The frontend uses the latest Next.js conventions (App Router). AI agents must verify current documentation before proposing API changes.
- **Security**: Sensitive keys must always be loaded via environment variables (`.env`).

## 🤖 Agent Context
AI Agents should prioritize readability and maintainable patterns to ensure the project remains robust during automated updates.
