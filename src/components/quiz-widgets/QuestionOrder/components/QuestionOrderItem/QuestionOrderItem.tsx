import { useSortable } from '@dnd-kit/sortable'
import type { UniqueIdentifier } from '@dnd-kit/core'
import type { CSSProperties } from 'react'
import type { Option } from '../../../../../types/Option'
import './QuestionOrderItem.css'

interface QuestionOrderItemProps<T> {
  option: Option<T>
  optionId: UniqueIdentifier
  index: number

  ghost?: boolean
  grabbing?: boolean
}

export function QuestionOrderItem<T>({
  optionId,
  option,
  index,
  ghost,
  grabbing,
}: QuestionOrderItemProps<T>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: optionId
  })
  
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0px)` : undefined,
    position: isDragging ? 'relative' : undefined,
    zIndex: isDragging ? '1' : 'auto',
    cursor: grabbing ? 'grabbing' : 'grab',
    transition,
  } as CSSProperties

  return (
    <div 
      className={`question-order__item ${ghost && 'ghost'}`}
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
    >
      <div className="question-order__item-index">
        {index + 1}
      </div>
  
      <div className="question-order__item-label">
        {option.label}
      </div>
    </div>
  );
}

