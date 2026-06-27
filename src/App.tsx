import { Toolbar } from './components/Toolbar'
import { Scene } from './components/Scene'
import { FrameTreePanel } from './components/FrameTreePanel'
import { TransformPanel } from './components/TransformPanel'
import { LinkMatrixPanel } from './components/LinkMatrixPanel'
import './App.css'

export default function App() {
  return (
    <div className="app">
      <Toolbar />
      <div className="main">
        <div className="canvas-area">
          <Scene />
        </div>
        <aside className="sidebar">
          <FrameTreePanel />
          <TransformPanel />
          <LinkMatrixPanel />
        </aside>
      </div>
    </div>
  )
}
