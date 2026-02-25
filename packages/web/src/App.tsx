import LogIn from '#web/components/LogIn'
import SignUp from '#web/components/SignUp'
import { Route, Routes } from 'react-router-dom'
import MainLayout from './components/MainLayout'
import Home from './pages/Home'

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LogIn />} />
        <Route path="/signup" element={<SignUp />} />
      </Route>
    </Routes>
  )
}
