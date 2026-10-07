import { useEffect } from 'react'
import type { Monaco } from '@monaco-editor/react'

function defineThemes(monaco: Monaco) {
  monaco.editor.defineTheme('dv-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6B7280', fontStyle: 'italic' },
      { token: 'keyword', foreground: '126BCF' },
      { token: 'string',  foreground: '0A7B3E' },
      { token: 'number',  foreground: 'B45309' },
      { token: 'type',    foreground: '7C3AED' },
    ],
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#16181D',
      'editorLineNumber.foreground': '#9CA3AF',
      'editorLineNumber.activeForeground': '#16181D',
      'editor.selectionBackground': '#EAF2FD',
      'editor.lineHighlightBackground': '#F4F6FA',
      'editorCursor.foreground': '#126BCF',
      'editorWidget.background': '#F4F6FA',
      'editorWidget.border': '#D8DCE3',
      'diffEditor.insertedTextBackground': '#0A7B3E20',
      'diffEditor.removedTextBackground':  '#DC262620',
      'diffEditor.insertedLineBackground': '#0A7B3E15',
      'diffEditor.removedLineBackground':  '#DC262615',
    },
  })

  monaco.editor.defineTheme('dv-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '8B949E', fontStyle: 'italic' },
      { token: 'keyword', foreground: '58A6FF' },
      { token: 'string',  foreground: '3FB950' },
      { token: 'number',  foreground: 'F0883E' },
      { token: 'type',    foreground: 'D2A8FF' },
    ],
    colors: {
      'editor.background': '#0D1117',
      'editor.foreground': '#E6EDF3',
      'editorLineNumber.foreground': '#484F58',
      'editorLineNumber.activeForeground': '#E6EDF3',
      'editor.selectionBackground': '#1C2D3F',
      'editor.lineHighlightBackground': '#161B22',
      'editorCursor.foreground': '#58A6FF',
      'editorWidget.background': '#161B22',
      'editorWidget.border': '#30363D',
      'diffEditor.insertedTextBackground': '#3FB95030',
      'diffEditor.removedTextBackground':  '#F8514930',
      'diffEditor.insertedLineBackground': '#3FB95018',
      'diffEditor.removedLineBackground':  '#F8514918',
    },
  })
}

export function useMonacoTheme(monaco: Monaco | null, dark: boolean) {
  useEffect(() => {
    if (!monaco) return
    defineThemes(monaco)
    monaco.editor.setTheme(dark ? 'dv-dark' : 'dv-light')
  }, [monaco, dark])
}