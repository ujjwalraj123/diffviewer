import { useEffect } from 'react'
import type { Monaco } from '@monaco-editor/react'

export function useMonacoTheme(monaco: Monaco | null) {
  useEffect(() => {
    if (!monaco) return

    monaco.editor.defineTheme('csv-viewer-light', {
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
    monaco.editor.setTheme('csv-viewer-light')
  }, [monaco])
}