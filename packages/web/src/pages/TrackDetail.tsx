import { useParams } from 'react-router-dom'

export default function TrackDetail() {
  const { id } = useParams()


  return (
    <>
      <p>Coucou {id}</p>
    </>
  )
}
