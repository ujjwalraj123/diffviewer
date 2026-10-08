# Diff Viewer

A fast, modern, privacy-focused **online code and text diff viewer** built with **React, TypeScript, Vite, and Monaco Editor**.

Compare two pieces of code or text side by side, quickly identify changes, and review differences directly in your browser.

## ✨ Features

* 🔍 **Side-by-side diff comparison**
* 📝 **Monaco Editor** for a powerful code-editing experience
* ⚡ **Fast and lightweight** React + Vite frontend
* 🎨 **Syntax highlighting** for code comparison
* 📱 **Responsive interface** for different screen sizes
* 🔒 **Privacy-focused** — comparison can be performed directly in the browser
* 📋 Easy copy and paste workflow
* 🚀 Fast production builds
* 🌐 Designed for use as an online developer tool

## 🎯 Use Cases

Diff Viewer can be used to compare:

* Source code
* Configuration files
* JSON
* JavaScript / TypeScript
* HTML
* CSS
* Markdown
* SQL
* XML
* Plain text
* API responses
* Configuration changes
* Code revisions

Whether you're debugging a change, reviewing a configuration file, comparing API responses, or checking two versions of source code, Diff Viewer provides a simple way to see exactly what changed.

## 🛠️ Tech Stack

* **React** — UI framework
* **TypeScript** — Type-safe development
* **Vite** — Development server and production bundler
* **Monaco Editor** — Code editing and diff visualization
* **ESLint** — Code quality and linting
* **Vercel** — Production deployment

## 🚀 Getting Started

### Prerequisites

Make sure you have Node.js and npm installed.

### Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/ujjwalraj123/diffviewer.git
cd diffviewer
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

Vite will start the application locally. Open the URL displayed in your terminal to use the Diff Viewer.

## 📦 Production Build

Create an optimized production build:

```bash
npm run build
```

The production files are generated inside:

```text
dist/
```

The build process performs TypeScript checking and creates the optimized Vite production bundle.

### Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

## 🧪 Code Quality

Run ESLint with:

```bash
npm run lint
```

For production applications, TypeScript-aware ESLint rules can be enabled to provide stronger type checking and code-quality validation.

## 🔒 Privacy

Diff Viewer is designed with privacy in mind.

Code and text entered into the comparison interface can be processed directly in the browser rather than requiring the content to be uploaded to a server.

**Do not enter sensitive information into any online tool unless you have verified how that particular deployment handles your data.**

## 🌐 Deployment

The project is designed to work well with **Vercel** and other static hosting platforms.

For Vercel, the typical configuration is:

```text
Framework: Vite
Build Command: npm run build
Output Directory: dist
```

Vercel can automatically detect the Vite configuration when the project is connected to a repository.


## 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

Before submitting changes:

1. Create a branch for your changes.
2. Make your changes.
3. Run the linter.
4. Run the production build.
5. Test the application locally.
6. Submit a pull request.

## Built With

**React · TypeScript · Vite · Monaco Editor**

Built as a fast and privacy-focused developer tool for comparing code and text.
