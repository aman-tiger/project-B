# Template Import Testing Plan

## Problem
All 11 templates are Next.js projects, many with leftover v0 dependencies (expo, react-native, @nuxt/kit, vue-router) that fail in WebContainer. Templates should import and show a live preview without any AI intervention.

## Analysis of Dependencies

| Template | Next.js | Problematic Deps |
|--|--|--|
| 3d-product-explode | 16.0.10 | None |
| 3d-model-generator | 16.1.6 | expo, react-native |
| 3d-vector-visualization | 16.1.6 | expo, react-native |
| ai-landing-page | 15.5.12 | expo, react-native, @splinetool/* |
| interface | 15.5.12 | @nuxt/kit |
| luxury-portfolio | 16.1.6 | None |
| modern-agency-liquid-glass | 15.5.12 | vue-router |
| ibra-automate | 14.0.0 | expo, react-native |
| portifolio-main | 14.2.35 | expo, react-native, @splinetool/* |
| saa-s-landing-page | 15.5.12 | None |
| web-navigation | 15.5.12 | vue-router |

## Tasks

- [ ] Task 1: Create `cleanPackageJsonForWebContainer` utility to strip problematic deps
- [ ] Task 2: Integrate cleanup into GitUrlImport flow (before file messages)
- [ ] Task 3: Test template 1 (3d-product-explode) - cleanest template
- [ ] Task 4: Test template 2 (luxury-portfolio) - clean template
- [ ] Task 5: Test template 3 (saa-s-landing-page) - clean template  
- [ ] Task 6: Test template 4 (ai-landing-page) - with expo cleanup
- [ ] Task 7: Test remaining templates
- [ ] Task 8: Verify all previews show content
- [ ] Task 9: Commit and push
