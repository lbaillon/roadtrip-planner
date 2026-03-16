import type { DragEndEvent } from '@dnd-kit/core'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  faGripVertical,
  faMotorcycle,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './TracksList.module.css'

type Track = { id: string; name: string }

function TrackItem({
  track,
  onDelete,
}: {
  track: Track
  onDelete: (id: string) => void
}) {
  return (
    <>
      <FontAwesomeIcon icon={faMotorcycle} className={styles.itemIcon} />
      <Link to={`/tracks/${track.id}`} className={styles.trackName}>
        {track.name}
      </Link>
      <FontAwesomeIcon
        icon={faXmark}
        className={styles.deleteIcon}
        onClick={(e) => {
          e.stopPropagation()
          onDelete(track.id)
        }}
      />
    </>
  )
}

function SortableItem({
  track,
  onDelete,
}: {
  track: Track
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: track.id })

  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <p className={styles.track} ref={setNodeRef} style={style}>
      <FontAwesomeIcon
        icon={faGripVertical}
        className={styles.dragHandle}
        {...attributes}
        {...listeners}
      />
      <TrackItem track={track} onDelete={onDelete} />
    </p>
  )
}

export default function TracksList({
  tracks,
  onDelete,
  onReorder,
}: {
  tracks: Track[]
  onDelete: (id: string) => void
  onReorder?: (trackIds: string[]) => void
}) {
  const [items, setItems] = useState(tracks)
  const sensors = useSensors(useSensor(PointerSensor))

  useEffect(() => {
    // Allow to synchronize state with server response
    setItems(tracks)
  }, [tracks])

  if (!onReorder) {
    return tracks.map((track) => (
      <p className={styles.track} key={track.id}>
        <TrackItem track={track} onDelete={onDelete} />
      </p>
    ))
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((t) => t.id === active.id)
    const newIndex = items.findIndex((t) => t.id === over.id)
    const reordered = arrayMove(items, oldIndex, newIndex)
    setItems(reordered)
    onReorder?.(reordered.map((t) => t.id))
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext
        items={items.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        {items.map((track) => (
          <SortableItem key={track.id} track={track} onDelete={onDelete} />
        ))}
      </SortableContext>
    </DndContext>
  )
}
