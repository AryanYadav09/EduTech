import React, { useRef, useState, useEffect, useContext } from 'react'
import uniqid from 'uniqid'
import Quill from 'quill'
import { assets } from '../../assets/assets'
import "quill/dist/quill.snow.css";
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const initialLectureState = {
  lectureTitle: '',
  lectureDuration: '',
  lectureUrl: '',
  lectureVideoFile: null,
};

const AddCourse = () => {
  const { backendUrl, getToken } = useContext(AppContext)
  const quillRef = useRef(null);
  const editorRef = useRef(null);

  const [courseTitle, setCourseTitle] = useState('')
  const [courseSubtitle, setCourseSubtitle] = useState('')
  const [courseAbout, setCourseAbout] = useState('')
  const [courseLanguage, setCourseLanguage] = useState('English')
  const [courseLevel, setCourseLevel] = useState('All Levels')
  const [coursePrice, setCoursePrice] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [trailerUrl, setTrailerUrl] = useState('')
  const [trailerVideo, setTrailerVideo] = useState(null)
  const [image, setImage] = useState(null)
  const [chapters, setChapters] = useState([]);
  const [newChapterTitle, setNewChapterTitle] = useState('');

  const [courseIncludes, setCourseIncludes] = useState([]);
  const [courseOutcomes, setCourseOutcomes] = useState([]);
  const [courseRequirements, setCourseRequirements] = useState([]);
  const [includeInput, setIncludeInput] = useState('');
  const [outcomeInput, setOutcomeInput] = useState('');
  const [requirementInput, setRequirementInput] = useState('');

  const [showPopup, setShowPopup] = useState(false);
  const [currentChapterId, setCurrentChapterId] = useState(null);
  const [lectureDetails, setLectureDetails] = useState(initialLectureState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!quillRef.current && editorRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        placeholder: 'Write full course description...'
      });
    }
  }, [])

  const addListItem = (value, setValue, list, setList) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return;
    if (list.includes(trimmedValue)) {
      toast.info('This item is already added');
      return;
    }
    setList((prev) => [...prev, trimmedValue]);
    setValue('');
  };

  const removeListItem = (listSetter, index) => {
    listSetter((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const addChapter = () => {
    const title = newChapterTitle.trim();
    if (!title) {
      toast.error('Please enter chapter title');
      return;
    }

    const newChapter = {
      chapterId: uniqid(),
      chapterTitle: title,
      chapterContent: [],
      collapsed: false,
      chapterOrder: chapters.length > 0 ? chapters[chapters.length - 1].chapterOrder + 1 : 1,
    };

    setChapters((prev) => [...prev, newChapter]);
    setNewChapterTitle('');
  };

  const handleChapter = (action, chapterId) => {
    if (action === 'remove') {
      setChapters((prev) => prev.filter((chapter) => chapter.chapterId !== chapterId));
    } else if (action === 'toggle') {
      setChapters((prev) => prev.map((chapter) => (
        chapter.chapterId === chapterId ? { ...chapter, collapsed: !chapter.collapsed } : chapter
      )));
    }
  }

  const handleLecture = (action, chapterId, lectureIndex) => {
    if (action === 'add') {
      setCurrentChapterId(chapterId)
      setShowPopup(true)
      return;
    }

    if (action === 'remove') {
      setChapters((prev) => prev.map((chapter) => {
        if (chapter.chapterId !== chapterId) return chapter;
        return {
          ...chapter,
          chapterContent: chapter.chapterContent.filter((_, idx) => idx !== lectureIndex),
        };
      }));
    }
  }

  const closeLecturePopup = () => {
    setShowPopup(false);
    setCurrentChapterId(null);
    setLectureDetails(initialLectureState);
  };

  const addLecture = () => {
    if (!lectureDetails.lectureTitle.trim()) {
      toast.error('Please add lecture title');
      return;
    }

    if (!Number(lectureDetails.lectureDuration)) {
      toast.error('Please add lecture duration in minutes');
      return;
    }

    if (!lectureDetails.lectureUrl.trim() && !lectureDetails.lectureVideoFile) {
      toast.error('Add lecture link or upload lecture video');
      return;
    }

    setChapters((prev) => prev.map((chapter) => {
      if (chapter.chapterId !== currentChapterId) return chapter;

      const lectureId = uniqid();
      const lectureUploadKey = lectureDetails.lectureVideoFile ? `lectureVideo__${lectureId}` : '';

      const newLecture = {
        lectureId,
        lectureTitle: lectureDetails.lectureTitle.trim(),
        lectureDuration: Number(lectureDetails.lectureDuration),
        lectureUrl: lectureDetails.lectureUrl.trim(),
        lectureUploadKey,
        lectureVideoFile: lectureDetails.lectureVideoFile,
        isPreviewFree: false,
        lectureOrder: chapter.chapterContent.length > 0
          ? chapter.chapterContent[chapter.chapterContent.length - 1].lectureOrder + 1
          : 1
      };

      return { ...chapter, chapterContent: [...chapter.chapterContent, newLecture] };
    }))

    closeLecturePopup();
  }

  const resetForm = () => {
    setCourseTitle('');
    setCourseSubtitle('');
    setCourseAbout('');
    setCourseLanguage('English');
    setCourseLevel('All Levels');
    setCoursePrice(0);
    setDiscount(0);
    setTrailerUrl('');
    setTrailerVideo(null);
    setImage(null);
    setChapters([]);
    setNewChapterTitle('');
    setCourseIncludes([]);
    setCourseOutcomes([]);
    setCourseRequirements([]);
    setIncludeInput('');
    setOutcomeInput('');
    setRequirementInput('');
    if (quillRef.current) quillRef.current.root.innerHTML = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      if (!image) return toast.error('Thumbnail not selected');
      if (!courseAbout.trim()) return toast.error('Course about section is required');
      if (courseIncludes.length === 0) return toast.error('Add at least one course include item');
      if (chapters.length === 0) return toast.error('Add at least one chapter');

      const hasInvalidChapter = chapters.some((chapter) => {
        if (!chapter.chapterTitle.trim() || chapter.chapterContent.length === 0) return true;
        return chapter.chapterContent.some((lecture) => (
          !lecture.lectureTitle.trim()
          || (!lecture.lectureUrl.trim() && !lecture.lectureUploadKey)
          || Number(lecture.lectureDuration) <= 0
        ));
      });

      if (hasInvalidChapter) {
        return toast.error('Each chapter must have valid lectures');
      }

      setIsSubmitting(true);

      const courseData = {
        courseTitle: courseTitle.trim(),
        courseSubtitle: courseSubtitle.trim(),
        courseDescription: quillRef.current?.root?.innerHTML || '',
        courseAbout: courseAbout.trim(),
        courseIncludes,
        courseOutcomes,
        courseRequirements,
        trailerUrl: trailerUrl.trim(),
        courseLevel,
        courseLanguage,
        coursePrice: Number(coursePrice),
        discount: Number(discount) || 0,
        courseContent: chapters.map((chapter) => ({
          chapterId: chapter.chapterId,
          chapterTitle: chapter.chapterTitle.trim(),
          chapterOrder: chapter.chapterOrder,
          chapterContent: chapter.chapterContent.map((lecture) => ({
            lectureId: lecture.lectureId,
            lectureTitle: lecture.lectureTitle.trim(),
            lectureDuration: Number(lecture.lectureDuration),
            lectureUrl: lecture.lectureUrl.trim(),
            lectureUploadKey: lecture.lectureUploadKey || '',
            isPreviewFree: false,
            lectureOrder: lecture.lectureOrder,
          })),
        })),
      }

      const formData = new FormData()
      formData.append('courseData', JSON.stringify(courseData))
      formData.append('image', image)
      if (trailerVideo) {
        formData.append('trailerVideo', trailerVideo);
      }

      chapters.forEach((chapter) => {
        chapter.chapterContent.forEach((lecture) => {
          if (lecture.lectureUploadKey && lecture.lectureVideoFile) {
            formData.append(lecture.lectureUploadKey, lecture.lectureVideoFile);
          }
        });
      });

      const token = await getToken()
      const { data } = await axios.post(backendUrl + '/api/educator/add-course', formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (data.success) {
        toast.success(data.message)
        resetForm();
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    } finally {
      setIsSubmitting(false);
    }
  }

  const renderTagEditor = (label, inputValue, setInputValue, list, setList, placeholder) => (
    <div className='flex flex-col gap-2'>
      <label className='text-sm font-medium'>{label}</label>
      <div className='flex gap-2'>
        <input
          type='text'
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addListItem(inputValue, setInputValue, list, setList);
            }
          }}
          placeholder={placeholder}
          className='outline-none md:py-2.5 py-2 px-3 rounded border border-gray-300 flex-1'
        />
        <button
          type='button'
          onClick={() => addListItem(inputValue, setInputValue, list, setList)}
          className='modern-btn px-4 rounded text-white'
        >
          Add
        </button>
      </div>

      {list.length > 0 && (
        <div className='flex flex-wrap gap-2'>
          {list.map((item, index) => (
            <span key={`${item}-${index}`} className='inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs'>
              {item}
              <button
                type='button'
                onClick={() => removeListItem(setList, index)}
                className='text-blue-700'
              >
                x
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className='h-screen overflow-auto flex flex-col items-start justify-start md:p-8 p-4 pt-8'>
      <form data-animate="card" onSubmit={handleSubmit} className='modern-card flex flex-col gap-6 max-w-4xl w-full text-gray-700 pb-8 p-6 md:p-8 bg-white/80'>
        <h1 data-animate="heading" className='text-2xl font-semibold text-gray-900'>Upload New Course</h1>

        <div className='grid md:grid-cols-2 gap-4'>
          <div className='flex flex-col gap-1 md:col-span-2'>
            <label className='text-sm font-medium'>Course Title</label>
            <input
              onChange={(e) => setCourseTitle(e.target.value)}
              value={courseTitle}
              type="text"
              placeholder='Type course title'
              className='outline-none md:py-2.5 py-2 px-3 rounded border border-gray-300'
              required
            />
          </div>

          <div className='flex flex-col gap-1 md:col-span-2'>
            <label className='text-sm font-medium'>Course Subtitle</label>
            <input
              onChange={(e) => setCourseSubtitle(e.target.value)}
              value={courseSubtitle}
              type="text"
              placeholder='One-line summary of this course'
              className='outline-none md:py-2.5 py-2 px-3 rounded border border-gray-300'
            />
          </div>

          <div className='flex flex-col gap-1 md:col-span-2'>
            <label className='text-sm font-medium'>Course Description</label>
            <div ref={editorRef} className="h-40 border border-gray-300 rounded" />
          </div>

          <div className='flex flex-col gap-1 md:col-span-2'>
            <label className='text-sm font-medium'>About This Course</label>
            <textarea
              value={courseAbout}
              onChange={(e) => setCourseAbout(e.target.value)}
              rows={4}
              placeholder='Explain who this course is for and what value it provides.'
              className='outline-none py-2 px-3 rounded border border-gray-300 resize-y'
              required
            />
          </div>
        </div>

        <div className='grid sm:grid-cols-2 md:grid-cols-4 gap-4'>
          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium'>Course Price</label>
            <input
              onChange={(e) => setCoursePrice(e.target.value)}
              value={coursePrice}
              type="number"
              min={0}
              placeholder='0'
              className='outline-none md:py-2.5 py-2 px-3 rounded border border-gray-300'
              required
            />
          </div>

          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium'>Discount %</label>
            <input
              onChange={(e) => setDiscount(e.target.value)}
              value={discount}
              type="number"
              min={0}
              max={100}
              placeholder='0'
              className='outline-none md:py-2.5 py-2 px-3 rounded border border-gray-300'
            />
          </div>

          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium'>Level</label>
            <select
              value={courseLevel}
              onChange={(e) => setCourseLevel(e.target.value)}
              className='outline-none md:py-2.5 py-2 px-3 rounded border border-gray-300 bg-white'
            >
              <option>All Levels</option>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>

          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium'>Language</label>
            <input
              value={courseLanguage}
              onChange={(e) => setCourseLanguage(e.target.value)}
              type='text'
              placeholder='English'
              className='outline-none md:py-2.5 py-2 px-3 rounded border border-gray-300'
            />
          </div>
        </div>

        <div className='grid md:grid-cols-2 gap-4'>
          <div className='flex md:flex-row flex-col md:items-center gap-3'>
            <label className='text-sm font-medium min-w-36'>Course Thumbnail</label>
            <label htmlFor='thumbnailImage' className='inline-flex items-center gap-3 cursor-pointer w-fit'>
              <img src={assets.file_upload_icon} alt="upload" className='p-3 bg-blue-500 rounded' />
              <input type="file" id='thumbnailImage' onChange={(e) => setImage(e.target.files[0])} accept="image/*" hidden />
              {image ? <img className='max-h-16 rounded border' src={URL.createObjectURL(image)} alt="preview" /> : <span className='text-sm text-gray-500'>Choose image</span>}
            </label>
          </div>

          <div className='flex flex-col gap-2'>
            <label className='text-sm font-medium'>Course Trailer (Optional)</label>
            <input
              value={trailerUrl}
              onChange={(e) => setTrailerUrl(e.target.value)}
              type='text'
              placeholder='Paste trailer link (YouTube or public video URL)'
              className='outline-none md:py-2.5 py-2 px-3 rounded border border-gray-300'
            />
            <label htmlFor='trailerVideo' className='inline-flex items-center gap-3 cursor-pointer w-fit text-sm text-blue-600'>
              <img src={assets.file_upload_icon} alt="upload trailer" className='p-2 bg-blue-500 rounded w-9 h-9' />
              <input
                type='file'
                id='trailerVideo'
                onChange={(e) => setTrailerVideo(e.target.files?.[0] || null)}
                accept='video/*'
                hidden
              />
              {trailerVideo ? `Trailer file: ${trailerVideo.name}` : 'Or upload trailer video'}
            </label>
          </div>
        </div>

        <div className='grid md:grid-cols-3 gap-4'>
          {renderTagEditor(
            'What is included in this course? *',
            includeInput,
            setIncludeInput,
            courseIncludes,
            setCourseIncludes,
            'Lifetime access, Certificate, etc.'
          )}

          {renderTagEditor(
            'What students will learn',
            outcomeInput,
            setOutcomeInput,
            courseOutcomes,
            setCourseOutcomes,
            'Build real projects, deploy apps, etc.'
          )}

          {renderTagEditor(
            'Requirements',
            requirementInput,
            setRequirementInput,
            courseRequirements,
            setCourseRequirements,
            'Basic JavaScript knowledge, laptop, etc.'
          )}
        </div>

        <div className='border border-gray-300 rounded-lg p-4 bg-white/85'>
          <h2 data-animate="heading" className='text-lg font-semibold text-gray-900'>Course Chapters</h2>
          <p className='text-sm text-gray-500 pt-1'>Add chapters and lectures directly here (no popup prompts).</p>

          <div className='flex flex-col sm:flex-row gap-2 pt-4'>
            <input
              type='text'
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              placeholder='Enter chapter title'
              className='outline-none md:py-2.5 py-2 px-3 rounded border border-gray-300 flex-1'
            />
            <button
              type='button'
              onClick={addChapter}
              className='modern-btn px-4 py-2 rounded text-white'
            >
              + Add Chapter
            </button>
          </div>

          <div className='pt-4'>
            {chapters.length === 0 && (
              <div className='text-sm text-gray-500 border border-dashed border-gray-300 rounded p-4'>
                No chapters added yet.
              </div>
            )}

            {chapters.map((chapter, chapterIndex) => (
              <div key={chapter.chapterId} className="border rounded-lg mb-4">
                <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-lg">
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
                    <span className='text-gray-500 text-sm'>{chapter.chapterContent.length} Lectures</span>
                    <img
                      src={assets.cross_icon}
                      alt="remove chapter"
                      className='cursor-pointer w-4 h-4'
                      onClick={() => handleChapter('remove', chapter.chapterId)}
                    />
                  </div>
                </div>

                {!chapter.collapsed && (
                  <div className="p-4">
                    {chapter.chapterContent.map((lecture, lectureIndex) => (
                      <div key={lecture.lectureId} className="flex justify-between items-center mb-2 text-sm border-b pb-2">
                        <span className='pr-3'>
                          {lectureIndex + 1}. {lecture.lectureTitle} | {lecture.lectureDuration} mins | Enrolled Only
                        </span>
                        <div className='flex items-center gap-3 shrink-0'>
                          {lecture.lectureUploadKey
                            ? <span className="text-emerald-600">Uploaded video</span>
                            : <span className="text-blue-500">Video link</span>
                          }
                          <img
                            onClick={() => handleLecture('remove', chapter.chapterId, lectureIndex)}
                            src={assets.cross_icon}
                            className='cursor-pointer w-4 h-4'
                            alt="remove lecture"
                          />
                        </div>
                      </div>
                    ))}

                    <button
                      type='button'
                      className='outline-btn inline-flex p-2 rounded cursor-pointer mt-2 text-sm'
                      onClick={() => handleLecture('add', chapter.chapterId)}
                    >
                      + Add Lecture
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {showPopup && (
          <div className='fixed inset-0 flex items-center justify-center bg-gray-800/60 z-50'>
            <div className="bg-white text-gray-700 p-4 rounded relative w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">Add Lecture</h2>

              <div className="mb-3">
                <label className="text-sm">Lecture Title</label>
                <input
                  type="text"
                  className="mt-1 block w-full border rounded py-2 px-3"
                  value={lectureDetails.lectureTitle}
                  onChange={(e) => setLectureDetails((prev) => ({ ...prev, lectureTitle: e.target.value }))}
                />
              </div>

              <div className="mb-3">
                <label className="text-sm">Duration (minutes)</label>
                <input
                  type="number"
                  className="mt-1 block w-full border rounded py-2 px-3"
                  value={lectureDetails.lectureDuration}
                  onChange={(e) => setLectureDetails((prev) => ({ ...prev, lectureDuration: e.target.value }))}
                />
              </div>

              <div className="mb-3">
                <label className="text-sm">Lecture Link (Optional)</label>
                <input
                  type="text"
                  className="mt-1 block w-full border rounded py-2 px-3"
                  value={lectureDetails.lectureUrl}
                  onChange={(e) => setLectureDetails((prev) => ({ ...prev, lectureUrl: e.target.value }))}
                  placeholder='YouTube or public video link'
                />
              </div>

              <div className="mb-4">
                <label className="text-sm">Upload Lecture Video (Optional)</label>
                <input
                  type="file"
                  className='mt-1 block w-full border rounded py-2 px-3'
                  accept='video/*'
                  onChange={(e) => setLectureDetails((prev) => ({ ...prev, lectureVideoFile: e.target.files?.[0] || null }))}
                />
                {lectureDetails.lectureVideoFile && (
                  <p className='text-xs text-emerald-600 mt-1'>{lectureDetails.lectureVideoFile.name}</p>
                )}
                <p className='text-xs text-slate-500 mt-1'>Add either link or uploaded video.</p>
              </div>

              <button type='button' className="modern-btn w-full text-white px-4 py-2 rounded mb-2" onClick={addLecture}>
                Add Lecture
              </button>

              <button type='button' className="w-full outline-btn text-gray-700 px-4 py-2 rounded" onClick={closeLecturePopup}>
                Cancel
              </button>

              <img onClick={closeLecturePopup} src={assets.cross_icon} className='absolute top-4 right-4 w-4 cursor-pointer' alt="close" />
            </div>
          </div>
        )}

        <div className='pt-2'>
          <button
            type="submit"
            data-animate="button"
            disabled={isSubmitting}
            className="modern-btn text-white w-max py-2.5 px-8 inline-flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting && (
              <span className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
            )}
            {isSubmitting ? 'Processing...' : 'ADD COURSE'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddCourse
