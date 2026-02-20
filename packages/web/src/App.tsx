import { Routes, Route } from 'react-router-dom'
import Home from './Home/Home'
import { LogIn } from './components/LogIn'
import { SignUp } from './components/SignUp'

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
