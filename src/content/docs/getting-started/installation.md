---
title: Installation
description: Detailed installation instructions for all platforms.
order: 1
---

## Prerequisites

Before installing, make sure you have the following:

- **Node.js** 18 or later
- **npm**, **yarn**, or **bun** package manager
- A supported operating system (macOS, Linux, or Windows)

## Install via npm

```bash
npm install my-package
```

## Install via Bun

```bash
bun add my-package
```

## Install via Yarn

```bash
yarn add my-package
```

## Verify Installation

After installing, verify that everything is working:

```bash
npx my-package --version
```

You should see output like:

```
my-package v1.0.0
```

:::tip
If you encounter permission errors on macOS or Linux, try prefixing the command with `sudo` or configure npm to use a different directory for global packages.
:::

## System Requirements

| Platform | Minimum Version | Recommended |
|----------|----------------|-------------|
| Node.js  | 18.0           | 22.x        |
| macOS    | 12 (Monterey)  | 15 (Sequoia)|
| Windows  | 10             | 11          |
| Linux    | Ubuntu 20.04   | Ubuntu 24.04|

## Troubleshooting

### Common Issues

If the installation fails, try clearing your package manager cache:

```bash
npm cache clean --force
```

:::caution
Clearing the cache will remove all cached packages. Your next install may take longer as packages are re-downloaded.
:::

### Getting Help

If you're still having trouble, check our [GitHub Issues](https://github.com/example/my-package/issues) or reach out on Discord.
