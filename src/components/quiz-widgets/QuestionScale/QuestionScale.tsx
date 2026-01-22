import { useEffect, useState } from 'react'
import type { Option } from '../../../types/Option'
import './QuestionScale.css'

interface QuestionScaleProps<T> {
  options: Option<T>[]
  onChange?: (selectedOptionIndex: number) => void
  selectedIndex?: number
}

export function QuestionScale<T>({
  options,
  onChange = () => {},
  selectedIndex,
}: QuestionScaleProps<T>) {
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(selectedIndex ?? -1)

  // sync with external selected index
  useEffect(() => {
    if (selectedIndex !== undefined) {
      setSelectedOptionIndex(selectedIndex)
    }
  }, [selectedIndex])

  // handle state changes
  useEffect(() => {
    if (selectedOptionIndex >= 0) {
      onChange(selectedOptionIndex)
    }
  }, [selectedOptionIndex])

  function getIsOptionCheckedByIndex(index: number) {
    return selectedOptionIndex === index
  }

  return (
    <div className="question-scale">
      {options.map((option, index) => (
        <div 
          className='question-scale__item' 
          onClick={() => setSelectedOptionIndex(index)}
          key={index}
        >
          <div className="question-scale__item-header">
            {option.label}
          </div>
          
          <div className="question-scale__item-body">
            <div className={`question-scale__control ${getIsOptionCheckedByIndex(index) && 'active'}`} />
          </div>
        </div>
      ))}
    </div>
  )
}

