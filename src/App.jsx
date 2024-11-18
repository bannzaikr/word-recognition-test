import { Card } from './components/ui/card'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'

function App() {
  return (
    <div className="p-4">
      <Card className="p-6">
        <h1 className="text-2xl mb-4">テスト</h1>
        <Input className="mb-4" placeholder="テスト入力" />
        <Button>テストボタン</Button>
      </Card>
    </div>
  )
}

export default App
