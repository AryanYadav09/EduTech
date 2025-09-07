import React, { useRef, useState, useEffect } from 'react'
import uniqid from 'uniqid'
import Quill from 'quill'
import { assets } from '../../assets/assets'
import "quill/dist/quill.snow.css";

const AddCourse = () => {
  const quillRef = useRef(null);
  const editorRef = useRef(null);

  const [courseTitle, setCourseTitle] = useState('')
  const [coursePrice, setCoursePrice] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [image, setImage] = useState(null)
  const [chapters, setChapters] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [currentChapterId, setCurrentChapterId] = useState(null);

  const [lectureDetails, setLectureDetails] = useState({
    lectureTitle: '',
    lectureDuration: '',
    lectureUrl: '',
    isPreviewFree: false,
  });

  useEffect(() => {
    // Initialize Quill once
    if (!quillRef.current && editorRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        placeholder: 'Write course description...'
      });
    }
  }, [])

  // Add / remove / toggle chapter (immutable updates)
  const handleChapter = (action, chapterId) => {
    if (action === 'add') {
      const title = prompt('Enter Chapter Name:')
      if (!title) return
      const newChapter = {
        chapterId: uniqid(),
        chapterTitle: title,
        chapterContent: [],
        collapsed: false,
        chapterOrder: chapters.length > 0 ? chapters[chapters.length - 1].chapterOrder + 1 : 1,
      }
      setChapters(prev => [...prev, newChapter])
    } else if (action === 'remove') {
      setChapters(prev => prev.filter(c => c.chapterId !== chapterId))
    } else if (action === 'toggle') {
      setChapters(prev => prev.map(c => c.chapterId === chapterId ? { ...c, collapsed: !c.collapsed } : c))
    }
  }

  // Open lecture popup / remove lecture (immutable updates)
  const handleLecture = (action, chapterId, lectureIndex) => {
    if (action === 'add') {
      setCurrentChapterId(chapterId)
      setShowPopup(true)
    } else if (action === 'remove') {
      setChapters(prev => prev.map(ch => {
        if (ch.chapterId !== chapterId) return ch
        return { ...ch, chapterContent: ch.chapterContent.filter((_, idx) => idx !== lectureIndex) }
      }))
    }
  }

  // Add lecture into chapter (immutable)
  const addLecture = () => {
    if (!lectureDetails.lectureTitle.trim()) {
      alert('Please add lecture title')
      return
    }

    setChapters(prev => prev.map(ch => {
      if (ch.chapterId !== currentChapterId) return ch

      const newLecture = {
        lectureId: uniqid(),
        lectureTitle: lectureDetails.lectureTitle,
        lectureDuration: Number(lectureDetails.lectureDuration) || 0,
        lectureUrl: lectureDetails.lectureUrl,
        isPreviewFree: !!lectureDetails.isPreviewFree,
        lectureOrder: ch.chapterContent.length > 0 ? ch.chapterContent[ch.chapterContent.length - 1].lectureOrder + 1 : 1
      }

      return { ...ch, chapterContent: [...ch.chapterContent, newLecture] }
    }))

    // reset lecture form + close popup
    setLectureDetails({
      lectureTitle: '',
      lectureDuration: '',
      lectureUrl: '',
      isPreviewFree: false,
    })
    setShowPopup(false)
    setCurrentChapterId(null)
  }

  // Submit handler: collects Quill HTML and all data
  const handleSubmit = async (e) => {
    e.preventDefault()
    const courseDescriptionHtml = quillRef.current ? quillRef.current.root.innerHTML : ''
    const payload = {
      courseTitle,
      coursePrice: Number(coursePrice) || 0,
      discount: Number(discount) || 0,
      thumbnailFile: image,
      courseDescriptionHtml,
      chapters
    }
    // For now just log — replace with API call
    console.log('Course payload:', payload)
    alert('Course payload logged to console. Replace with actual API call.')
  }

  return (
    <div className='h-screen overflow-auto flex flex-col items-start justify-start md:p-8 p-4 pt-8'>
      <form onSubmit={handleSubmit} className='flex flex-col gap-4 max-w-3xl w-full text-gray-700'>
        {/* Title */}
        <div className='flex flex-col gap-1'>
          <label className='text-sm font-medium'>Course Title</label>
          <input
            onChange={e => setCourseTitle(e.target.value)}
            value={courseTitle}
            type="text"
            placeholder='Type here'
            className='outline-none md:py-2.5 py-2 px-3 rounded border border-gray-300'
            required
          />
        </div>

        {/* Description (Quill) */}
        <div className='flex flex-col gap-1'>
          <label className='text-sm font-medium'>Course Description</label>
          <div ref={editorRef} className="h-40 border border-gray-300 rounded" />
        </div>

        {/* Price / Thumbnail */}
        <div className='flex items-center justify-between flex-wrap gap-4'>
          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium'>Course Price</label>
            <input
              onChange={e => setCoursePrice(e.target.value)}
              value={coursePrice}
              type="number"
              placeholder='0'
              className='outline-none md:py-2.5 py-2 w-36 px-3 rounded border border-gray-300'
              required
            />
          </div>

          <div className='flex md:flex-row flex-col items-center gap-3'>
            <label className='text-sm font-medium'>Course Thumbnail</label>
            <label htmlFor='thumbnailImage' className='flex items-center gap-3 cursor-pointer'>
              <img src={assets.file_upload_icon} alt="upload" className='p-3 bg-blue-500 rounded' />
              <input type="file" id='thumbnailImage' onChange={e => setImage(e.target.files[0])} accept="image/*" hidden />
              <img className='max-h-10' src={image ? URL.createObjectURL(image) : ''} alt="" />
            </label>
          </div>
        </div>

        {/* Discount */}
        <div className='flex flex-col gap-1'>
          <label className='text-sm font-medium'>Discount %</label>
          <input
            onChange={e => setDiscount(e.target.value)}
            value={discount}
            type="number"
            placeholder='0'
            min={0}
            max={100}
            className='outline-none md:py-2.5 py-2 w-36 px-3 rounded border border-gray-300'
          />
        </div>

        {/* Chapters & Lectures */}
        <div>
          {chapters.map((chapter, chapterIndex) => (
            <div key={chapter.chapterId} className="bg-white border rounded-lg mb-4">
              <div className="flex justify-between items-center p-4 border-b">
                <div className="flex items-center">
                  <img
                    src={assets.dropdown_icon}
                    width={14}
                    alt=""
                    className={`mr-2 cursor-pointer transition-transform ${chapter.collapsed ? '-rotate-90' : 'rotate-0'}`}
                    onClick={() => handleChapter('toggle', chapter.chapterId)}
                  />
                  <span className="font-semibold">{chapterIndex + 1}. {chapter.chapterTitle}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className='text-gray-500'>{chapter.chapterContent.length} Lectures</span>
                  <img src={assets.cross_icon} alt="remove chapter" className='cursor-pointer w-4 h-4' onClick={() => handleChapter('remove', chapter.chapterId)} />
                </div>
              </div>

              {!chapter.collapsed && (
                <div className="p-4">
                  {chapter.chapterContent.map((lecture, lectureIndex) => (
                    <div key={lecture.lectureId} className="flex justify-between items-center mb-2">
                      <span>{lectureIndex + 1}. {lecture.lectureTitle} - {lecture.lectureDuration} mins - <a href={lecture.lectureUrl} target="_blank" rel="noreferrer" className="text-blue-500">Link</a> - {lecture.isPreviewFree ? 'Free Preview' : 'Paid'}</span>
                      <img onClick={() => handleLecture('remove', chapter.chapterId, lectureIndex)} src={assets.cross_icon} className='cursor-pointer w-4 h-4' alt="remove lecture" />
                    </div>
                  ))}

                  <div className='inline-flex bg-gray-100 p-2 rounded cursor-pointer mt-2' onClick={() => handleLecture('add', chapter.chapterId)}>
                    + Add Lecture
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className='flex justify-center items-center bg-blue-50 p-2 rounded-lg cursor-pointer' onClick={() => handleChapter('add')}>
            + Add Chapter
          </div>
        </div>

        {/* Lecture Popup */}
        {showPopup && (
          <div className='fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-60 z-50'>
            <div className="bg-white text-gray-700 p-4 rounded relative w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">Add Lecture</h2>

              <div className="mb-2">
                <label className="text-sm">Lecture Title</label>
                <input
                  type="text"
                  className="mt-1 block w-full border rounded py-1 px-2"
                  value={lectureDetails.lectureTitle}
                  onChange={(e) => setLectureDetails(prev => ({ ...prev, lectureTitle: e.target.value }))}
                />
              </div>

              <div className="mb-2">
                <label className="text-sm">Duration (minutes)</label>
                <input
                  type="number"
                  className="mt-1 block w-full border rounded py-1 px-2"
                  value={lectureDetails.lectureDuration}
                  onChange={(e) => setLectureDetails(prev => ({ ...prev, lectureDuration: e.target.value }))}
                />
              </div>

              <div className="mb-2">
                <label className="text-sm">Lecture URL</label>
                <input
                  type="text"
                  className="mt-1 block w-full border rounded py-1 px-2"
                  value={lectureDetails.lectureUrl}
                  onChange={(e) => setLectureDetails(prev => ({ ...prev, lectureUrl: e.target.value }))}
                />
              </div>

              <div className="flex gap-2 my-4 items-center">
                <label className="text-sm">Is Preview Free?</label>
                <input
                  type="checkbox"
                  className='mt-1 scale-125'
                  checked={lectureDetails.isPreviewFree}
                  onChange={(e) => setLectureDetails(prev => ({ ...prev, isPreviewFree: e.target.checked }))}
                />
              </div>

              <button type='button' className="w-full bg-blue-500 text-white px-4 py-2 rounded mb-2" onClick={addLecture}>Add Lecture</button>

              <button type='button' className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded" onClick={() => { setShowPopup(false); setCurrentChapterId(null) }}>Cancel</button>

              <img onClick={() => { setShowPopup(false); setCurrentChapterId(null) }} src={assets.cross_icon} className='absolute top-4 right-4 w-4 cursor-pointer' alt="close" />
            </div>
          </div>
        )}

        <div className='pt-4'>
          <button type="submit" className="bg-black text-white w-max py-2.5 px-8 rounded">ADD COURSE</button>
        </div>
      </form>
    </div>
  )
}

export default AddCourse
