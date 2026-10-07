import { useState } from 'react'
import { Toolbar } from './components/Toolbar'
import { TextEditorPair } from './components/TextEditorPair'
import { DiffEditorPanel } from './components/DiffEditorPanel'
import './styles/global.css'
import './styles/app.css'

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

function App() {
  const [mode, setMode] = useState<'edit' | 'diff'>('edit')
  const [language, setLanguage] = useState('javascript')
  const [left, setLeft] = useState(SAMPLE_LEFT)
  const [right, setRight] = useState(SAMPLE_RIGHT)

  const clear = () => {
    setLeft('')
    setRight('')
  }

  return (
    <div className="app">
      <Toolbar
        mode={mode}
        onModeChange={setMode}
        language={language}
        onLanguageChange={setLanguage}
        onClear={clear}
      />

      {mode === 'edit' ? (
        <TextEditorPair
          language={language}
          left={left}
          right={right}
          onLeftChange={setLeft}
          onRightChange={setRight}
        />
      ) : (
        <DiffEditorPanel
          language={language}
          original={left}
          modified={right}
        />
      )}
    </div>
  )
}

export default App