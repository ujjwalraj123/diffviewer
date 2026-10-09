import { useState } from 'react'
import { Toolbar } from '../components/Toolbar'
import { TextEditorPair } from '../components/TextEditorPair'
import { DiffEditorPanel } from '../components/DiffEditorPanel'
import { useSeo } from '../hooks/useSeo'
import { useTheme } from '../hooks/useTheme'
import { SITE } from '../config/site'

const SAMPLE_LEFT = `function greet(name) {
  return "Hello, " + name;
}

greet("world");
`

const SAMPLE_RIGHT = `function greet(name, greeting = "Hello") {
  return \`\${greeting}, \${name}!\`;
}

greet("world");
greet("there", "Hi");
`

export default function ToolPage() {
  const [mode, setMode] = useState<'edit' | 'diff'>('edit')
  const [language, setLanguage] = useState('javascript')
  const [left, setLeft] = useState(SAMPLE_LEFT)
  const [right, setRight] = useState(SAMPLE_RIGHT)
  const { dark, toggle } = useTheme()

  useSeo({ title: SITE.defaultTitle, description: SITE.defaultDescription, path: '/' })

  return (
    <div className="app">
      <Toolbar
        mode={mode}
        onModeChange={setMode}
        language={language}
        onLanguageChange={setLanguage}
        onClear={() => { setLeft(''); setRight('') }}
        dark={dark}
        onToggleDark={toggle}
      />
      {mode === 'edit' ? (
        <TextEditorPair
          language={language} left={left} right={right}
          onLeftChange={setLeft} onRightChange={setRight} dark={dark}
        />
      ) : (
        <DiffEditorPanel
          language={language} original={left} modified={right} dark={dark}
          onOriginalChange={setLeft} onModifiedChange={setRight}
        />
      )}
    </div>
  )
}