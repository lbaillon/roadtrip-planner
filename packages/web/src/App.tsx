import LogIn from '#web/components/LogIn'
import SignUp from '#web/components/SignUp'
import { Route, Routes } from 'react-router-dom'
import MainLayout from './components/MainLayout'
import Home from './pages/Home'
import TrackDetails from './pages/TrackDetails'
import Tracks from './pages/Tracks'
import TripDetails from './pages/TripDetails'
import Trips from './pages/Trips'
import About from './pages/About'

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LogIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/tracks" element={<Tracks />} />
        <Route path="/tracks/:id" element={<TrackDetails />} />
        <Route path="/trips" element={<Trips />} />
        <Route path="/trips/:id" element={<TripDetails />} />
        <Route path='/about' element={<About/>} />
      </Route>
    </Routes>
  )
}
