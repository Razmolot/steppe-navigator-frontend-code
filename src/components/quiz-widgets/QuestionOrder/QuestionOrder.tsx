import { closestCorners, DndContext, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent, type UniqueIdentifier } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useEffect, useState } from 'react'
import { QuestionOrderItem } from './components/QuestionOrderItem/QuestionOrderItem'
import type { Option } from '../../../types/Option'
import './QuestionOrder.css'

interface QuestionOrderProps<T> {
  options: Option<T>[]
  onChange?: (orderedOptions: Option<T>[]) => void
}

export function QuestionOrder<T>({
  options,
  onChange = () => {},
}: QuestionOrderProps<T>) {
  const [orderedOptions, setOrderedOptions] = useState<Option<T>[]>(options)
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor)
  )

  useEffect(() => setOrderedOptions(options), [options])

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)

    if (event.active.id === event.over?.id) return

    setOrderedOptions((prev) => {
      const oldIndex = prev.findIndex((option) => getOptionId(option) === event.active.id)
      const newIndex = prev.findIndex((option) => getOptionId(option) === event.over?.id)

      const newOrder = arrayMove(prev, oldIndex, newIndex)
      onChange(newOrder)
      
      return newOrder
    })
  }

  function getOptionId(option: Option<T>) {
    return String(option.value)
  }

  function getActiveOptionIndex() {
    return orderedOptions.findIndex(option => getOptionId(option) === activeId)
  }

  return (
    <div className="question-order">
      <DndContext
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        sensors={sensors}
      >
        <SortableContext
          items={orderedOptions.map(getOptionId)}
          strategy={verticalListSortingStrategy}
        >
          {orderedOptions.map((option, index) => (
            <QuestionOrderItem
              option={option}
              optionId={getOptionId(option)}
              index={index}
              ghost={Boolean(activeId) && getActiveOptionIndex() === index}
              key={getOptionId(option)}
            />
          ))}
        </SortableContext>

        <DragOverlay adjustScale={false}>
          {activeId ? (
            <QuestionOrderItem
              key={activeId}
              option={orderedOptions[getActiveOptionIndex()]}
              index={getActiveOptionIndex()}
              optionId={activeId}
              grabbing
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

