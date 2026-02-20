import React, { useEffect, useState } from 'react'
import { assets } from '../../assets/assets'
import { useNavigate } from 'react-router-dom'

const SearchBar = ({data}) => {

  const navigate = useNavigate();
  const [input, setInput] = useState(data ? data : '')

  useEffect(() => {
    setInput(data ? data : '')
  }, [data])

  const onSearchHandler = (e) => {
    e.preventDefault()
    const searchTerm = input.trim();

    if (!searchTerm) {
      navigate('/course-list');
      return;
    }

    navigate('/course-list/' + encodeURIComponent(searchTerm));
  }

  return (
    <form data-animate="card" onSubmit={onSearchHandler} className='glass-surface max-w-xl w-full md:h-14 h-12 flex items-center'>
      <img src={assets.search_icon} alt="search_icon" className='md:w-auto w-10 px-3' />
      <input onChange={e => setInput(e.target.value)} value={input} type="text" placeholder='Search for courses' className='w-full h-full outline-none bg-transparent text-slate-700/90' />
      <button data-animate="button" type='submit' className='modern-btn rounded-full text-white md:px-10 px-7 md:py-3 py-2 mx-1'>Search</button>
    </form>
  )
}

export default SearchBar
