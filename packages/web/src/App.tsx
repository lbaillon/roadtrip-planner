import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import { LogIn } from '#web/components/LogIn'
import { SignUp } from '#web/components/SignUp'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />}></Route>
      <Route path="/login" element={<LogIn />}></Route>
      <Route path="/signup" element={<SignUp />}></Route>
    </Routes>
  )
}

export default App
