'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { X, RotateCcw } from 'lucide-react'
import type { CardConfig } from '@/types/dashboard'

interface DraggableGridProps {
  items: CardConfig[]
  onReorder: (ids: string[]) => void
  onHide: (id: string) => void
  onReset: () => void
}

function SortableCard({
  item,
  onHide,
}: {
  item: CardConfig
  onHide: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        {item.component}
      </div>
      <button
        aria-label="Ocultar card"
        onClick={() => onHide(item.id)}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted"
      >
        <X className="h-3 w-3 text-muted-foreground" />
      </button>
    </div>
  )
}

export function DraggableGrid({ items, onReorder, onHide, onReset }: DraggableGridProps) {
  const [localItems, setLocalItems] = useState(items)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = localItems.findIndex((i) => i.id === active.id)
    const newIndex = localItems.findIndex((i) => i.id === over.id)
    const reordered = arrayMove(localItems, oldIndex, newIndex)
    setLocalItems(reordered)
    onReorder(reordered.map((i) => i.id))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={onReset}
          className="text-xs gap-1 flex items-center px-2 py-1 rounded-md hover:bg-muted"
        >
          <RotateCcw className="h-3 w-3" />
          Restaurar padrão
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={localItems.map((i) => i.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {localItems.map((item) => (
              <SortableCard key={item.id} item={item} onHide={onHide} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
